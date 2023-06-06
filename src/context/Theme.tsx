import { l } from '@log'
import { IPreferences } from '@model'
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
	theme: '',
	setTheme: () => l(''),
	color: {
		BACKGROUND: '',
		DRAWER: '',
		TEXT: '',
		TEXT_SECONDARY: '',
		INPUT_BG: '',
		INPUT_PH: '',
		BORDER: '',
		ERROR: ''
	},
	highlight: '',
	setHighlight: () => l('')
})