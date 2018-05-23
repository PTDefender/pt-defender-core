const Promise = require('bluebird')
const axios = require('axios')

class Api {

  /**
   * @constructor
   * @param {String} options.license
   * @param {String} options.exchange
   * @param {String} options.tradingKey
   * @param {String} options.tradingSecret
   */
  constructor({ license, session, exchange, tradingKey, tradingSecret }) {
    if (!license) throw new Error('license is required')
    if (!exchange) throw new Error('exchange is required')
    if (!tradingKey) throw new Error('tradingKey is required')
    if (!tradingSecret) throw new Error('tradingSecret is required')

    let clientOptions = {
      baseURL: 'https://api.ptdefender.com',
      headers: {
        'Authorization': `Bearer ${license}`,
        'X-Defender-Exchange': exchange,
        'X-Defender-Exchange-Key': tradingKey,
        'X-Defender-Exchange-Secret': tradingSecret,
        'X-Defender-Session': session || null
      }
    }

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
    return this._request('post', '/auth/session')
      .then(auth => auth.sessions[0].identifier)
      .tap(session => this._client.defaults.headers['X-Defender-Session'] = session)
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
