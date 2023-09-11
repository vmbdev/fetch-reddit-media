import axios from 'axios';
import { BasePlugin } from './baseplugin.js';

export class ImgurClient extends BasePlugin {
  endpoint = 'https://api.imgur.com/3';
  urlTemplates = {
    main: /https?\:\/\/(?:(?:www|i|m)\.)?imgur.com\/.*/ig,
    album: /https?\:\/\/(?:m\.)?imgur.com\/a\/(\w+)$/ig,
    gifv: /https?\:\/\/(?:(?:www|i|m)\.)?imgur.com\/(.+)\.gifv$/ig,
    image: /https?\:\/\/(?:m\.)?imgur.com\/(\w+)$/ig
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

    for (const image of response.data.data)
      imageList.push(image.link);

    return imageList;
  }

  async getGifv(url) {
    return url.replace(/gifv$/i, 'mp4');
  }

  async fetch(url) {
    if (url.match(this.urlTemplates.gifv))
      return this.getGifv(url);

    else if (url.match(this.urlTemplates.album))
      return this.getAlbum(this.extractUrl(url, 'album'));

    else if (url.match(this.urlTemplates.image))
      return this.getImage(this.extractUrl(url, 'image'));

    else if (this.isValidUrl(url))
      return url;
  }

  extractUrl(url, type) {
    switch (type) {
      case 'album': {
        const albumHash = this.urlTemplates.album.exec(url);
        return albumHash ? albumHash[1] : null;
      }

      case 'image': {
        const imageHash = this.urlTemplates.image.exec(url);
        return imageHash ? imageHash[1] : null;
      }
    }
  }

  check(url) {
    return !(url.match(this.urlTemplates.main) == null);
  }
}
