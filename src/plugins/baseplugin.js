export class BasePlugin {
  constructor() {
    if ((typeof this.check !== 'function') || (typeof this.fetch !== 'function')) {
      throw new Error('Plugin does not implements check and fetch functions');
    }
  }
}