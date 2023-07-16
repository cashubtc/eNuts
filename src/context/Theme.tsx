import { l } from '@log'
import type { IPreferences } from '@model'
import { dark, light } from '@styles'
import { createContext, useState } from 'react'

const useTheme = () => {
	const [theme, setTheme] = useState('Light')
	const [color] = useState(theme === 'Light' ? light.custom : dark.custom)
	const [pref] = useState<IPreferences | undefined>()
	const [highlight, setHighlight] = useState('Default')
	return {
		pref,
		theme,
		setTheme,
		color,
		highlight,
		setHighlight
	}
}
type useThemeType = ReturnType<typeof useTheme>
export const ThemeContext = createContext<useThemeType>({
	pref: {
		id: 1,
		darkmode: false,
		formatBalance: false,
		theme: 'Default'
	},
	theme: 'Light',
	setTheme: () => l(''),
	color: {
		BACKGROUND: '#FAFAFA',
		DRAWER: '#FAFAFA',
		TEXT: '#656565',
		TEXT_SECONDARY: '#BDBDBD',
		INPUT_BG: '#F6F6F6',
		INPUT_PH: '#656565',
		BORDER: '#E8E8E8'
	},
	highlight: '#5DB075',
	setHighlight: () => l('')
})