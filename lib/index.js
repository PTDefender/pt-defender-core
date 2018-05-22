const Api = require('./api')
const ProfitTrailer = require('./profit-trailer')
const logger = require('./logger')

class DefenderCore {

  /**
   * @constructor
   * @param {String} options.url
   * @param {String} options.license
   * @param {String} options.exchange
   * @param {String} options.tradingKey
   * @param {String} options.tradingSecret
   */
  constructor({ url, license, serverToken, exchange, tradingKey, tradingSecret }) {
    if (!url) throw new Error('url is required')
    if (!license) throw new Error('license is required')
    if (!serverToken) throw new Error('serverToken is required')
    if (!exchange) throw new Error('exchange is required')
    if (!tradingKey) throw new Error('tradingKey is required')
    if (!tradingSecret) throw new Error('tradingSecret is required')

    this._api = new Api({ license, exchange, tradingKey, tradingSecret })
    this._pt = new ProfitTrailer({ url, serverToken })
    this._authInterval = null
    this._dataInterval = null
  }

  /**
   * @param {Api} api
   */
  get api() {
    return this._api
  }

  /**
   * @param {ProfitTrailer} pt
   */
  get pt() {
    return this._pt
  }

  /**
   * @param {Logger} logger
   */
  get logger() {
    return logger
  }

  /**
   * @method start
   */
  start() {
    this._startAuthInterval()
    this._startDataInterval()
  }

  _startAuthInterval() {
    this._authInterval = setInterval(() => this._checkAuth(), 60 * 1000)
  }

  _startDataInterval() {
    this._dataInterval = setInterval(() => this._checkData(), 5 * 1000)
  }

  _checkAuth() {
    return this.api.me()
  }

  _checkData() {
    return this.pt.data()
  }
}

module.exports = DefenderCore
