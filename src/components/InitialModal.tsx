import MyModal from '@modal'
import { ThemeContext } from '@src/context/Theme'
import { globals } from '@styles'
import { useContext } from 'react'
import { StyleSheet, Text, TouchableOpacity } from 'react-native'

import Button from './Button'

interface IInitialModalProps {
	visible: boolean
	onConfirm: () => void
	onCancel: () => void
}

export default function InitialModal({ visible, onConfirm, onCancel }: IInitialModalProps) {
	const { color, highlight } = useContext(ThemeContext)
	return (
		<MyModal type="bottom" animation="slide" visible={visible} close={onCancel}>
			<Text style={globals(color, highlight).modalHeader}>Get started</Text>
			<Text style={globals(color, highlight).modalTxt}>
				You should add a mint that you trust before sending or receiving tokens.
			</Text>
			<Button txt="Add a mint now" onPress={onConfirm} />
			<TouchableOpacity onPress={onCancel}>
				<Text style={[globals(color, highlight).pressTxt, styles.cancel]}>Will do later</Text>
			</TouchableOpacity>
		</MyModal>
	)
}

const styles = StyleSheet.create({
	cancel: {
		marginTop: 25,
	},
})
