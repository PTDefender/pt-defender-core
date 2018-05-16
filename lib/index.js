const Exchange = require('./exchange')

class DefenderCore {

  /**
   * @constructor
   * @param {String} options.license
   * @param {String} options.exchange
   * @param {String} options.tradingKey
   * @param {String} options.tradingSecret
   */
  constructor({ license, exchange, tradingKey, tradingSecret }) {
    if (!license) throw new Error('license is required')
    if (!exchange) throw new Error('exchange is required')
    if (!tradingKey) throw new Error('tradingKey is required')
    if (!tradingSecret) throw new Error('tradingSecret is required')

    this._license = license
    this._exchange = new Exchange({ exchange, tradingKey, tradingSecret })
  }

  /**
   * @param {String} license
   */
  get license() {
    return this._license
  }

  /**
   * @param {Exchange} exchange
   */
  get exchange() {
    return this._exchange
  }
}

module.exports = DefenderCore
