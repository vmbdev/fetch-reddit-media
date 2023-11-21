import axios from 'axios';
import { JSDOM } from 'jsdom';
import { BasePlugin } from './baseplugin.js';

export class RedgifsClient extends BasePlugin {
  endpoint = 'https://www.redgifs.com/watch';
  urlTemplates = {
    gif: /https?\:\/\/(?:.*\.)?redgifs.com\/watch\/(\w+)(?:\-.*)?/i,
  };

  async fetch(url) {
    let conn;

    try {
      conn = await axios.get(url);
    } catch (err) {
      console.error(`Redgifs: Error fetching ${url}: ${err.response.status}`);
      return null;
    }

    const page = new JSDOM(conn.data);
    let videoUrl = null;

    for (const script of page.window.document.getElementsByTagName("script")) {
      if (script.type === "application/ld+json") {
        const scriptContent = JSON.parse(script.text);
        videoUrl = scriptContent.video.contentUrl.replace(/\-mobile\.mp4$/i, ".mp4");

        break;
      }
    }

    return videoUrl;
  }

  extractUrl(url, type) {
    switch (type) {
      case 'gif':
        const gifId = this.urlTemplates.gif.exec(url);
        return gifId ? gifId[1] : null;
    }
  }

  createUrl(gifId) {
    return `${this.endpoint}/${gifId}`;
  }

  check(url) {
    return this.urlTemplates.gif.test(url);
  }
}
