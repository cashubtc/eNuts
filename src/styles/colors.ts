import { DefaultTheme } from '@react-navigation/native'
import type { ExtendedTheme } from '@react-navigation/native-stack'

// general theme related colors
export enum Colors {
	// light theme
	L_Background = '#E7E8E9',
	L_Text = '#656565',
	L_Text_Secondary = '#ADADAD',
	L_Input_Bg = '#F6F6F6',
	L_Border = '#D8D8D8',
	L_DARK_Border = '#E7E8E8',
	// dark theme
	D_Background = '#1C1C1E',
	D_Drawer = '#252429',
	D_Text = '#EBEBF0',
	D_Text_Secondary = '#999DA2',
	D_Border = '#5F6368',
	D_Dark_Border = 'rgba(59, 67, 84, .5)',
}

export type Theme = typeof lightTheme | typeof darkTheme

// light theme
export const lightTheme = {
	BACKGROUND: Colors.L_Background,
	DRAWER: Colors.L_Input_Bg,
	TEXT: Colors.L_Text,
	TEXT_SECONDARY: Colors.L_Text_Secondary,
	INPUT_BG: Colors.L_Input_Bg,
	INPUT_PH: Colors.L_Text,
	BORDER: Colors.L_Border,
	DARK_BORDER: Colors.L_DARK_Border,
}

// dark theme
const darkTheme = {
	BACKGROUND: Colors.D_Background,
	DRAWER: Colors.D_Drawer,
	TEXT: Colors.D_Text,
	TEXT_SECONDARY: Colors.D_Text_Secondary,
	INPUT_BG: Colors.D_Drawer,
	INPUT_PH: Colors.D_Border,
	BORDER: Colors.D_Border,
	DARK_BORDER: Colors.D_Dark_Border,
}

export const light: ExtendedTheme = {
	dark: false,
	colors: { ...DefaultTheme.colors },
	custom: lightTheme,
	fonts: {
		regular: { fontFamily: '', fontWeight: 'normal' },
		medium: { fontFamily: '', fontWeight: 'normal' },
		bold: { fontFamily: '', fontWeight: 'normal' },
		heavy: { fontFamily: '', fontWeight: 'normal' },
	}
}

export const dark: ExtendedTheme = {
	dark: true,
	colors: { ...DefaultTheme.colors },
	custom: darkTheme,
	fonts: {
		regular: { fontFamily: '', fontWeight: 'normal' },
		medium: { fontFamily: '', fontWeight: 'normal' },
		bold: { fontFamily: '', fontWeight: 'normal' },
		heavy: { fontFamily: '', fontWeight: 'normal' },
	}
}

// highlight theme colors
export enum H_Colors {
	Default = '#5DB075',
	Bitcoin = '#FF9900',
	Nuts = '#B37436',
	Nostr = '#B780FF',
	Sky = '#027DFF',
	Azyre = '#03DDFF',
	Rosy = '#FC7ED0',
	Zap = '#FFCC00',
}

export type HighlightKey = keyof typeof H_Colors

// Create the highlight object with specific color keys
export const highlight: { [key in HighlightKey]: H_Colors } = {
	Default: H_Colors.Default,
	Bitcoin: H_Colors.Bitcoin,
	Nuts: H_Colors.Nuts,
	Nostr: H_Colors.Nostr,
	Sky: H_Colors.Sky,
	Azyre: H_Colors.Azyre,
	Rosy: H_Colors.Rosy,
	Zap: H_Colors.Zap,
}

// PIN buttons colors based on highlight theme
const pinpadBg = {
	Default: '#73BD88',
	Bitcoin: '#FFB340',
	Nuts: '#AB8763',
	Nostr: '#CDA9FC',
	Sky: '#58A8FC',
	Azyre: '#79EBFC',
	Rosy: '#FCB3E3',
	Zap: '#FFE16E',
}

/**
 * Returns the theme-highlight-related PIN button background color
 */
export function getPinpadBg(highlight: keyof typeof pinpadBg) {
	return pinpadBg[highlight]
}

export enum mainColors {
	// indicators
	VALID = '#5DB076',
	WARN = '#FF9900',
	ERROR = '#FF6666',
	// colors
	BLACK = '#000',
	WHITE = '#FAFAFA',
	GREY = '#999',
	BLUE = '#027DFF',
	ZAP = H_Colors.Zap,
	STAR = '#E5BC50'
}

export const themeColors = Object.keys(highlight) as HighlightKey[]

export const getColor = (highlight: HighlightKey, color: Theme) => {
	if (highlight === 'Azyre' || highlight === 'Zap' || highlight === 'Rosy') { return color.BACKGROUND }
	return mainColors.WHITE
}