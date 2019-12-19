const http = require('http')
const https = require('https')
const axios = require('axios')

// Set the default adapter to prevent electron issues
axios.defaults.adapter = require('axios/lib/adapters/xhr')

class ProfitTrailer {
  /**
   * @constructor
   * @param {String} options.baseURL
   * @param {String} options.token
   */
  constructor({ baseURL, license, token, sitename = null }) {
    if (!baseURL) throw new Error('baseURL is required')
    if (!license) throw new Error('license is required')
    if (!token) throw new Error('token is required')

    this._sitename = sitename
    this._license = license
    this._token = token
    this._client = axios.create({
      baseURL,
      httpAgent: new http.Agent({
        keepAlive: true
      }),
      httpsAgent: new https.Agent({
        keepAlive: true,
        rejectUnauthorized: false
      }),
      validateStatus: status => {
        return status >= 200 && status < 400
      }
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
    return this._get('/api/v2/health')
  }

  /**
   * @method dca
   * @return {Promise}
   */
  dca() {
    return this._get('/api/v2/data/dca')
  }

  /**
   * @method pairs
   * @return {Promise}
   */
  pairs() {
    return this._get('/api/v2/data/pairs')
  }

  /**
   * @method pending
   * @return {Promise}
   */
  pending() {
    return this._get('/api/v2/data/pending')
  }

  /**
   * @method properties
   * @return {Promise}
   */
  properties() {
    return this._get('/api/v2/data/properties')
  }

  /**
   * @method buys
   * @return {Promise}
   */
  buys() {
    return this._get('/api/v2/data/buys')
  }

  /**
   * @method sales
   * @return {Promise}
   */
  sales() {
    return this._get('/api/v2/data/sales')
  }

  /**
   * @method stats
   * @return {Promise}
   */
  stats() {
    return this._get('/api/v2/data/stats')
  }

  /**
   * @method watchmode
   * @return {Promise}
   */
  watchmode() {
    return this._get('/api/v2/data/watchmode')
  }

  /**
   * @method errorsLog
   * @return {Promise}
   */
  errorsLog() {
    return this._get('/api/v2/errors/log')
  }

  /**
   * @method setHotConfig
   * @param {String} line
   * @return {Promise}
   */
  async setHotConfig(line) {
    const { activeConfig } = await this.properties()
    return this._post('/settingsapi/settings/save', {
      license: this._license,
      fileName: 'HOTCONFIG',
      configName: activeConfig,
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
    params.token = this._token
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
    params.token = this._token
    return this._request('post', url, { params })
  }

  /**
   * @private
   * @method _get
   * @param {String} url
   * @param {Object} [params]
   * @return {Promise}
   */
  async _request(method, url, { data, params } = {}) {
    let options = { method, url, data, params }
    let res = await this._client.request(options)
    return res.data
  }
}

module.exports = ProfitTrailer
