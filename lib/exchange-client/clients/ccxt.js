const ccxt = require('ccxt')

class CcxtClient {

  /**
   * @constructor
   * @param {String} options.key
   * @param {String} options.secret
   */
  constructor(id, { key, secret }) {
    if (!ccxt[id]) throw new Error(`Invalid exchange type: ${id}`)
    this._api = new ccxt[id]({
      apiKey: key,
      secret: secret
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
    let parts = market.split('/')
    return {
      baseCurrency: parts[1],
      currency: parts[0]
    }
  }

  /**
   * @method accountValue
   * @param {String} options.currency
   * @return {Promise}
   */
  async accountValue({ currency }) {
    let { total, free, used } = await this._api.fetchBalance()
    return {
      balance: total[currency],
      free: free[currency],
      locked: used[currency]
    }
  }

  /**
   * @method marketValue
   * @param {String} options.currency
   * @param {String} options.baseCurrency
   * @return {Promise}
   */
  async marketValue({ currency, baseCurrency }) {
    let pair = `${currency}/${baseCurrency}`
    let result = await this._api.fetchTicker(pair)
    return {
      price: result.last
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
    let market = await this.marketInfo({ currency, baseCurrency })
    let minQuantity = await this.minimumTradeQuantity({ currency, baseCurrency })
    let minCost = await this.minimumTradeCost({ currency, baseCurrency })

    quantity = parseFloat(quantity.toFixed(market.precision.amount))
    price = parseFloat(quantity.toFixed(market.precision.price))

    if (price * quantity < minCost) {
      return {
        id: 'skipped_min_price',
        quantity,
        price,
        currency,
        baseCurrency
      }
    }

    if (quantity < minQuantity) {
      return {
        id: 'skipped_min_quantity',
        quantity,
        price,
        currency,
        baseCurrency
      }
    }

    let pair = `${currency}/${baseCurrency}`
    let result = await this._api.createOrder(pair, 'limit', side.toLowerCase(), quantity, price)

    return {
      id: result.id,
      quantity,
      price,
      currency,
      baseCurrency
    }
  }

  /**
   * @method listOrders
   * @param {String} options.currency
   * @param {String} options.baseCurrency
   * @return {Promise}
   */
  async listOrders({ currency, baseCurrency, since, limit }) {
    let pair = `${currency}/${baseCurrency}`
    let orders = await this._api.fetchClosedOrders(pair, since, limit)
    return orders.map(order => ({
      id: order.id,
      side: order.side.toUpperCase(),
      date: new Date(order.lastTradeTimestamp),
      quantity: order.filled,
      price: order.price
    }))
  }

  /**
   * @method cancelOrder
   * @param {String} options.symbol
   * @param {String} options.orderId
   * @return {Promise}
   */
  async cancelOrder({ orderId, currency, baseCurrency }) {
    let pair = `${currency}/${baseCurrency}`
    return this._api.cancelOrder(orderId, pair)
  }

  /**
   * @method minimumTradeQuantity
   * @param {String} options.currency
   * @param {String} options.baseCurrency
   * @return {Number}
   */
  async minimumTradeQuantity({ currency, baseCurrency }) {
    let { limits } = await this.marketInfo({ currency, baseCurrency })
    return limits.amount.min
  }

  /**
   * @method minimumTradeCost
   * @param {String} options.currency
   * @param {String} options.baseCurrency
   * @return {Number}
   */
  async minimumTradeCost({ currency, baseCurrency }) {
    let { limits } = await this.marketInfo({ currency, baseCurrency })
    if (limits.cost) {
      return limits.cost.min
    } else {
      let minPrice = (limits.price.min || 0) * limits.amount.min
      return Math.max(minPrice, 0.00000001)
    }
  }

  /**
   * @method marketInfo
   * @param {String} options.currency
   * @param {String} options.baseCurrency
   * @return {Promise}
   */
  async marketInfo({ currency, baseCurrency }) {
    let markets = await this._api.loadMarkets()
    return markets[`${currency}/${baseCurrency}`]
  }
}

module.exports = CcxtClient
