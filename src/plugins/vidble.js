import axios from 'axios';
import { JSDOM } from 'jsdom';
import { BasePlugin } from './baseplugin.js';

export class VidbleClient extends BasePlugin {
  endpoint = 'https://www.vidble.com';
  urlTemplates = {
    images: /https?\:\/\/(?:www\.)?vidble.com\/(?:show|album)\/(\w+)/ig,
  };

  async fetch(url) {
    let conn;

    try {
      conn = await axios.get(url);
    } catch (err) {
      console.error(`Vidble: Error fetching ${url}: ${err.response.status}`);
      return null;
    }

    const page = new JSDOM(conn.data);
    const imageList = [];

    for (const image of page.window.document.getElementsByTagName("img")) {
      if ((/^img\d/ig).exec(image.className) && (image.src))
        imageList.push(this.createUrl(image.src));
    }

    return imageList;
  }

  createUrl(imageHash) {
    const filename = imageHash.split("/");
    return `${this.endpoint}/${filename[filename.length - 1]}`;
  }

  extractUrl(url, type) {
    switch (type) {
      case 'image':
      case 'album':
        const imagesid = this.urlTemplates.image.exec(url);
        return imagesid ? imagesid[1] : null;
    }
  }

  check(url) {
    return !(url.match(this.urlTemplates.images) == null);
  }
}
