const _ = require('lodash')
const Promise = require('bluebird')
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
  accountValue({ currency }) {
    let promise = this._api.account()
    return Promise.resolve(promise)
      .then(data => {
        if (!data.canTrade) throw new Error('account is not enabled for trading')
        let item = _.find(data.balances, { asset: currency })
        return {
          balance: item ? _parseValue(item.free) : 0
        }
      })
      .catch(_parseError)
  }

  /**
   * @method marketValue
   * @param {String} options.currency
   * @param {String} options.baseCurrency
   * @return {Promise}
   */
  marketValue({ currency, baseCurrency }) {
    let symbol = `${currency}${baseCurrency}`
    let promise = this._api.tickerPrice(symbol)
    return Promise.resolve(promise)
      .then(data => ({
        price: _parseValue(data.price)
      }))
      .catch(_parseError)
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
  openOrder({ currency, baseCurrency, side, type, quantity, price }) {
    let symbol = `${currency}${baseCurrency}`

    return this._exchangeInfo(symbol)
      .then(info => ({
        symbol,
        side: String(side),
        type: String(type),
        quantity: _parseValue(quantity, _quantityDigits(info)),
        price: price ? _setPrice(price, info) : undefined,
        timeInForce: 'GTC',
        timestamp: Date.now()
      }))
      .then(options => this._api.newOrder(options).catch(_parseError))
      .then(result => ({
        id: result.orderId,
        quantity,
        price,
        currency,
        baseCurrency,
        result
      }))
  }

  /**
   * @method listOrders
   * @param {String} options.currency
   * @param {String} options.baseCurrency
   * @return {Promise}
   */
  listOrders({ currency, baseCurrency }) {
    let symbol = `${currency}${baseCurrency}`
    let promise = this._api.allOrders(symbol)
    return Promise.resolve(promise)
      .filter(order => order.status === 'FILLED')
      .map(order => ({
        side: order.side,
        date: new Date(order.time),
        quantity: parseFloat(order.executedQty),
        price: parseFloat(order.price)
      }))
      .catch(_parseError)
  }

  /**
   * @method cancelOrder
   * @param {String} options.symbol
   * @param {String} options.orderId
   * @return {Promise}
   */
  cancelOrder({ currency, baseCurrency, orderId }) {
    let symbol = `${currency}${baseCurrency}`
    let promise = this._api.cancelOrder({
      symbol: String(symbol),
      orderId: Number(orderId),
      timestamp: Date.now()
    })
    return Promise.resolve(promise)
      .catch(_parseError)
  }

  /**
   * @private
   * @method _exchangeInfo
   * @param {String} symbol
   * @return {Promise}
   */
  _exchangeInfo(symbol) {
    let promise = this._api.exchangeInfo()
    return Promise.resolve(promise)
      .then(data => _.find(data.symbols, { symbol }))
  }
}

function _priceDigits(info) {
  let filter = _.find(info.filters, { filterType: 'PRICE_FILTER' })
  return _parseDigits(filter.minPrice)
}

function _quantityDigits(info) {
  let filter = _.find(info.filters, { filterType: 'LOT_SIZE' })
  return _parseDigits(filter.minQty)
}

function _parseDigits(value) {
  return value.split('.')[1].indexOf('1') + 1
}

function _setPrice(price, info) {
  let digits = _priceDigits(info)
  return parseFloat(price).toFixed(digits)
}

function _parseValue(input, digits = 8) {
  let str = parseFloat(input).toFixed(digits)
  return parseFloat(str)
}

function _parseError({ msg }) {
  if (msg === 'Filter failure: MIN_NOTIONAL') {
    return {
      orderId: 'skipped_min_notional'
    }
  }
  throw new Error(msg)
}

module.exports = BinanceClient
