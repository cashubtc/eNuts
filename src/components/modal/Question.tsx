import Button from '@comps/Button'
import { ThemeContext } from '@src/context/Theme'
import { globals } from '@styles'
import { useContext } from 'react'
import { StyleSheet, Text, TouchableOpacity } from 'react-native'

import MyModal from '.'

interface IQuestionModalProps {
	header?: string
	txt?: string
	visible: boolean
	confirmTxt?: string
	confirmFn: () => void
	cancelTxt?: string
	cancelFn: () => void
}

export function QuestionModal({
	header,
	txt,
	visible,
	confirmTxt,
	confirmFn,
	cancelTxt,
	cancelFn,
}: IQuestionModalProps) {
	const { color, highlight } = useContext(ThemeContext)
	return (
		<MyModal type="question" animation="fade" visible={visible} close={cancelFn}>
			<Text style={[globals(color).modalHeader, !txt?.length ? { marginBottom: 0 } : {}]}>{header}</Text>
			<Text style={globals(color).modalTxt}>{txt}</Text>
			<Button txt={confirmTxt || 'Yes'} onPress={confirmFn} />
			<TouchableOpacity style={styles.cancelWrap} onPress={cancelFn}>
				<Text style={globals(color, highlight).pressTxt}>{cancelTxt || 'No'}</Text>
			</TouchableOpacity>
		</MyModal>
	)
}

const styles = StyleSheet.create({
	cancelWrap: {
		width: '25%',
		alignItems: 'center',
		paddingTop: 35,
	},
})
