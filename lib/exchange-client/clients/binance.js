const _ = require('lodash')
const { BinanceRest } = require('binance')

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
      handleDrift: true
    })
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
      return { balance: item ? _parseValue(item.free) : 0 }
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
    let adjustedQuantity = quantity - (quantity * 0.001)
    let orderOptions = {
      symbol,
      side: String(side),
      type: String(type),
      quantity: _setValue(adjustedQuantity, quantityFilter.stepSize),
      price: _setValue(price, priceFilter.tickSize),
      timeInForce: 'GTC'
    }

    if (price < minimumPrice) {
      return {
        id: 'skipped_min_price',
        quantity: adjustedQuantity,
        price,
        currency,
        baseCurrency
      }
    }

    if (adjustedQuantity < minimumQuantity) {
      return {
        id: 'skipped_min_quantity',
        quantity: adjustedQuantity,
        price,
        currency,
        baseCurrency
      }
    }

    try {
      let result = await this._api.newOrder(orderOptions)
      return {
        id: result.orderId,
        quantity,
        price,
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
    try {
      let orders = await this._api.allOrders(symbol)
      return orders
        .filter(order => order.status === 'FILLED')
        .map(order => ({
          side: order.side,
          date: new Date(order.time),
          quantity: parseFloat(order.executedQty),
          price: parseFloat(order.price)
        }))
    } catch (err) {
      return _parseError(err)
    }
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
   * @private
   * @method _exchangeInfo
   * @param {String} symbol
   * @return {Promise}
   */
  async _exchangeInfo(symbol) {
    let data = await this._api.exchangeInfo()
    return _.find(data.symbols, { symbol })
  }
}

function _setValue(value, min) {
  let digits = min.split('.')[1].indexOf('1') + 1
  if (digits <= 0) {
    return value.toFixed(0)
  } else {
    return value.toFixed(digits + 1).slice(0, -1)
  }
}

function _parseValue(input, digits = 8) {
  let str = parseFloat(input).toFixed(digits)
  return parseFloat(str)
}

function _parseError({ msg }) {
  switch (msg) {
    case 'Filter failure: MIN_NOTIONAL':
      return { orderId: 'skipped_min_notional' }
    default:
      throw new Error(msg)
  }
}

module.exports = BinanceClient
