// Learn more https://docs.expo.io/guides/customizing-metro

const configPath = `${__dirname}/config/metro.config.ts`

require('ts-node/register')

module.exports = require(configPath)



