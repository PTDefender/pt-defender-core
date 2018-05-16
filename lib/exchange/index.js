const BinanceClient = require('./binance')
const BittrexClient = require('./bittrex')
const PoloniexClient = require('./poloniex')

class Exchange {

  /**
   * @constructor
   * @param {String} options.exchange
   * @param {String} options.tradingKey
   * @param {String} options.tradingSecret
   */
  constructor({ exchange, tradingKey, tradingSecret }) {
    switch (exchange) {
      case 'BINANCE':
        this._client = new BinanceClient({ tradingKey, tradingSecret })
        break
      case 'BITTREX':
        this._client = new BittrexClient({ tradingKey, tradingSecret })
        break
      case 'POLONIEX':
        this._client = new PoloniexClient({ tradingKey, tradingSecret })
        break
      default:
        throw new Error('Invalid exchange:', exchange)
    }
  }

  /**
   * @param {ExchangeClient} client
   */
  get client() {
    return this._client
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
  openOrder() {
    return this.client.openOrder(...arguments)
  }

  /**
   * @method cancelOrder
   * @param {String} options.symbol
   * @param {String} options.orderId
   * @return {Promise}
   */
  cancelOrder() {
    return this.client.cancelOrder(...arguments)
  }
}

module.exports = Exchange
