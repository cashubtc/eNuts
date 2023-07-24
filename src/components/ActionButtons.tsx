import { StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import Button from './Button'

interface IActionBtnsProps {
	topBtnTxt: string
	topBtnAction: () => void
	bottomBtnTxt: string
	bottomBtnAction: () => void
	ontopOfNav?: boolean
	absolutePos?: boolean
	loading?: boolean
	topIcon?: React.ReactNode
	bottomIcon?: React.ReactNode
}

export default function ActionButtons({
	topBtnTxt,
	topBtnAction,
	bottomBtnTxt,
	bottomBtnAction,
	ontopOfNav,
	absolutePos,
	loading,
	topIcon,
	bottomIcon
}: IActionBtnsProps) {
	const insets = useSafeAreaInsets()
	return (
		<View
			style={[
				styles.actionWrap,
				ontopOfNav ? styles.ontopOfNav : {},
				absolutePos ? { ...styles.absolute, bottom: insets.bottom } : {},
			]}
		>
			<Button
				loading={loading}
				txt={topBtnTxt}
				onPress={topBtnAction}
				icon={topIcon}
			/>
			<View style={{ marginVertical: 10 }} />
			<Button
				txt={bottomBtnTxt}
				outlined
				onPress={bottomBtnAction}
				icon={bottomIcon}
			/>
		</View>
	)
}

const styles = StyleSheet.create({
	actionWrap: {
		width: '100%',
		alignItems: 'center'
	},
	ontopOfNav: {
		paddingLeft: 20,
		paddingRight: 20,
		marginBottom: 75,
	},
	absolute: {
		position: 'absolute',
		right: 0,
		left: 0,
		padding: 20,
	},
})