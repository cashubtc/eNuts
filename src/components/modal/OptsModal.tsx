import ActionButtons from '@comps/ActionButtons'
import Txt from '@comps/Txt'
import { ThemeContext } from '@src/context/Theme'
import { globals } from '@styles'
import { useContext } from 'react'
import { useTranslation } from 'react-i18next'
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
	isSend?: boolean
}

export default function OptsModal({
	visible,
	button1Txt,
	onPressFirstBtn,
	button2Txt,
	onPressSecondBtn,
	onPressCancel,
	loading,
	isSend
}: IOptsModal) {
	const { t } = useTranslation(['common'])
	const { color, highlight } = useContext(ThemeContext)
	return (
		<MyModal type='bottom' animation='slide' visible={visible} close={onPressCancel}>
			<Txt
				txt={isSend ? t('sendHint', { ns: 'wallet' }) : t('receiveHint', { ns: 'wallet' })}
				styles={[styles.hint, { color: color.TEXT_SECONDARY }]}
			/>
			<View style={{ marginVertical: 15 }} />
			<ActionButtons
				topBtnTxt={button1Txt}
				topBtnAction={onPressFirstBtn}
				bottomBtnTxt={button2Txt}
				bottomBtnAction={onPressSecondBtn}
				loading={loading}
			/>
			<TouchableOpacity style={styles.no} onPress={onPressCancel}>
				<Text style={globals(color, highlight).pressTxt}>
					{t('cancel')}
				</Text>
			</TouchableOpacity>
		</MyModal>
	)
}

const styles = StyleSheet.create({
	header: {
		fontSize: 18,
		fontWeight: '500'
	},
	hint: {
		fontSize: 16,
		textAlign: 'center',
		fontWeight: '500'
	},
	no: {
		marginTop: 15,
		padding: 10,
	},
})