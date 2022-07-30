import { gfycatConfig, imgurConfig, snoowrapConfig } from '../config.js';
import snoowrap from 'snoowrap';
import { ImgurClient } from './imgurclient.js';
import { GfycatClient } from './gfycatclient.js';
import { RedgifsClient } from './redgifsclient.js';
import { VidbleClient } from './vidbleclient.js';
import fs from 'fs';

const OUTPUT_FILE = './results.json';

function addLinks(link, list) {
  if (link) {
    if (link.constructor.name === "Array") {
      let unique_values = link.filter(i => !list.includes(i));
      list.push(...unique_values);
    }

    else if (!list.includes(link))
      list.push(link);
  }
}

(function() {
  if (!process.argv[2])
  console.error('Not enough parameters');

  else if (process.argv.length >= 3) {
    if (process.argv[2] == '--user') {
      let link_list = [];
      let promise_list = [];
      const reddit = new snoowrap(snoowrapConfig);
      const imgur = new ImgurClient(imgurConfig);
      const gfycat = new GfycatClient(gfycatConfig);
      const redgifs = new RedgifsClient();
      const vidble = new VidbleClient();
      
      reddit.getUser(process.argv[3]).getSubmissions().fetchAll()
      .then(async post_list => {
        if (Array.isArray(post_list)) {
          for (let post of post_list) {
            if (post.media_metadata) {
              let media_list = [];
              
              for (let media in post.media_metadata) {
                if (post.media_metadata[media].status == 'valid')
                  media_list.push(post.media_metadata[media].s.u);
              }

              addLinks(media_list, link_list);
            }
            else {
              if (post.url) {
                if (imgur.isValidUrl(post.url))
                  promise_list.push(imgur.getMedia(post.url));
                
                else if (gfycat.isValidUrl(post.url)) {
                  let gfyid = gfycat.extractUrl(post.url, 'gfycat');
                  promise_list.push(gfycat.getGfycat(gfyid));
                }

                else if (redgifs.isValidUrl(post.url)) 
                  promise_list.push(redgifs.getGif(post.url));

                else if (vidble.isValidUrl(post.url))
                  promise_list.push(vidble.getImages(post.url));
                
                else
                  addLinks(post.url, link_list);
              }
            }
          }
          await Promise.all(promise_list.map(async (promise) => {
            let link = await promise;
            addLinks(link, link_list);
          }));
        }
      })
      .then(() => {
        fs.stat(OUTPUT_FILE, (err) => {
          if (!err)
            fs.unlink(OUTPUT_FILE, err => { if (err) throw `Error deleting previous file: ${err.code}` });

          fs.writeFile(OUTPUT_FILE, JSON.stringify(link_list), err => { if (err) throw `Error writing results: ${err.code}` });
        });
      });
    }
    
    else {
      console.error('Unrecognized options');
    }
  }
})();