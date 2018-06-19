const Promise = require('bluebird')
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
  constructor({ authToken, session, exchangeType, tradingKey, tradingSecret }) {
    if (!authToken) throw new Error('authToken is required')
    if (!exchangeType) throw new Error('exchangeType is required')
    if (!tradingKey) throw new Error('tradingKey is required')
    if (!tradingSecret) throw new Error('tradingSecret is required')

    let clientOptions = {
      baseURL: 'https://api.ptdefender.com',
      headers: {
        Authorization: `Bearer ${authToken}`,
        'X-Defender-Session': session || null
      }
    }

    this._exchangeType = exchangeType
    this._tradingKey = tradingKey
    this._tradingSecret = tradingSecret
    this._client = axios.create(clientOptions)
  }

  /**
   * @method me
   */
  me() {
    return this._request('get', '/user/me')
  }

  /**
   * @method createSession
   */
  createSession() {
    let data = {
      exchangeType: this._exchangeType,
      tradingKey: this._tradingKey,
      tradingSecret: this._tradingSecret
    }
    return this._request('post', '/auth/session', { data })
      .then(auth => auth.sessions[0].identifier)
  }

  /**
   * @method deleteSession
   */
  deleteSession() {
    return this._request('delete', '/auth/session')
      .tap(() => (this._client.defaults.headers['X-Defender-Session'] = null))
  }

  /**
   * @method jobs
   */
  jobs() {
    return this._request('get', '/job')
  }

  /**
   * @method createJob
   */
  createJob(data) {
    return this._request('post', '/job', { data })
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

module.exports = Api
