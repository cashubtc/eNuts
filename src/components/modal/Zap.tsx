import Button, { TxtButton } from '@comps/Button'
import useLoading from '@comps/hooks/Loading'
import RadioBtn from '@comps/RadioBtn'
import Separator from '@comps/Separator'
import Txt from '@comps/Txt'
import { DONATION_ADDR } from '@consts/mints'
import { usePromptContext } from '@src/context/Prompt'
import { useThemeContext } from '@src/context/Theme'
import { NS } from '@src/i18n'
import { IZapModalProps, IZapReturnData } from '@src/model/zap'
import { getMintsBalances } from '@src/storage/db'
import { getCustomMintNames } from '@store/mintStore'
import { globals } from '@styles'
import { formatSatStr, getInvoiceFromLnurl, isErr } from '@util'
import { checkFees } from '@wallet'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Text, TouchableOpacity, View } from 'react-native'
import { s, ScaledSheet, vs } from 'react-native-size-matters'

import MyModal from '.'

interface IZap { amount: number, emoji: string, selected: boolean }

export function ZapModal({ visible, close, onReturnData }: IZapModalProps) {
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

	const handleSelect = (zap: IZap) =>
		setZaps(zaps.map(z => ({ ...z, selected: z.amount === zap.amount })))

	const handleDonation = async () => {
		startLoading()
		try {
			const zap = zaps.find(z => z.selected)
			if (!zap) {
				openPromptAutoClose({ msg: 'Zap error' })
				return
			}

			try {

				const invoice = await getInvoiceFromLnurl(DONATION_ADDR, zap.amount)
				const mintsWithBal = await getMintsBalances()
				if (mintsWithBal.length > 0 ) {
					const mints = await getCustomMintNames(mintsWithBal.map(m => ({ mintUrl: m.mintUrl })))
					const nonEmptyMint = mintsWithBal.filter(m => m.amount > zap.amount)
					if (nonEmptyMint.length > 0) {

						const mintUsing = mints.find(m => m.mintUrl === nonEmptyMint[0].mintUrl) || { mintUrl: 'N/A', customName: 'N/A' }
						const estFee = await checkFees(mintUsing.mintUrl, invoice)

						const returnData: IZapReturnData = {
							invoice,
							amount: zap.amount,
							mintUsing,
							estFee,
							balance: nonEmptyMint[0].amount

						}
						onReturnData(returnData)

					} else {
						openPromptAutoClose({ msg:t('lowBalanceError')})
					}
					
				} else {
					openPromptAutoClose({ msg:t('lowBalanceError') })
				}
				
			} catch (e) {
				openPromptAutoClose({ msg: isErr(e) ? e.message : t('lowBalanceError') })
			}

			stopLoading()			
			close()

	
			/*  commented to spend from the wallet
			await openUrl(`lightning:${invoice}`)?.catch(e =>
				openPromptAutoClose({ msg: isErr(e) ? e.message : t('deepLinkErr') })) */
		} catch (e) {
			openPromptAutoClose({ msg: isErr(e) ? e.message : t('deepLinkErr') })
		}
	}

	return (
		<MyModal type='bottom' animation='slide' visible={visible} close={close} >
			<Txt
				txt={t('donateLn')}
				bold
				styles={[styles.modalHeader]}
			/>
			<Text style={[globals(color).modalTxt, { color: color.TEXT_SECONDARY }]}>
				{t('supportHint')}
			</Text>
			<View style={{ width: '100%', marginBottom: vs(18) }}>
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
						txt={formatSatStr(zap.amount, 'compact')}
						styles={[{ marginLeft: s(10) }]}
					/>
				</View>
				<RadioBtn selected={zap.selected} />
			</TouchableOpacity>
			{zap.amount < 840000 && <Separator style={[{ marginBottom: vs(10) }]} />}
		</>
	)
}

const styles = ScaledSheet.create({
	modalHeader: {
		fontSize: '22@vs',
		marginBottom: '18@vs'
	},
	zapRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingBottom: '15@vs',
	},
	amountWrap: {
		flexDirection: 'row',
		alignItems: 'center'
	}
})