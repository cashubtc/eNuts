import { DefaultTheme } from '@react-navigation/native'
import type { ExtendedTheme } from '@react-navigation/native-stack'

// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export type TPref = {
	BACKGROUND: string
	DRAWER: string
	TEXT: string
	TEXT_SECONDARY: string
	INPUT_BG: string
	INPUT_PH: string
	BORDER: string
	ERROR: string
}

// highlight theme
export const highlight: { [key: string]: string } = {
	Default: '#5DB075',
	Bitcoin: '#FF9900',
	Nuts: '#B37436',
	Nostr: '#B780FF',
	Sky: '#027DFF',
	Azyre: '#03DDFF',
	Rosy: '#FC7ED0',
	Zap: '#FFCC00'
}

// pin pad background based on selected highlight theme
const pinpadBg: { [key: string]: string } = {
	'#5DB075': '#73BD88',
	'#FF9900': '#FFB340',
	'#B37436': '#AB8763',
	'#B780FF': '#CDA9FC',
	'#027DFF': '#58A8FC',
	'#03DDFF': '#79EBFC',
	'#FC7ED0': '#FCB3E3',
	'#FFCC00': '#FFE16E'
}

export function getPinpadBg(highlight: string) {
	return pinpadBg[highlight]
}

export const themeColors = [
	'Default',
	'Bitcoin',
	'Nuts',
	'Nostr',
	'Sky',
	'Azyre',
	'Rosy',
	'Zap',
]

// light theme
const WHITE = '#FAFAFA'
const DARK_GREY = '#656565'
const GREY = '#BDBDBD'
const LIGHT_GREY1 = '#F6F6F6'
const LIGHT_GREY2 = '#E8E8E8'
// dark theme
const DARK = '#202124'
const CLOUD = '#BDC1C6'
const DARK_CLOUD = '#999DA2'
const GREY1 = '#303134'
const GREY2 = '#5F6368'
//
export const mainColors = {
	VALID: '#5DB075',
	WARN: '#FF9900',
}

const common = {
	ERROR: '#FF6666',
}

// light theme
const lightTheme: TPref = {
	...common,
	BACKGROUND: WHITE,
	DRAWER: WHITE,
	TEXT: DARK_GREY,
	TEXT_SECONDARY: GREY,
	INPUT_BG: LIGHT_GREY1,
	INPUT_PH: DARK_GREY,
	BORDER: LIGHT_GREY2,
}

// dark theme
const darkTheme: TPref = {
	...common,
	BACKGROUND: DARK,
	DRAWER: GREY1,
	TEXT: CLOUD,
	TEXT_SECONDARY: DARK_CLOUD,
	INPUT_BG: GREY1,
	INPUT_PH: GREY2,
	BORDER: GREY2,
}

export const light: ExtendedTheme = {
	dark: false,
	colors: { ...DefaultTheme.colors },
	custom: lightTheme
}

export const dark: ExtendedTheme = {
	dark: true,
	colors: { ...DefaultTheme.colors },
	custom: darkTheme
}