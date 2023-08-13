import type { Theme } from '@react-navigation/native'
import type { Theme as CustomTheme } from '@styles/colors'

// Override the theme in react native navigation to accept our custom theme props.
declare module '@react-navigation/native-stack' {
	export interface ExtendedTheme extends Theme {
		dark: boolean
		custom: CustomTheme
	}
	export function useTheme(): ExtendedTheme
}