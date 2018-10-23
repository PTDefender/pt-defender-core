const https = require('https')
const axios = require('axios')

class Api {

  /**
   * @constructor
   * @param {String} options.authToken
   * @param {String} options.session
   * @param {String} options.exchange
   * @param {String} options.tradingKey
   * @param {String} options.tradingSecret
   */
  constructor({ authToken, session, exchangeType, tradingKey, tradingSecret, api }) {
    if (!authToken) throw new Error('authToken is required')
    if (!exchangeType) throw new Error('exchangeType is required')
    if (!tradingKey) throw new Error('tradingKey is required')
    if (!tradingSecret) throw new Error('tradingSecret is required')

    this._exchangeType = exchangeType
    this._tradingKey = tradingKey
    this._tradingSecret = tradingSecret
    this._client = axios.create({
      baseURL: api || 'https://api.ptdefender.com',
      headers: {
        authorization: `Bearer ${authToken}`,
        'x-defender-session': session || null
      },
      httpsAgent: new https.Agent({
        keepAlive: true
      })
    })
  }

  /**
   * @method me
   */
  me() {
    return this._request('get', '/user/me')
  }

  /**
   * @method download
   */
  download() {
    return this._request('get', '/auth/download')
  }

  /**
   * @method createSession
   */
  async createSession() {
    let data = {
      exchangeType: this._exchangeType,
      tradingKey: this._tradingKey,
      tradingSecret: this._tradingSecret
    }
    let { id } = await this._request('post', '/auth/session', { data })
    this._client.defaults.headers['x-defender-session'] = id
    return id
  }

  /**
   * @method currentSession
   */
  async currentSession() {
    return this._request('get', '/auth/session')
  }

  /**
   * @method deleteSession
   */
  async deleteSession() {
    await this._request('delete', '/auth/session')
    this._client.defaults.headers['x-defender-session'] = null
  }

  /**
   * @method jobs
   */
  jobs(params) {
    return this._request('get', '/job', { params })
  }

  /**
   * @method jobLogs
   */
  jobLogs(params) {
    return this._request('get', '/job-log', { params })
  }

  /**
   * @method createJob
   */
  createJob(data) {
    return this._request('post', '/job', { data })
  }

  /**
   * @method updateJob
   */
  updateJob(id, data) {
    return this._request('put', `/job/${id}`, { data })
  }

  /**
   * @method stopJob
   */
  stopJob(id, data) {
    return this._request('post', `/job/${id}/stop`, { data })
  }

  /**
   * @method jobOrderHistory
   */
  jobOrderHistory(id, data) {
    return this._request('post', `/job/${id}/order-history`, { data })
  }

  /**
   * @method updateSettings
   */
  updateSettings(id, data) {
    return this._request('put', `/settings/${id}`, { data })
  }

  /**
   * @method calculate
   */
  calculate(data) {
    return this._request('post', '/job/calculate', { data })
  }

  /**
   * @method boughtPrice
   */
  boughtPrice(data) {
    return this._request('post', '/job/bought-price', { data })
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

module.exports = Api
