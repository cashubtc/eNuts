import { getPreferences, setPreferences } from '@db'
import { l } from '@log'
import type { IPreferences } from '@model'
import { dark, HighlightKey, light , lightTheme } from '@styles'
import * as SplashScreen from 'expo-splash-screen'
import { createContext, useContext, useEffect, useState } from 'react'
import { Appearance } from 'react-native'

const useTheme = () => {
	const [theme, setTheme] = useState('Light')
	const [color, setColors] = useState(theme === 'Light' ? light.custom : dark.custom)
	const [pref, setPref] = useState<IPreferences | undefined>()
	const [highlight, setHighlight] = useState<HighlightKey>('Default')

	// update theme
	useEffect(() => {
		setColors(theme === 'Light' ? light.custom : dark.custom)
		if (!pref) { return }
		// update state
		setPref({ ...pref, darkmode: theme === 'Dark' })
		// update DB
		void setPreferences({ ...pref, darkmode: theme === 'Dark' })
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [theme])

	// update highlighting color
	useEffect(() => {
		if (!pref) { return }
		// update state
		setPref({ ...pref, theme: highlight })
		// update DB
		void setPreferences({ ...pref, theme: highlight })
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [highlight])

	// init
	useEffect(() => {
		void (async () => {
			try {
				// Initialize theme preferences
				const prefsDB = await getPreferences()
				const deviceTheme = Appearance.getColorScheme()
				const darkmode = prefsDB.hasPref ? prefsDB.darkmode : deviceTheme === 'dark'
				setPref({ ...prefsDB, darkmode })
				setTheme(darkmode ? 'Dark' : 'Light')
				setHighlight(prefsDB.theme)
			} catch (e) {
				l(e)
				setPref({
					id: 1,
					darkmode: false,
					formatBalance: false,
					theme: 'Default',
					hasPref: true
				})
			} finally {
				await SplashScreen.hideAsync()
			}
		})()
	}, [])

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

const ThemeContext = createContext<useThemeType>({
	pref: {
		id: 1,
		darkmode: false,
		formatBalance: false,
		theme: 'Default',
		hasPref: false
	},
	theme: 'Light',
	setTheme: () => l(''),
	color: lightTheme,
	highlight: 'Default',
	setHighlight: () => l('')
})

export const useThemeContext = () => useContext(ThemeContext)

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => (
	<ThemeContext.Provider value={useTheme()} >
		{children}
	</ThemeContext.Provider>
)
