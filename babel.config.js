
const configPath = `${__dirname}/config/babel.config.ts`
// if we use @esbuild-kit/cjs-loader here the metro build fails for some reason
require('ts-node/register')

module.exports = require(configPath)

