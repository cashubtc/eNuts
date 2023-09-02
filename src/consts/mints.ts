import type { IMintBalWithName } from '@model'

export const customName = `mint.enuts.${__DEV__ ? 'dev' : 'beta'}`
export const _testmintUrl = 'https://testnut.cashu.space'
const ENUTS_MINT = 'https://legend.lnbits.com/cashu/api/v1/AptDNABNBXv8gpuywhx6NV'
export const mintUrl = __DEV__ ? _testmintUrl : ENUTS_MINT
export const DONATION_ADDR = 'zap@agron.dev'

export const defaultMints: Readonly<IMintBalWithName[]> = [{ mintUrl, amount: 0, customName }] as const
