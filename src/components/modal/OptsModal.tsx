import ActionButtons from '@comps/ActionButtons'
import { ThemeContext } from '@src/context/Theme'
import { globals } from '@styles'
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
	loading?: boolean
}

export default function OptsModal({
	visible,
	button1Txt,
	onPressFirstBtn,
	button2Txt,
	onPressSecondBtn,
	onPressCancel,
	loading
}: IOptsModal) {
	const { color, highlight } = useContext(ThemeContext)
	return (
		<MyModal type='bottom' animation='slide' visible={visible} close={onPressCancel}>
			<View style={{ marginVertical: 10 }} />
			<ActionButtons
				topBtnTxt={button1Txt}
				topBtnAction={onPressFirstBtn}
				bottomBtnTxt={button2Txt}
				bottomBtnAction={onPressSecondBtn}
				loading={loading}
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
		padding: 10,
	},
})