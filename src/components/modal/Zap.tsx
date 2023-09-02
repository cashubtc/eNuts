import Button, { TxtButton } from '@comps/Button'
import useLoading from '@comps/hooks/Loading'
import RadioBtn from '@comps/RadioBtn'
import Separator from '@comps/Separator'
import Txt from '@comps/Txt'
import { DONATION_ADDR } from '@consts/mints'
import { usePromptContext } from '@src/context/Prompt'
import { useThemeContext } from '@src/context/Theme'
import { NS } from '@src/i18n'
import { globals } from '@styles'
import { formatInt, getInvoiceFromLnurl, isErr, openUrl } from '@util'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

import MyModal from '.'

interface IQuestionModalProps {
	visible: boolean
	close: () => void
}

interface IZap { amount: number, emoji: string, selected: boolean }

export function ZapModal({ visible, close }: IQuestionModalProps) {
	const { t } = useTranslation([NS.common])
	const { color } = useThemeContext()
	const { openPromptAutoClose } = usePromptContext()
	const { loading, startLoading, stopLoading } = useLoading()
	const [zaps, setZaps] = useState([
		{ amount: 210, emoji: '❤️', selected: true },
		{ amount: 2100, emoji: '🙏', selected: false },
		{ amount: 21000, emoji: '🌟', selected: false },
		{ amount: 210000, emoji: '🚀', selected: false },
		{ amount: 420000, emoji: '💎', selected: false },
		{ amount: 840000, emoji: '😱', selected: false },
	])

	const handleSelect = (zap: IZap) => {
		setZaps(zaps.map(z => ({ ...z, selected: z.amount === zap.amount })))
	}

	const handleDonation = async () => {
		startLoading()
		try {
			const zap = zaps.find(z => z.selected)
			if (!zap) {
				openPromptAutoClose({ msg: 'Zap error' })
				return
			}
			// TODO store invoice and check if it has been payed
			const invoice = await getInvoiceFromLnurl(DONATION_ADDR, zap.amount)
			stopLoading()
			close()
			await openUrl(`lightning:${invoice}`)?.catch(e =>
				openPromptAutoClose({ msg: isErr(e) ? e.message : t('deepLinkErr') }))
		} catch (e) {
			openPromptAutoClose({ msg: isErr(e) ? e.message : t('deepLinkErr') })
		}
	}

	return (
		<MyModal type='bottom' animation='slide' visible={visible} close={close} >
			<Text style={globals(color).modalHeader}>
				⚡ {t('supportDev')}
			</Text>
			<Text style={globals(color).modalTxt}>
				{t('supportHint')}
			</Text>
			<View style={{ width: '100%', marginBottom: 20 }}>
				{zaps.map(z => <Selection key={z.amount} zap={z} onPress={handleSelect} />)}
			</View>
			<Button
				// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
				txt={`${t('donateLn')}  🎁`} 
				onPress={() => void handleDonation()}
				loading={loading}
			/>
			<TxtButton txt={t('cancel')} onPress={close} />
		</MyModal>
	)
}

interface ISelectionProps {
	zap: IZap
	onPress: (zap: IZap) => void
}

function Selection({ zap, onPress }: ISelectionProps) {
	return (
		<>
			<TouchableOpacity style={styles.zapRow} onPress={() => onPress(zap)} >
				<View style={styles.amountWrap}>
					<Text>{zap.emoji}</Text>
					<Txt
						txt={`${formatInt(zap.amount, 'compact')} Satoshi`}
						styles={[{ marginLeft: 10 }]}
					/>
				</View>
				<RadioBtn selected={zap.selected} />
			</TouchableOpacity>
			{zap.amount < 840000 && <Separator />}
		</>
	)
}

const styles = StyleSheet.create({
	zapRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingVertical: 15
	},
	amountWrap: {
		flexDirection: 'row',
		alignItems: 'center'
	}
})