import { isIOS } from '@consts'
import { useThemeContext } from '@src/context/Theme'
import { highlight as hi } from '@styles'
import { StyleSheet, Switch } from 'react-native'

interface IToggleProps {
	value: boolean,
	onChange: () => void
}

export default function Toggle({ value, onChange }: IToggleProps) {
	const { color, highlight } = useThemeContext()
	return (
		<Switch
			trackColor={{ false: color.BORDER, true: hi[highlight] }}
			thumbColor={color.TEXT}
			onValueChange={onChange}
			value={value}
			style={styles.switch}
		/>
	)
}

const styles = StyleSheet.create({
	switch: {
		marginVertical: -10,
		transform: [{ scaleX: isIOS ? .6 : 1 }, { scaleY: isIOS ? .6 : 1 }]
	}
})