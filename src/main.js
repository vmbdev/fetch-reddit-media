import fs from 'node:fs';
import path from 'node:path';
import { URL } from 'node:url';
import axios from 'axios';
import snoowrap from 'snoowrap';

import { ImgurClient } from './plugins/imgur.js';
import { GfycatClient } from './plugins/gfycat.js';
import { RedgifsClient } from './plugins/redgifs.js';
import { VidbleClient } from './plugins/vidble.js';

import { resultFile, gfycatConfig, imgurConfig, snoowrapConfig } from '../config.js';
import { exit } from 'node:process';

const addLinks = (link, list) => {
  if (link) {
    if (Array.isArray(link)) {
      const unique_values = link.filter(i => !list.includes(i));
      list.push(...unique_values);
    }

    else if (!list.includes(link))
      list.push(link);
  }
}

const download = async (url, dest) => {
  const response = await axios.get(url, { responseType: 'stream' });

  if (response) {
    // extract filename from URL
    const nurl = new URL(url);
    const filename = path.basename(nurl.pathname);

    response.data.pipe(fs.createWriteStream(path.join(dest, filename)));
  };
}

const processArgs = () => {
  const args = {};

  for (let i = 1; i < process.argv.length; i++) {
    switch (process.argv[i]) {
      case '--user': {
        if (process.argv[i+1]) {
          args.user = process.argv[i+1];
          i++;
        }
        else exitWithError('Error: "user" must specify a username.');
        break;
      }
      case '--download': {
        args.download = true;
        break;
      }
      case '--dest': {
        if (process.argv[i+1]) {
          args.dest = process.argv[i+1];
          i++;
        }
        else exitWithError('Error: "dest" must specify a valid directory.');
        break;
      }
      case '--max': {
        if (process.argv[i+1]) {
          args.max = Number.parseInt(process.argv[i+1]);

          if (!args.max) exitWithError('Error: "max" must be a positive integer.');

          i++;
        }
        break;
      }
      case '--subreddit': {
        if (process.argv[i+1]) {
          args.subreddit = process.argv[i+1];
          i++;
        }
        else exitWithError('Error: "subreddit" must specify a subreddit name.');
        break;
      }
    }
  }

  return args;
}

const exitWithError = (error) => {
  console.error(error);
  exit();
}

const getRedditPosts = async (options) => {
  const reddit = new snoowrap(snoowrapConfig);
  let postsItem;
  let posts;

  if (options.source.type === 'user') {
    postsItem = reddit.getUser(options.source.data).getSubmissions();
  }
  else postsItem = reddit.getSubreddit(options.source.data).getHot();

  try {
    if (options.max) posts = await postsItem.fetchMore(options.max);
    else posts = await postsItem.fetchAll();
  } catch (error) {
    exitWithError(`Error: can't fetch posts for ${options.source.data}`);
  }

  return posts;
}


const main = async () => {
  const args = processArgs();

  if (!args.user && !args.subreddit) {
    exitWithError('User or subreddit not specified.');
  }

  const posts = await getRedditPosts({
    source: args.user ?
      { type: 'user', data: args.user } :
      { type: 'subreddit', data: args.subreddit },
    max: args.max ? args.max : null
  });

  const plugins = [
    new ImgurClient(imgurConfig),
    new GfycatClient(gfycatConfig),
    new RedgifsClient(),
    new VidbleClient(),
  ];

  // for links pointing directly to Reddit media
  const redditLinks = [];

  // for links pointing outside of Reddit, we first gotta find the media url
  const downloadList = [];

  for (const post of posts) {
    // if content is uploaded directly to Reddit
    if (post.media_metadata) {
      const mediaLinks = [];

      for (const media in post.media_metadata) {
        if (post.media_metadata[media].status == 'valid')
          mediaLinks.push(post.media_metadata[media].s.u);
      }

      addLinks(mediaLinks, redditLinks);
    }

    // if content is uploaded to a third-party (imgur, gfycat, etc)
    else {
      if (post.url) {
        let pluginDownloadAvailable = false;

        for (const plugin of plugins) {
          if (plugin.check(post.url)) {
            downloadList.push(plugin.fetch(post.url));
            pluginDownloadAvailable = true;
            break;
          }
        }

        if (!pluginDownloadAvailable) addLinks(post.url, redditLinks);
      }
    }
  }

  // retrieve in parallel the links
  await Promise.all(downloadList.map(async (download) => {
    const link = await download;
    addLinks(link, redditLinks);
  }));

  if (redditLinks.length > 0) {
    if (args.download) {
      const defaultDest = `./downloads/${args.user ? args.user : args.subreddit}`;
      const dest = args.dest ? args.dest : defaultDest;

      fs.mkdirSync(dest, { recursive: true });

      for (const link of redditLinks) {
        console.log(`Downloading ${link}`);

        try {
          await download(link, dest);
        } catch (err) {
          console.error(`Failed to download ${link}`);
        }
      }
    }
    else {
      // overwrite resultFile with the links
      fs.writeFile(resultFile, redditLinks.join('\r\n'), (err) => {
        if (err) exitWithError(`Error writing results: ${err}`);
      });
    }
  }
}

main().then(() => {
  console.log('Operation finished');
});