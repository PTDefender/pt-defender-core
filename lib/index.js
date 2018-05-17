const Api = require('./api')
const Exchange = require('./exchange')

class DefenderCore {

  /**
   * @constructor
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

    this._api = new Api({ url, license, serverToken })
    this._exchange = new Exchange({ exchange, tradingKey, tradingSecret })
  }

  /**
   * @param {Api} api
   */
  get api() {
    return this._api
  }

  /**
   * @param {Exchange} exchange
   */
  get exchange() {
    return this._exchange
  }
}

module.exports = DefenderCore
