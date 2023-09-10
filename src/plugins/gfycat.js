import axios from 'axios';
import { BasePlugin } from './baseplugin.js';
import { RedgifsClient } from './redgifs.js';

export class GfycatClient extends BasePlugin {
  endpoint = 'https://api.gfycat.com/v1';
  urlTemplates = {
    gfycat: /https?\:\/\/gfycat.com(?:\/gifs\/detail)?\/(\w+)(?:\-.*)?/ig,
  };

  constructor(config) {
    super();

    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.accessToken = config.accessToken ? config.accessToken : null;
    this.headers = { headers: { 'Authorization': `Bearer ${this.accessToken}` } };
  }

  async getAccessToken() {
    const authHeader = {
      client_id: this.clientId,
      client_secret: this.clientSecret,
      grant_type: 'client_credentials'
    };

    const request = await axios.post(`${this.endpoint}/oauth/token`, authHeader);
    return request.data;
  }

  async fetch(rawUrl) {
    let response;
    const gfyid = this.extractUrl(rawUrl);
    const url = `${this.endpoint}/gfycats/${gfyid}`;

    try {
      response = await axios.get(url, this.headers);
    } catch (err) {
      console.error(
        `GfyCat: Error fetching ${gfyid}: ${err.response.status}. Trying with Redgifs.`
      );

      const redgifs = new RedgifsClient();
      return redgifs.getGif(redgifs.createUrl(gfyid))
        .then(res => res)
        .catch(() => null);
    }

    return response.data.gfyItem.mp4Url;
  }

  extractUrl(url) {
    const albumHash = this.urlTemplates.gfycat.exec(url);
    return albumHash ? albumHash[1] : null;
  }

  check(url) {
    return !(url.match(this.urlTemplates.gfycat) == null);
  }
}