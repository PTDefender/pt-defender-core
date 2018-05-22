const winston = require('winston')

winston.addColors({
  info: 'blue',
  warn: 'yellow',
  error: 'red'
})

module.exports = new winston.Logger({
  transports: [
    new winston.transports.Console({
      level: 'debug',
      colorize: true
    })
  ]
})
