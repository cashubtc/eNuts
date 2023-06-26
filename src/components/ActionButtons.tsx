import { StyleSheet, View } from 'react-native'

import Button from './Button'

interface IActionBtnsProps {
	topBtnTxt: string
	topBtnAction: () => void
	bottomBtnTxt: string
	bottomBtnAction: () => void
	ontopOfNav?: boolean
	absolutePos?: boolean
	loading?: boolean
}

export default function ActionButtons({
	topBtnTxt,
	topBtnAction,
	bottomBtnTxt,
	bottomBtnAction,
	ontopOfNav,
	absolutePos,
	loading
}: IActionBtnsProps) {
	return (
		<View
			style={[
				styles.actionWrap,
				ontopOfNav ? styles.ontopOfNav : {},
				absolutePos ? styles.absolute : {},
			]}
		>
			<Button
				loading={loading}
				txt={topBtnTxt}
				onPress={topBtnAction}
			/>
			<View style={{ marginVertical: 10 }} />
			<Button
				txt={bottomBtnTxt}
				outlined
				onPress={bottomBtnAction}
			/>
		</View>
	)
}

const styles = StyleSheet.create({
	actionWrap: {
		width: '100%',
	},
	ontopOfNav: {
		paddingLeft: 20,
		paddingRight: 20,
		marginBottom: 75,
	},
	absolute: {
		position: 'absolute',
		right: 0,
		bottom: 0,
		left: 0,
		padding: 20,
	}
})