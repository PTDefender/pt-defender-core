const _ = require('lodash')
const bittrex = require('bittrex-node')
let exchangeInfoPromise = null

class BittrexClient {

  /**
   * @constructor
   * @param {String} options.key
   * @param {String} options.secret
   */
  constructor({ key, secret }) {
    this._api = new bittrex.BittrexClient({
      apiKey: key,
      apiSecret: secret
    })
  }

  /**
   * @method fee
   * @return {Number}
   */
  fee() {
    return 0.0025
  }

  /**
   * @method parseCurrency
   * @param {String} market
   * @return {Object}
   */
  parseCurrency(market) {
    let parts = market.split('-')
    return {
      baseCurrency: parts[0],
      currency: parts[1]
    }
  }

  /**
   * @method accountValue
   * @param {String} options.currency
   * @return {Promise}
   */
  async accountValue({ currency }) {
    let result = await this._api.balance(currency)
    return {
      balance: result.Balance ? result.Balance : 0,
      free: result.Available ? result.Available : 0,
      locked: result.Pending ? result.Pending : 0
    }
  }

  /**
   * @method marketValue
   * @param {String} options.currency
   * @param {String} options.baseCurrency
   * @return {Promise}
   */
  async marketValue({ currency, baseCurrency }) {
    let symbol = `${baseCurrency}-${currency}`
    let result = await this._api.ticker(symbol)
    return {
      price: result.Last
    }
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
  async openOrder({ currency, baseCurrency, side, quantity, price }) {
    let symbol = `${baseCurrency}-${currency}`
    let minimumQuantity = await this.minimumTradeQuantity({ currency, baseCurrency })
    let adjustedQuantity = _parseValue(quantity)
    let adjustedPrice = _parseValue(price)

    if (adjustedQuantity < minimumQuantity) {
      return {
        id: 'skipped_min_quantity',
        quantity: adjustedQuantity,
        price: adjustedPrice,
        currency,
        baseCurrency
      }
    }

    let result
    switch (side) {
    case 'BUY':
      result = await this._api.buyLimit(symbol, {
        quantity: adjustedQuantity,
        rate: adjustedPrice
      })
      break
    case 'SELL':
      result = await this._api.sellLimit(symbol, {
        quantity: adjustedQuantity,
        rate: adjustedPrice
      })
      break
    default:
      throw new Error(`Invalid order side: ${side}`)
    }

    return {
      id: result.uuid,
      quantity,
      price,
      currency,
      baseCurrency,
      result
    }
  }

  /**
   * @method listOrders
   * @param {String} options.currency
   * @param {String} options.baseCurrency
   * @return {Promise}
   */
  async listOrders({ currency, baseCurrency }) {
    let symbol = `${baseCurrency}-${currency}`
    let orders = await this._api.orderHistory(symbol)
    return orders.map(order => ({
      side: order.OrderType.includes('BUY') ? 'BUY' : 'SELL',
      date: order.Closed,
      quantity: order.Quantity - order.QuantityRemaining,
      price: order.PricePerUnit
    }))
  }

  /**
   * @method cancelOrder
   * @param {String} options.symbol
   * @param {String} options.orderId
   * @return {Promise}
   */
  async cancelOrder({ orderId }) {
    return this._api.cancelOrder(orderId)
  }

  /**
   * @method minimumTradeQuantity
   * @param {String} options.currency
   * @param {String} options.baseCurrency
   * @return {Number}
   */
  async minimumTradeQuantity({ currency, baseCurrency }) {
    let info = await this._exchangeInfo({ currency, baseCurrency })
    return info.MinTradeSize
  }

  /**
   * @method minimumTradeCost
   * @param {String} options.currency
   * @param {String} options.baseCurrency
   * @return {Number}
   */
  async minimumTradeCost({ baseCurrency }) {
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
   * @private
   * @method _exchangeInfo
   * @param {String} symbol
   * @return {Promise}
   */
  async _exchangeInfo({ currency, baseCurrency }) {
    if (!exchangeInfoPromise) {
      exchangeInfoPromise = this._api.markets()
    }
    try {
      let results = await exchangeInfoPromise
      return _.find(results, {
        BaseCurrency: baseCurrency,
        MarketCurrency: currency
      })
    } catch(err) {
      exchangeInfoPromise = null
      throw err
    }
  }
}

function _parseValue(input, digits = 8) {
  let str = parseFloat(input).toFixed(digits)
  return parseFloat(str)
}

module.exports = BittrexClient
