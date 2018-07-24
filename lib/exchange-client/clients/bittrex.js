const _ = require('lodash')
const Bittrex = require('bittrex-wrapper')
let exchangeInfoPromise = null

class BittrexClient {

  /**
   * @constructor
   * @param {String} options.key
   * @param {String} options.secret
   */
  constructor({ key, secret }) {
    this._api = new Bittrex(key, secret)
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
    let result = await request(this._api.accountGetBalance(currency))
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
    let result = await request(this._api.publicGetTicker(symbol))
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
      result = await request(this._api.marketBuyLimit(symbol, adjustedQuantity, adjustedPrice))
      break
    case 'SELL':
      result = await request(this._api.marketSellLimit(symbol, adjustedQuantity, adjustedPrice))
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
    let orders = await request(this._api.accountGetOrderHistory(symbol))
    return orders.map(order => ({
      side: order.OrderType.includes('BUY') ? 'BUY' : 'SELL',
      date: new Date(`${order.TimeStamp}Z`),
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
    return request(this._api.marketCancel(orderId))
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
   * @private
   * @method _exchangeInfo
   * @param {String} symbol
   * @return {Promise}
   */
  async _exchangeInfo({ currency, baseCurrency }) {
    if (!exchangeInfoPromise) {
      exchangeInfoPromise = request(this._api.publicGetMarkets())
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

async function request(promise) {
  let { success, result, message } = await promise
  if (success) return result
  throw new Error(message)
}

function _parseValue(input, digits = 8) {
  let str = parseFloat(input).toFixed(digits)
  return parseFloat(str)
}

module.exports = BittrexClient
