import axios from 'axios';
import { JSDOM } from 'jsdom';

export class VidbleClient {
  constructor() {
    this.endpoint = 'https://www.vidble.com',
      this.urlTemplates = {
        images: /https?\:\/\/(?:www\.)?vidble.com\/(?:show|album)\/(\w+)/ig,
      };
  }

  async getImages(url) {
    var conn;
    try {
      conn = await axios.get(url);
    } catch (err) {
      console.error(`Vidble: Error fetching ${url}: ${err.response.status}`);
      return null;
    }

    const page = new JSDOM(conn.data);

    let imageList = [];
    for (let image of page.window.document.getElementsByTagName("img")) {
      if ((/^img\d/ig).exec(image.className) && (image.src))
        imageList.push(this.createUrl(image.src));
    }

    return imageList;
  }

  createUrl(imageHash) {
    let filename = imageHash.split("/");
    return `${this.endpoint}/${filename[filename.length - 1]}`;
  }

  extractUrl(url, type) {
    switch (type) {
      case 'image':
      case 'album':
        let imagesid = this.urlTemplates.image.exec(url);
        return imagesid ? imagesid[1] : null;
    }
  }

  isValidUrl(url) {
    return !(url.match(this.urlTemplates.images) == null);
  }
}



