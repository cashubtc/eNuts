import { isIOS } from '@consts'
import { useThemeContext } from '@src/context/Theme'
import { highlight as hi } from '@styles'
import { Switch } from 'react-native'
import { ScaledSheet } from 'react-native-size-matters'

interface IToggleProps {
	value: boolean,
	onChange: () => void
	disabled?: boolean
}

export default function Toggle({ value, onChange, disabled }: IToggleProps) {
	const { color, highlight } = useThemeContext()
	return (
		<Switch
			trackColor={{ false: color.BORDER, true: hi[highlight] }}
			thumbColor={color.TEXT}
			onValueChange={onChange}
			value={value}
			style={[styles.switch, disabled && styles.disabled]}
			disabled={disabled}
		/>
	)
}

const styles = ScaledSheet.create({
	switch: {
		marginVertical: '-10@vs',
		transform: [{ scaleX: isIOS ? .6 : 1 }, { scaleY: isIOS ? .6 : 1 }]
	},
	disabled: {
		opacity: 0.5
	}
})