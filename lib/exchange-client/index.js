const BinanceClient = require('./clients/binance')
const BittrexClient = require('./clients/bittrex')
const PoloniexClient = require('./clients/poloniex')
const KuCoinClient = require('./clients/kucoin')
const { BINANCE, BITTREX, POLONIEX, KUCOIN } = require('./type')

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
      case KUCOIN:
        this._client = new KuCoinClient({ key, secret })
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
   * @param {String} clientType
   */
  get clientType() {
    return this._clientType
  }

  /**
   * @method fee
   * @return {Number}
   */
  fee() {
    return this.client.fee(...arguments)
  }

  /**
   * @method parseCurrency
   * @param {String} market
   * @return {Object}
   */
  parseCurrency() {
    return this.client.parseCurrency(...arguments)
  }

  /**
   * @method minimumTradeQuantity
   * @param {String} options.currency
   * @param {String} options.baseCurrency
   * @return {Number}
   */
  minimumTradeQuantity() {
    return this.client.minimumTradeQuantity(...arguments)
  }

  /**
   * @method minimumTradeCost
   * @param {String} options.currency
   * @param {String} options.baseCurrency
   * @return {Number}
   */
  minimumTradeCost({ baseCurrency }) {
    switch (baseCurrency) {
    case 'BTC': return 0.0015
    case 'ETH': return 0.015
    case 'BNB': return 1
    case 'USDT': return 1
    case 'XMR': return 1
    default: return 0
    }
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
}

module.exports = ExchangeClient
