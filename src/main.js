import fs from 'node:fs';
import path from 'node:path';
import { URL } from 'node:url';
import { exit } from 'node:process';
import axios from 'axios';
import snoowrap from 'snoowrap';
import { Command, InvalidArgumentError } from 'commander';

import { ImgurClient } from './plugins/imgur.js';
import { RedgifsClient } from './plugins/redgifs.js';
import { VidbleClient } from './plugins/vidble.js';

import { config } from '../config.js';

const addLinks = (link, list) => {
  if (link) {
    if (Array.isArray(link)) {
      const uniqueValues = link.filter(i => !list.includes(i));
      list.push(...uniqueValues);
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

const getArgs = () => {
  const program = new Command();

  program
    .name('fetch-reddit-media')
    .description('Fetch media from Reddit subreddits and profiles')
    .version('0.4.0', '-v, --vers')
    .option('-u, --user <username>', 'Search in a user profile')
    .option('-s, --subreddit <subreddit>', 'Search in a subreddit')
    .option('-d, --download', 'The media found will be downloaded')
    .option('-o, --dest <destiny>', 'When downloading, the output directory')
    .option(
      '-m, --max <number>', 'The number of posts to fetch',
      commanderParseNumber
    )

  program.parse();

  return program.opts();
}

function commanderParseNumber(value, previous) {
  const parsedValue = parseInt(value, 10);

  if (isNaN(parsedValue)) {
    throw new InvalidArgumentError('Not a number.');
  }

  return parsedValue;
}

const exitWithError = (error) => {
  console.error(error);
  exit();
}

const getRedditPosts = async (options) => {
  const reddit = new snoowrap(config.reddit);
  let postsItem;
  let posts;

  if (options.source.type === 'user') {
    postsItem = reddit.getUser(options.source.data).getSubmissions();
  }
  else postsItem = reddit.getSubreddit(options.source.data).getHot();

  try {
    if (options.max) {
      posts = await postsItem.fetchMore(options.max);
    }
    else {
      posts = await postsItem.fetchAll();
    }
  } catch (error) {
    exitWithError(`Error: can't fetch posts for ${options.source.data}`);
  }

  return posts;
}

const loadPlugins = (pluginList) => {
  const plugins = [];

  if (pluginList.includes('imgur')) {
    plugins.push(new ImgurClient(config.imgur));
  }
  if (pluginList.includes('redgifs')) {
    plugins.push(new RedgifsClient());
  }
  if (pluginList.includes('vidble')) {
    plugins.push(new VidbleClient());
  }

  return plugins;
}

const main = async () => {
  const args = getArgs();

  if (!args.user && !args.subreddit) {
    exitWithError('User or subreddit not specified.');
  }

  const posts = await getRedditPosts({
    source: args.user ?
      { type: 'user', data: args.user } :
      { type: 'subreddit', data: args.subreddit },
    max: args.max ? args.max : null
  });

  const plugins = loadPlugins(config.plugins);

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
            const res = plugin.fetch(post.url);

            if (res) downloadList.push(res);
            
            // if a plugin can process the url, then stop looking
            pluginDownloadAvailable = true;
            break;
          }
        }

        // if there's no plugin available to process the link, we add it as is
        if (!pluginDownloadAvailable) {
          addLinks(post.url, redditLinks);
        }
      }
    }
  }

  // retrieve in parallel the links
  const links = await Promise.all(downloadList);
  addLinks(links, redditLinks);

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
      fs.writeFile(config.resultFile, redditLinks.join('\r\n'), (err) => {
        if (err) exitWithError(`Error writing results: ${err}`);
      });
    }
  }
}

main().then(() => {
  console.log('Operation finished');
});
