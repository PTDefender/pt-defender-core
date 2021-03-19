const BinanceClient = require('./clients/binance')
const BittrexClient = require('./clients/bittrex')
const PoloniexClient = require('./clients/poloniex')
const CcxtClient = require('./clients/ccxt')
const exchangeType = require('./type')

const potentialBaseCurrencies = [
  'BTC',
  'ETH',
  'BNB',
  'TRX',
  'XRP',
  'USDT',
  'USDC',
  'USDS',
  'TUSD',
  'BUSD',
  'PAX',
  'USD'
]

class ExchangeClient {
  /**
   * @constructor
   * @param {String} options.type
   * @param {String} options.key
   * @param {String} options.secret
   */
  constructor({ type, key, secret }) {
    if (!type) throw new Error('type is required')
    if (!key) throw new Error('key is required')
    if (!secret) throw new Error('secret is required')

    this._clientType = type

    switch (type) {
      case exchangeType.BINANCE:
        this._client = new BinanceClient({ key, secret })
        break
      case exchangeType.BITTREX:
        this._client = new BittrexClient({ key, secret })
        break
      case exchangeType.POLONIEX:
        this._client = new PoloniexClient({ key, secret })
        break
      case exchangeType.KUCOIN:
        this._client = new CcxtClient(type.toLowerCase(), { key, secret, password: 'ProfitTrailer' })
        break
      default:
        this._client = new CcxtClient(type.toLowerCase(), { key, secret })
        break
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
  parseCurrency(pair) {
    // First check for proper pair
    if (pair.base && pair.currency) {
      return {
        baseCurrency: pair.base,
        currency: pair.currency
      }
    }

    // Check for a splittable character
    const [currency, baseCurrency] = pair.market.split(/[^a-z0-9]/gi).filter(part => !!part)
    if (currency && baseCurrency) {
      return {
        baseCurrency,
        currency
      }
    }

    // Check potential base currencies
    for (const baseCurrency of potentialBaseCurrencies) {
      if (pair.market.endsWith(baseCurrency))
        return {
          baseCurrency,
          currency: pair.market.replace(baseCurrency, '')
        }
    }
    throw new Error(`Invalid market: ${pair.market}`)
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
  minimumTradeCost() {
    return this.client.minimumTradeCost(...arguments)
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
