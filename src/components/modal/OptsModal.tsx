
import useNostr from '@comps/hooks/Nostr'
import { CopyIcon, ReceiveIcon, SendIcon, ZapIcon } from '@comps/Icons'
import Option from '@comps/Option'
import Txt from '@comps/Txt'
import { ThemeContext } from '@src/context/Theme'
import { globals, mainColors } from '@styles'
import { useContext } from 'react'
import { useTranslation } from 'react-i18next'
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

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
	isSend,
}: IOptsModal) {
	const { t } = useTranslation(['common'])
	const { color, highlight } = useContext(ThemeContext)
	const { hasContacts } = useNostr()
	return (
		<MyModal type='bottom' animation='slide' visible={visible} close={onPressCancel}>
			<Txt
				txt={isSend ? t('send', { ns: 'wallet' }) : t('receive', { ns: 'wallet' })}
				styles={[styles.hint, { color: color.TEXT }]}
			/>
			<View style={styles.optionWrap}>
				<Option
					icon={isSend ? <SendIcon color={mainColors.VALID} /> : <CopyIcon color={mainColors.VALID} />}
					txt={button1Txt}
					hint={isSend ? t('sendEcashDashboard') : t('receiveEcashDashboard')}
					onPress={onPressFirstBtn}
					hasSeparator
					loading={loading}
					secondIcon={!isSend && <ReceiveIcon width={26} height={26} color={color.TEXT} /> }
				/>
				{!isSend && hasContacts &&
					<Option
						icon={
							<Image
								// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
								source={require('@assets/nostr.png')}
								style={styles.nostrIcon}
							/>
						}
						txt={t('receiveEcashNostr')}
						hint={t('receiveEcashNostrHint')}
						onPress={() => {
							//
						}}
						hasSeparator
					/>
				}
				<Option
					icon={<ZapIcon width={26} height={26} color={mainColors.WARN} />}
					txt={button2Txt}
					hint={isSend ? t('payInvoiceDashboard') : t('createInvoiceDashboard')}
					onPress={onPressSecondBtn}
				/>
				<TouchableOpacity style={styles.no} onPress={onPressCancel}>
					<Text style={globals(color, highlight).pressTxt}>
						{t('cancel')}
					</Text>
				</TouchableOpacity>
			</View>
		</MyModal>
	)
}

const styles = StyleSheet.create({
	header: {
		fontSize: 18,
		fontWeight: '500'
	},
	optionWrap: {
		width: '100%',
		paddingHorizontal: 10
	},
	hint: {
		fontSize: 20,
		textAlign: 'center',
		fontWeight: '500',
		marginBottom: 30,
	},
	no: {
		marginTop: 20,
		padding: 10,
	},
	nostrIcon: {
		width: 30,
		height: 30,
		marginLeft: -5
	}
})