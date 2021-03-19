const ccxt = require('ccxt')

class CcxtClient {
  /**
   * @constructor
   * @param {String} options.key
   * @param {String} options.secret
   */
  constructor(id, { key, secret, password }) {
    if (!ccxt[id]) throw new Error(`Invalid exchange type: ${id}`)
    this._api = new ccxt[id]({
      apiKey: key,
      secret: secret,
      password: password
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
   * @method accountValue
   * @param {String} options.currency
   * @return {Promise}
   */
  async accountValue({ currency }) {
    const { total, free, used } = await this._api.fetchBalance()
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
    const pair = `${currency}/${baseCurrency}`
    const result = await this._api.fetchTicker(pair)
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
    const market = await this.marketInfo({ currency, baseCurrency })
    const minQuantity = await this.minimumTradeQuantity({ currency, baseCurrency })
    const minCost = await this.minimumTradeCost({ currency, baseCurrency })

    quantity = parseFloat(quantity.toFixed(market.precision.amount))
    price = parseFloat(price.toFixed(market.precision.price))

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

    const pair = `${currency}/${baseCurrency}`
    const result = await this._api.createOrder(pair, 'limit', side.toLowerCase(), quantity, price)

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
    const pair = `${currency}/${baseCurrency}`
    const orders = await this._api.fetchClosedOrders(pair, since, limit)
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
    const pair = `${currency}/${baseCurrency}`
    return this._api.cancelOrder(orderId, pair)
  }

  /**
   * @method minimumTradeQuantity
   * @param {String} options.currency
   * @param {String} options.baseCurrency
   * @return {Number}
   */
  async minimumTradeQuantity({ currency, baseCurrency }) {
    const { limits } = await this.marketInfo({ currency, baseCurrency })
    return limits.amount.min
  }

  /**
   * @method minimumTradeCost
   * @param {String} options.currency
   * @param {String} options.baseCurrency
   * @return {Number}
   */
  async minimumTradeCost({ currency, baseCurrency }) {
    const { limits } = await this.marketInfo({ currency, baseCurrency })
    if (limits.cost) {
      return limits.cost.min
    } else {
      const minPrice = (limits.price.min || 0) * limits.amount.min
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
    const markets = await this._api.loadMarkets()
    return markets[`${currency}/${baseCurrency}`]
  }
}

module.exports = CcxtClient
