const _ = require('lodash')
const axios = require('axios')
const Bittrex = require('bittrex-wrapper')
const { DateTime } = require('luxon')
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
    let res = await this._api.accountGetBalance(currency)
    let result = _parseResponse(res)
    if (!result) return { balance: 0, free: 0, locked: 0 }
    return {
      balance: _parseValue(result.Balance),
      free: _parseValue(result.Available),
      locked: _parseValue(result.Pending)
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
    let res = await this._api.publicGetTicker(symbol)
    let result = _parseResponse(res)
    return {
      price: _parseValue(result.Last)
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

    let res
    switch (side) {
    case 'BUY':
      res = await this._api.marketBuyLimit(symbol, adjustedQuantity, adjustedPrice)
      break
    case 'SELL':
      res = await this._api.marketSellLimit(symbol, adjustedQuantity, adjustedPrice)
      break
    default:
      throw new Error(`Invalid order side: ${side}`)
    }

    let result = _parseResponse(res)
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
    let res = await this._api.accountGetOrderHistory(symbol)
    let orders = _parseResponse(res).filter(order => order.QuantityRemaining === 0)
    return orders.map(order => ({
      side: order.OrderType.includes('BUY') ? 'BUY' : 'SELL',
      date: DateTime.fromISO(order.TimeStamp, { zone: 'utc' }).toJSDate(),
      quantity: parseFloat(order.Quantity),
      price: parseFloat(order.PricePerUnit)
    }))
  }

  /**
   * @method cancelOrder
   * @param {String} options.symbol
   * @param {String} options.orderId
   * @return {Promise}
   */
  async cancelOrder({ orderId }) {
    let res = await this._api.marketCancel(orderId)
    return _parseResponse(res)
  }

  /**
   * @method minimumTradeQuantity
   * @param {String} options.currency
   * @param {String} options.baseCurrency
   * @return {Number}
   */
  async minimumTradeQuantity({ currency, baseCurrency }) {
    let info = await this._exchangeInfo({ currency, baseCurrency })
    return _parseValue(info.MinTradeSize)
  }

  /**
   * @private
   * @method _exchangeInfo
   * @param {String} symbol
   * @return {Promise}
   */
  async _exchangeInfo({ currency, baseCurrency }) {
    if (!exchangeInfoPromise) {
      exchangeInfoPromise = axios.get('https://bittrex.com/api/v1.1/public/getmarkets').then(res => res.data)
    }
    try {
      let res = await exchangeInfoPromise
      let results = _parseResponse(res)
      return _.find(results, { BaseCurrency: baseCurrency, MarketCurrency: currency })
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

function _parseResponse({ success, message, result }) {
  if (success) return result
  throw new Error(message)
}

module.exports = BittrexClient
