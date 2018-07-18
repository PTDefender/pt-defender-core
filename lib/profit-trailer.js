const Promise = require('bluebird')
const http = require('http')
const https = require('https')
const axios = require('axios')

class ProfitTrailer {

  /**
   * @constructor
   * @param {String} options.url
   * @param {String} options.license
   * @param {String} options.serverToken
   */
  constructor({ url, license, serverToken, sitename = null }) {
    if (!url) throw new Error('url is required')
    if (!license) throw new Error('license is required')
    if (!serverToken) throw new Error('serverToken is required')

    this._license = license
    this._sitename = sitename
    this._serverToken = serverToken
    this._client = axios.create({
      baseURL: url,
      httpAgent: new http.Agent({
        keepAlive: true,
        keepAliveMsecs: 10000
      }),
      httpsAgent: new https.Agent({
        keepAlive: true,
        keepAliveMsecs: 10000,
        rejectUnauthorized: false
      })
    })
  }

  /**
   * @param {String} sitename
   */
  get sitename() {
    return this._sitename
  }

  /**
   * @method health
   * @return {Promise}
   */
  health() {
    return this._get('/api/health')
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
   * @method setHotConfig
   * @param {String} line
   * @return {Promise}
   */
  setHotConfig(line) {
    return this._post('/settingsapi/settings/save', {
      fileName: 'HOTCONFIG',
      configName: 'default',
      saveData: line
    })
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
    return this._request('get', url, { params })
  }

  /**
   * @private
   * @method _post
   * @param {String} url
   * @param {Object} [data]
   * @return {Promise}
   */
  _post(url, params = {}) {
    params.license = this._license
    return this._request('post', url, { params })
  }

  /**
   * @private
   * @method _get
   * @param {String} url
   * @param {Object} [params]
   * @return {Promise}
   */
  _request(method, url, { data, params } = {}) {
    let options = { method, url, data, params }
    return Promise.resolve(this._client.request(options))
      .then(res => res.data)
  }
}

module.exports = ProfitTrailer
