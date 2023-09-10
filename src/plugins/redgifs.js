import axios from 'axios';
import { JSDOM } from 'jsdom';
import { BasePlugin } from './baseplugin.js';

export class RedgifsClient extends BasePlugin {
  endpoint = 'https://www.redgifs.com/watch';
  urlTemplates = {
    gif: /https?\:\/\/(?:www\.)?redgifs.com\/watch\/(\w+)(?:\-.*)?/ig,
  };

  async fetch(url) {
    var conn;
    try {
      conn = await axios.get(url);
    } catch (err) {
      console.error(`Redgifs: Error fetching ${url}: ${err.response.status}`);
      return null;
    }

    const page = new JSDOM(conn.data);
    // FIXME: fix query string processing
    for (const script of page.window.document.getElementsByTagName("script")) {
      if (script.type === "application/ld+json") {
        const script_content = JSON.parse(script.text);
        const video_url = script_content.video.contentUrl.replace(/\-mobile\.mp4$/ig, ".mp4");

        return video_url;
      }
    }
    return null;
  }

  extractUrl(url, type) {
    switch (type) {
      case 'gif':
        const gifid = this.urlTemplates.gif.exec(url);
        return gifid ? gifid[1] : null;
    }
  }

  createUrl(gifid) {
    return `${this.endpoint}/${gifid}`;
  }

  check(url) {
    return !(url.match(this.urlTemplates.gif) == null);
  }
}
