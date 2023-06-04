/* eslint-disable @typescript-eslint/no-unsafe-assignment */
// Learn more https://docs.expo.io/guides/customizing-metro
// import * as c from '@expo/metro-config'
import { getDefaultConfig } from '@expo/metro-config'
import { join } from 'path'


const config = getDefaultConfig(join(__dirname, '..',''))

// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
config.resolver.assetExts.push('db')
// eslint-disable-next-line no-console
// console.log(config)

module.exports = config


