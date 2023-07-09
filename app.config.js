const { argv } = require('process')

if (!argv || argv.length < 2 || !argv[1].endsWith('depsVersipn.mts')) {
	require('ts-node/register')
}
module.exports = require(`${__dirname}/config/app.config.ts`)