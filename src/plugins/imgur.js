import axios from 'axios';
import { BasePlugin } from './baseplugin.js';

export class ImgurClient extends BasePlugin {
  endpoint = 'https://api.imgur.com/3';
  urlTemplates = {
    main: /https?\:\/\/(?:(?:www|i|m)\.)?imgur.com\/.*/i,
    album: /https?\:\/\/(?:m\.)?imgur.com\/a\/(\w+)$/i,
    gifv: /https?\:\/\/(?:(?:www|i|m)\.)?imgur.com\/(.+)\.gifv$/i,
    image: /https?\:\/\/(?:m\.)?imgur.com\/(\w+)$/i,
    directLink: /https?\:\/\/i\.imgur.com\/(\w+)\.(?:\w+)/i
  };

  constructor(config) {
    super();

    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.headers = {
      headers: { 'Authorization': `Client-ID ${this.clientId}` }
    };
  }

  async getImage(imageHash) {
    let response;
    const url = `${this.endpoint}/image/${imageHash}`;

    try {
      response = await axios.get(url, this.headers);
    } catch (err) {
      console.log(
        `Imgur: Error fetching image ${imageHash}: ${err.response.status}`
      );

      return null;
    }

    return response.data.data.link;
  }

  async getAlbum(albumHash) {
    let response;
    const url = `${this.endpoint}/album/${albumHash}/images`;

    try {
      response = await axios.get(url, this.headers);
    } catch (err) {
      console.log(
        `Imgur: Error fetching album ${albumHash}: ${err.response.status}`
      );

      return null;
    }

    const imageList = [];

    for (const image of response.data.data) {
      imageList.push(image.link);
    }

    return imageList;
  }

  getGifv(url) {
    return url.replace(/gifv$/i, 'mp4');
  }

  async fetch(url) {
    if (this.urlTemplates.gifv.test(url)) {
      return this.getGifv(url);
    }

    else if (this.urlTemplates.album.test(url)) {
      const id = this.extractUrl(url, 'album');

      if (id) return this.getAlbum(id);
    }

    else if (this.urlTemplates.image.test(url)) {
      const id = this.extractUrl(url, 'image');

      if (id) return this.getImage(id);
    }

    else if (this.urlTemplates.directLink.test(url)) {
      const id = this.extractUrl(url, 'directLink');

      if (id) return this.getImage(id);
    }

    return null;
  }

  extractUrl(url, type) {
    let regex;

    switch (type) {
      case 'album': {
        regex = this.urlTemplates.album;
        break;
      }

      case 'image': {
        regex = this.urlTemplates.image;
        break;
      }

      case 'directLink': {
        regex = this.urlTemplates.directLink;
        break;
      }
    }

    const res = regex.exec(url);

    if (res && res.length > 1) return res[1];
    else return null;
  }

  check(url) {
    return this.urlTemplates.main.test(url);
  }
}
