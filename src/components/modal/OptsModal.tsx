import { TxtButton } from '@comps/Button'
import { CopyIcon, NostrIcon, ReceiveIcon, SendMsgIcon, ZapIcon } from '@comps/Icons'
import Option from '@comps/Option'
import Txt from '@comps/Txt'
import { useNostrContext } from '@src/context/Nostr'
import { useThemeContext } from '@src/context/Theme'
import { NS } from '@src/i18n'
import { mainColors } from '@styles'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet } from 'react-native'

import MyModal from '.'

interface IOptsModal {
	visible: boolean
	button1Txt: string
	onPressFirstBtn: () => void
	button2Txt: string
	onPressSecondBtn: () => void
	onPressCancel: () => void
	handleNostrReceive?: () => void
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
	handleNostrReceive,
	loading,
	isSend,
}: IOptsModal) {
	const { t } = useTranslation([NS.common])
	const { color } = useThemeContext()
	const { nutPub } = useNostrContext().nostr
	return (
		<MyModal type='bottom' animation='slide' visible={visible} close={onPressCancel}>
			<Txt
				txt={isSend ? t('send', { ns: NS.wallet }) : t('receive', { ns: NS.wallet })}
				bold
				center
				styles={[styles.hint]}
			/>
			<ScrollView style={styles.optionWrap}>
				<Option
					icon={isSend ? <SendMsgIcon width={16} height={16} color={mainColors.VALID} /> : <CopyIcon color={mainColors.VALID} />}
					txt={button1Txt}
					hint={isSend ? t('sendEcashDashboard') : t('receiveEcashDashboard')}
					onPress={onPressFirstBtn}
					hasSeparator
					loading={loading}
					secondIcon={!isSend && <ReceiveIcon width={26} height={26} color={color.TEXT} />}
				/>
				{!isSend && nutPub.length > 0 &&
					<Option
						icon={<NostrIcon />}
						txt={t('receiveEcashNostr')}
						hint={t('receiveEcashNostrHint')}
						onPress={() => handleNostrReceive?.()}
						hasSeparator
					/>
				}
				<Option
					icon={<ZapIcon width={26} height={26} color={mainColors.WARN} />}
					txt={button2Txt}
					hint={isSend ? t('payInvoiceDashboard') : t('createInvoiceDashboard')}
					onPress={onPressSecondBtn}
				/>
				<TxtButton
					txt={t('cancel')}
					onPress={onPressCancel}
					style={[{ paddingBottom: 15, paddingTop: 15 }]}
				/>
			</ScrollView>
		</MyModal>
	)
}

const styles = StyleSheet.create({
	optionWrap: {
		width: '100%',
		paddingHorizontal: 10
	},
	hint: {
		fontSize: 20,
		marginBottom: 30,
	},
})