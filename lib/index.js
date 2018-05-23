const { EventEmitter } = require('events')
const Api = require('./api')
const ProfitTrailer = require('./profit-trailer')
const logger = require('./logger')
const {
  INVALID_SESSION_ERROR,
  UNAUTHORIZED_ERROR,
  UNKNOWN_ERROR
} = require('./events')

class DefenderCore extends EventEmitter {

  /**
   * @constructor
   * @param {String} options.url
   * @param {String} options.license
   * @param {String} [options.session]
   * @param {String} options.exchange
   * @param {String} options.tradingKey
   * @param {String} options.tradingSecret
   */
  constructor({ url, license, session, serverToken, exchange, tradingKey, tradingSecret }) {
    if (!url) throw new Error('url is required')
    if (!license) throw new Error('license is required')
    if (!serverToken) throw new Error('serverToken is required')
    if (!exchange) throw new Error('exchange is required')
    if (!tradingKey) throw new Error('tradingKey is required')
    if (!tradingSecret) throw new Error('tradingSecret is required')

    super()
    this._api = new Api({ license, session, exchange, tradingKey, tradingSecret })
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

  /**
   * @method stop
   */
  stop() {
    clearInterval(this._authInterval)
    clearInterval(this._dataInterval)
    this._authInterval = null
    this._dataInterval = null
  }

  _startAuthInterval() {
    this._authInterval = setInterval(() => this._checkAuth(), 60 * 1000)
  }

  _startDataInterval() {
    this._dataInterval = setInterval(() => this._checkData(), 5 * 1000)
  }

  _checkAuth() {
    return this.api.me()
      .tapCatch(({ response, data }) => {
        switch (response.status) {
        case 401: return this.emit(UNAUTHORIZED_ERROR, { response, data })
        case 429: return this.emit(INVALID_SESSION_ERROR, { response, data })
        default: return this.emit(UNKNOWN_ERROR, { response, data })
        }
      })
  }

  _checkData() {
    return this.pt.data()
  }
}

module.exports = DefenderCore
