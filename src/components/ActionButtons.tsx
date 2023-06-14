import { StyleSheet, View } from 'react-native'

import Button from './Button'

interface IActionBtnsProps {
	topBtnTxt: string
	topBtnAction: () => void
	bottomBtnTxt: string
	bottomBtnAction: () => void
	ontopOfNav?: boolean
}

export default function ActionButtons({
	topBtnTxt,
	topBtnAction,
	bottomBtnTxt,
	bottomBtnAction,
	ontopOfNav
}: IActionBtnsProps) {
	return (
		<View style={[styles.actionWrap, ontopOfNav ? styles.ontopOfNav : {}]}>
			<Button
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
	}
})