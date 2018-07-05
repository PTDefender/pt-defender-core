const BinanceClient = require('./clients/binance')
const BittrexClient = require('./clients/bittrex')
const PoloniexClient = require('./clients/poloniex')
const { BINANCE, BITTREX, POLONIEX } = require('./type')

class ExchangeClient {

  /**
   * @constructor
   * @param {String} options.type
   * @param {String} options.key
   * @param {String} options.secret
   */
  constructor({ type, key, secret }) {
    this._clientType = type
    switch (type) {
      case BINANCE:
        this._client = new BinanceClient({ key, secret })
        break
      case BITTREX:
        this._client = new BittrexClient({ key, secret })
        break
      case POLONIEX:
        this._client = new PoloniexClient({ key, secret })
        break
      default:
        throw new Error('Invalid exchange type:', type)
    }
  }

  /**
   * @param {ExchangeClient} client
   */
  get client() {
    return this._client
  }

  /**
   * @method accountValue
   * @param {String} options.currency
   * @return {Promise}
   */
  accountValue() {
    return this.client.accountValue(...arguments)
  }

  /**
   * @method marketValue
   * @param {String} options.currency
   * @param {String} options.baseCurrency
   * @return {Promise}
   */
  marketValue() {
    return this.client.marketValue(...arguments)
  }

  /**
   * @method openOrder
   * @param {String} options.currency
   * @param {String} options.baseCurrency
   * @return {Promise}
   */
  listOrders() {
    return this.client.listOrders(...arguments)
  }

  /**
   * @method openOrder
   * @param {String} options.currency
   * @param {String} options.baseCurrency
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

  /**
   * @method parseCurrency
   * @param {String} market
   * @return {String}
   */
  parseCurrency(market) {
    market = String(market).toUpperCase().replace(/[^A-Z]/g, '')
    for (let baseCurrency of ['BTC', 'ETH', 'BNB', 'XMR', 'USDT']) {
      if (market.startsWith(baseCurrency) || market.endsWith(baseCurrency)) return {
        baseCurrency,
        currency: market.replace(baseCurrency, '')
      }
    }
    throw new Error(`Invalid market: ${market}`)
  }
}

module.exports = ExchangeClient
