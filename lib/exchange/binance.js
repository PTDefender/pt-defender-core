const Promise = require('bluebird')
const { BinanceRest } = require('binance')

class BinanceClient {

  /**
   * @constructor
   * @param {String} options.tradingKey
   * @param {String} options.tradingSecret
   */
  constructor({ tradingKey, tradingSecret }) {
    this._api = new BinanceRest({
      key: String(tradingKey),
      secret: String(tradingSecret)
    })
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
  openOrder({ symbol, side, type, quantity, price }) {
    let promise = this._api.newOrder({
      symbol: String(symbol),
      side: String(side),
      type: String(type),
      quantity: parseFloat(quantity),
      price: price ? parseFloat(price) : undefined,
      timeInForce: 'GTC', // TODO: look up what this is
      timestamp: Date.now()
    })
    return Promise.resolve(promise)
  }

  /**
   * @method cancelOrder
   * @param {String} options.symbol
   * @param {String} options.orderId
   * @return {Promise}
   */
  cancelOrder({ symbol, orderId }) {
    let promise = this._api.cancelOrder({
      symbol: String(symbol),
      origClientOrderId: String(orderId),
      timestamp: Date.now()
    })
    return Promise.resolve(promise)
  }
}

module.exports = BinanceClient
