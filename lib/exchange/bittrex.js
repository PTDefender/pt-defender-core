const Promise = require('bluebird')
const Bittrex = require('bittrex-wrapper')

class BittrexClient {

  /**
   * @constructor
   * @param {String} options.tradingKey
   * @param {String} options.tradingSecret
   */
  constructor({ tradingKey, tradingSecret }) {
    this._api = new Bittrex(tradingKey, tradingSecret)
  }

  /**
   * @method openOrder
   * @param {String} options.symbol
   * @param {String} options.side
   * @param {String} options.type
   * @param {Number} options.quantity
   * @param {Number} options.price
   * @return {Promise}
   */
  openOrder(/** { symbol, side, type, quantity, price } */) {
    return Promise.resolve()
  }

  /**
   * @method cancelOrder
   * @param {String} options.symbol
   * @param {String} options.orderId
   * @return {Promise}
   */
  cancelOrder(/** { symbol, orderId } */) {
    return Promise.resolve()
  }
}

module.exports = BittrexClient
