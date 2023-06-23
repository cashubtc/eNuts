import type { Theme } from '@react-navigation/native'

// Override the theme in react native navigation to accept our custom theme props.
declare module '@react-navigation/native-stack' {
	export interface ExtendedTheme extends Theme {
		dark: boolean
		custom: {
			ERROR: string,
			BACKGROUND: string,
			DRAWER: string,
			TEXT: string,
			TEXT_SECONDARY: string,
			INPUT_BG: string,
			INPUT_PH: string,
			BORDER: string,
		}
	}
	export function useTheme(): ExtendedTheme
}