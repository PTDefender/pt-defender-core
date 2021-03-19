const _ = require('lodash')
const axios = require('axios')
const { BinanceRest } = require('binance')

// Set the default adapter to prevent electron issues
if (typeof window !== 'undefined') {
  axios.defaults.adapter = require('axios/lib/adapters/xhr')
}

// Supported base currencies
let exchangeInfoPromise = null

class BinanceClient {
  /**
   * @constructor
   * @param {String} options.key
   * @param {String} options.secret
   */
  constructor({ key, secret }) {
    this._api = new BinanceRest({
      key: String(key),
      secret: String(secret),
      recvWindow: 30000,
      handleDrift: true
    })
  }

  /**
   * @method fee
   * @return {Number}
   */
  fee() {
    return 0.002
  }

  /**
   * @method accountValue
   * @param {String} options.currency
   * @return {Promise}
   */
  async accountValue({ currency }) {
    try {
      let data = await this._api.account()
      if (!data.canTrade) throw new Error('account is not enabled for trading')
      let item = _.find(data.balances, { asset: currency })
      if (!item) return { balance: 0, free: 0, locked: 0 }
      return {
        balance: _parseValue(item.free) + _parseValue(item.locked),
        free: _parseValue(item.free),
        locked: _parseValue(item.locked)
      }
    } catch (err) {
      return _parseError(err)
    }
  }

  /**
   * @method marketValue
   * @param {String} options.currency
   * @param {String} options.baseCurrency
   * @return {Promise}
   */
  async marketValue({ currency, baseCurrency }) {
    let symbol = `${currency}${baseCurrency}`
    try {
      let data = await this._api.tickerPrice(symbol)
      return { price: _parseValue(data.price) }
    } catch (err) {
      return _parseError(err)
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
  async openOrder({ currency, baseCurrency, side, type, quantity, price }) {
    let symbol = `${currency}${baseCurrency}`

    let info = await this._exchangeInfo(symbol)
    let priceFilter = _.find(info.filters, { filterType: 'PRICE_FILTER' })
    let quantityFilter = _.find(info.filters, { filterType: 'LOT_SIZE' })
    let minimumPrice = parseFloat(priceFilter.minPrice)
    let minimumQuantity = parseFloat(quantityFilter.minQty)
    let adjustedQuantity = _setValue(quantity, quantityFilter.stepSize)
    let adjustedPrice = _setValue(price, priceFilter.tickSize)
    let orderOptions = {
      symbol,
      side: String(side),
      type: String(type),
      quantity: adjustedQuantity,
      price: adjustedPrice,
      timeInForce: 'GTC'
    }

    if (price < minimumPrice) {
      return {
        id: 'skipped_min_price',
        quantity: adjustedQuantity,
        price: adjustedPrice,
        currency,
        baseCurrency
      }
    }

    if (adjustedQuantity < minimumQuantity) {
      return {
        id: 'skipped_min_quantity',
        quantity: adjustedQuantity,
        price: adjustedPrice,
        currency,
        baseCurrency
      }
    }

    try {
      let result = await this._api.newOrder(orderOptions)
      return {
        id: result.orderId,
        quantity: adjustedQuantity,
        price: adjustedPrice,
        currency,
        baseCurrency
      }
    } catch (err) {
      return _parseError(err)
    }
  }

  /**
   * @method listOrders
   * @param {String} options.currency
   * @param {String} options.baseCurrency
   * @return {Promise}
   */
  async listOrders({ currency, baseCurrency }) {
    let symbol = `${currency}${baseCurrency}`
    let orders
    try {
      orders = await this._api.myTrades(symbol)
    } catch (err) {
      return _parseError(err)
    }
    return orders.map(order => ({
      side: order.isBuyer ? 'BUY' : 'SELL',
      date: new Date(order.time),
      quantity: parseFloat(order.qty),
      price: parseFloat(order.price)
    }))
  }

  /**
   * @method cancelOrder
   * @param {String} options.symbol
   * @param {String} options.orderId
   * @return {Promise}
   */
  async cancelOrder({ currency, baseCurrency, orderId }) {
    let symbol = `${currency}${baseCurrency}`
    try {
      return await this._api.cancelOrder({
        symbol: String(symbol),
        orderId: Number(orderId),
        timestamp: Date.now()
      })
    } catch (err) {
      return _parseError(err)
    }
  }

  /**
   * @method minimumTradeQuantity
   * @param {String} options.currency
   * @param {String} options.baseCurrency
   * @return {Number}
   */
  async minimumTradeQuantity({ currency, baseCurrency }) {
    let symbol = `${currency}${baseCurrency}`
    let info = await this._exchangeInfo(symbol)
    let filter = _.find(info.filters, { filterType: 'LOT_SIZE' })
    return _parseValue(filter.minQty)
  }

  /**
   * @method minimumTradeCost
   * @param {String} options.currency
   * @param {String} options.baseCurrency
   * @return {Number}
   */
  async minimumTradeCost({ baseCurrency, currency }) {
    let symbol = `${currency}${baseCurrency}`
    let info = await this._exchangeInfo(symbol)
    let filter = _.find(info.filters, { filterType: 'MIN_NOTIONAL' })
    return _parseValue(filter.minNotional) * 1.1
  }

  /**
   * @private
   * @method _exchangeInfo
   * @param {String} symbol
   * @return {Promise}
   */
  async _exchangeInfo(symbol) {
    if (!exchangeInfoPromise) {
      exchangeInfoPromise = axios.get('https://api.binance.com/api/v1/exchangeInfo').then(res => res.data)
    }
    try {
      let data = await exchangeInfoPromise
      return _.find(data.symbols, { symbol })
    } catch (err) {
      exchangeInfoPromise = null
      throw err
    }
  }
}

function _setValue(value, min) {
  let digits = min.split('.')[1].indexOf('1') + 1
  let exp = Math.pow(10, digits)
  let rounded = parseInt(value * exp) / exp
  return rounded.toFixed(digits)
}

function _parseValue(input, digits = 8) {
  let str = parseFloat(input).toFixed(digits)
  return parseFloat(str)
}

function _parseError({ msg }) {
  switch (msg) {
    case 'Filter failure: MIN_NOTIONAL':
      return { id: 'skipped_min_notional' }
    default:
      throw new Error(msg)
  }
}

module.exports = BinanceClient
