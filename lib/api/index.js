const Promise = require('bluebird')
const querystring = require('querystring')
const axios = require('axios')

class Api {

  /**
   * @constructor
   * @param {String} options.url
   * @param {String} options.license
   * @param {String} options.serverToken
   */
  constructor({ url, license, serverToken }) {
    this._license = license
    this._serverToken = serverToken
    this._client = axios.create({
      baseURL: url
    })
  }

  /**
   * @method data
   * @return {Promise}
   */
  data() {
    return this._get('/api/data')
  }

  /**
   * @method dcaLog
   * @return {Promise}
   */
  dcaLog() {
    return this._get('/api/dca/log')
  }

  /**
   * @method errorsLog
   * @return {Promise}
   */
  errorsLog() {
    return this._get('/api/errors/log')
  }

  /**
   * @method pairsLog
   * @return {Promise}
   */
  pairsLog() {
    return this._get('/api/pairs/log')
  }

  /**
   * @method salesLog
   * @return {Promise}
   */
  salesLog() {
    return this._get('/api/sales/log')
  }

  /**
   * @private
   * @method _get
   * @param {String} url
   * @param {Object} [params]
   * @return {Promise}
   */
  _get(url, params = {}) {
    params.token = this._serverToken
    let promise = this._client.get(url, { params })
    return Promise.resolve(promise)
      .then(res => res.data)
  }

  /**
   * @private
   * @method _post
   * @param {String} url
   * @param {Object} [data]
   * @return {Promise}
   */
  _post(url, data = {}) {
    data.license = this._license
    let promise = this._client.post(url, {
      data: querystring.stringify(data)
    })
    return Promise.resolve(promise)
      .then(res => res.data)
  }
}

module.exports = Api
