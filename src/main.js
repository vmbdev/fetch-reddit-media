import fs from 'node:fs';
import path from 'node:path';
import { URL } from 'node:url';
import axios from 'axios';
import snoowrap from 'snoowrap';

import { ImgurClient } from './imgurclient.js';
import { GfycatClient } from './gfycatclient.js';
import { RedgifsClient } from './redgifsclient.js';
import { VidbleClient } from './vidbleclient.js';

import { resultFile, gfycatConfig, imgurConfig, snoowrapConfig } from '../config.js';
import { exit } from 'node:process';

const addLinks = (link, list) => {
  if (link) {
    if (link.constructor.name === "Array") {
      let unique_values = link.filter(i => !list.includes(i));
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


const main = async () => {
  const args = processArgs();

  if (!args.user) exitWithError('User not specified');

  const reddit = new snoowrap(snoowrapConfig);
  const imgur = new ImgurClient(imgurConfig);
  const gfycat = new GfycatClient(gfycatConfig);
  const redgifs = new RedgifsClient();
  const vidble = new VidbleClient();
  const redditLinks = [];
  const downloadList = [];

  let posts;
  try {
    posts = await reddit.getUser(args.user).getSubmissions().fetchAll();
  } catch (error) {
    console.error(`Error: can't fetch user ${args.user}`);
    exit();
  }

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
        if (imgur.isValidUrl(post.url))
          downloadList.push(imgur.getMedia(post.url));

        else if (gfycat.isValidUrl(post.url)) {
          const gfyid = gfycat.extractUrl(post.url, 'gfycat');
          downloadList.push(gfycat.getGfycat(gfyid));
        }

        else if (redgifs.isValidUrl(post.url))
          downloadList.push(redgifs.getGif(post.url));

        else if (vidble.isValidUrl(post.url))
          downloadList.push(vidble.getImages(post.url));

        else
          addLinks(post.url, redditLinks);
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
      const dest = args.dest ? args.dest : `./downloads/${args.user}`;
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
      fs.stat(resultFile, (err) => {
        // if results file exists, delete (unlink) it
        if (!err) {
          try {
            fs.unlinkSync(resultFile);
          } catch (err) {
            exitWithError(`Error deleting previous file: ${err.code}`);
          }
        }

        try {
          fs.writeFile(resultFile, redditLinks.join('\r\n'));
        } catch (err) {
          exitWithError(`Error writing results: ${err.code}`);
        }
      });
    }
  }
}

main();