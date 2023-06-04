import Button from '@comps/Button'
import { ThemeContext } from '@src/context/Theme'
import { globals } from '@styles/globals'
import { useContext } from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

import MyModal from '.'

interface IOptsModal {
	visible: boolean
	button1Txt: string
	onPressFirstBtn: () => void
	button2Txt: string
	onPressSecondBtn: () => void
	onPressCancel: () => void
}

export default function OptsModal({
	visible,
	button1Txt,
	onPressFirstBtn,
	button2Txt,
	onPressSecondBtn,
	onPressCancel
}: IOptsModal) {
	const { color, highlight } = useContext(ThemeContext)
	return (
		<MyModal type='bottom' animation='slide' visible={visible}>
			<Button
				txt={button1Txt}
				onPress={onPressFirstBtn}
			/>
			<View style={{ marginVertical: 10 }} />
			<Button
				txt={button2Txt}
				outlined
				onPress={onPressSecondBtn}
			/>
			<TouchableOpacity style={styles.no} onPress={onPressCancel}>
				<Text style={globals(color, highlight).pressTxt}>
					cancel
				</Text>
			</TouchableOpacity>
		</MyModal>
	)
}

const styles = StyleSheet.create({
	no: {
		fontSize: 16,
		fontWeight: '500',
		marginTop: 15,
		marginBottom: -15,
		padding: 10,
	},
})