const Poloniex = require('poloniex-api-node')

class PoloniexClient {
  /**
   * @constructor
   * @param {String} options.key
   * @param {String} options.secret
   */
  constructor({ key, secret }) {
    this._api = new Poloniex(key, secret, {
      nonce: () => Date.now() * 1000000
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
   * @method parseCurrency
   * @param {String} market
   * @return {Object}
   */
  parseCurrency(market) {
    let parts = market.split('_')
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
    let data = await this._api.returnBalances()
    if (!data[currency]) return { balance: 0, free: 0, locked: 0 }
    return {
      balance: _parseValue(data[currency]),
      free: _parseValue(data[currency]),
      locked: 0
    }
  }

  /**
   * @method marketValue
   * @param {String} options.currency
   * @param {String} options.baseCurrency
   * @return {Promise}
   */
  async marketValue({ currency, baseCurrency }) {
    let symbol = `${baseCurrency}_${currency}`
    let data = await this._api.returnTicker()
    return {
      price: data[symbol] ? _parseValue(data[symbol].last) : 0
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
    let symbol = `${baseCurrency}_${currency}`
    let adjustedQuantity = _parseValue(quantity)
    let adjustedPrice = _parseValue(price)

    if (adjustedQuantity <= 0) {
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
        result = await this._api.buy(symbol, adjustedPrice, adjustedQuantity)
        break
      case 'SELL':
        result = await this._api.sell(symbol, adjustedPrice, adjustedQuantity)
        break
      default:
        throw new Error(`Invalid order side: ${side}`)
    }
    return {
      id: result.orderNumber,
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
    let symbol = `${baseCurrency}_${currency}`
    let orders = await this._api.returnMyTradeHistory(symbol)
    return orders
      .filter(order => order.category === 'exchange')
      .map(order => ({
        side: order.type === 'buy' ? 'BUY' : 'SELL',
        date: new Date(`${order.date}Z`),
        quantity: parseFloat(order.amount),
        price: parseFloat(order.rate)
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
  async minimumTradeQuantity() {
    return 0.000001
  }

  /**
   * @method minimumTradeCost
   * @param {String} options.currency
   * @param {String} options.baseCurrency
   * @return {Number}
   */
  async minimumTradeCost({ baseCurrency }) {
    switch (baseCurrency) {
      case 'BTC':
        return 0.0015
      case 'ETH':
        return 0.015
      case 'BNB':
        return 1
      case 'USDT':
        return 1
      case 'XMR':
        return 1
      default:
        return 0
    }
  }
}

function _parseValue(input, digits = 8) {
  let str = parseFloat(input).toFixed(digits)
  return parseFloat(str)
}

module.exports = PoloniexClient
