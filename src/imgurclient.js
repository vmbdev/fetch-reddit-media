import axios from 'axios';

export class ImgurClient {
  endpoint = 'https://api.imgur.com/3';
  urlTemplates = {
    main: /https?\:\/\/(?:(?:www|i|m)\.)?imgur.com\/.*/ig,
    album: /https?\:\/\/(?:m\.)?imgur.com\/a\/(\w+)$/ig,
    gifv: /https?\:\/\/(?:(?:www|i|m)\.)?imgur.com\/(.+)\.gifv$/ig,
    image: /https?\:\/\/(?:m\.)?imgur.com\/(\w+)$/ig
  };

  constructor(config) {
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.headers = {
      headers: { 'Authorization': `Client-ID ${this.clientId}` }
    };
  }

  async getImage(imageHash) {
    let response;
    try {
      response = await axios.get(`${this.endpoint}/image/${imageHash}`, this.headers);
    } catch (err) {
      console.log(`Imgur: Error fetching image ${imageHash}: ${err.response.status}`);
      return null;
    }
    return response.data.data.link;
  }

  async getAlbum(albumHash) {
    let response;
    try {
      response = await axios.get(`${this.endpoint}/album/${albumHash}/images`, this.headers);
    } catch (err) {
      console.log(`Imgur: Error fetching album ${albumHash}: ${err.response.status}`);
      return null;
    }
    let imageList = [];
    for (let image of response.data.data)
      imageList.push(image.link);

    return imageList;
  }

  async getGifv(url) {
    return url.replace(/gifv$/i, 'mp4');
  }

  async getMedia(url) {
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
      case 'album':
        let albumHash = this.urlTemplates.album.exec(url);
        return albumHash ? albumHash[1] : null;

      case 'image':
        let imageHash = this.urlTemplates.image.exec(url);
        return imageHash ? imageHash[1] : null;
    }
  }

  isValidUrl(url) {
    return !(url.match(this.urlTemplates.main) == null);
  }
}







