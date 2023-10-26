import Separator from '@comps/Separator'
import SwipeButton from '@comps/SwipeButton'
import Toggle from '@comps/Toggle'
import Txt from '@comps/Txt'
import { getProofsByMintUrl } from '@db'
import type { IProofSelection } from '@model'
import type { TCoinSelectionPageProps } from '@model/nav'
import TopNav from '@nav/TopNav'
import { isNpub, npubEncode, truncateNpub, truncateStr } from '@nostr/util'
import { useThemeContext } from '@src/context/Theme'
import { NS } from '@src/i18n'
import { globals } from '@styles'
import { formatInt, formatMintUrl, getSelectedAmount, isLnurl, isNum } from '@util'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, View } from 'react-native'

import { CoinSelectionModal, CoinSelectionResume, OverviewRow } from './ProofList'

export default function CoinSelectionScreen({ navigation, route }: TCoinSelectionPageProps) {
	const {
		mint,
		balance,
		amount,
		memo,
		estFee,
		recipient,
		isMelt,
		isSendEcash,
		nostr,
		isSwap,
		targetMint,
		scanned
	} = route.params
	const { t } = useTranslation([NS.common])
	const { color } = useThemeContext()
	const [isEnabled, setIsEnabled] = useState(false)
	const toggleSwitch = () => setIsEnabled(prev => !prev)
	const [proofs, setProofs] = useState<IProofSelection[]>([])

	const getPaymentType = () => {
		if (isMelt) { return 'cashOutFromMint' }
		if (isSwap) { return 'multimintSwap' }
		return 'sendEcash'
	}

	const getBtnTxt = () => {
		if (isMelt) { return 'submitPaymentReq' }
		if (isSwap) { return 'swapNow' }
		if (nostr) { return 'sendEcash' }
		return 'createToken'
	}

	const getRecipient = () => {
		if (recipient) {
			return !isLnurl(recipient) ? truncateStr(recipient, 16) : recipient
		}
		const npub = npubEncode(nostr?.receiverHex ?? '')
		return nostr && nostr.receiverName ? nostr.receiverName : isNpub(npub) ? truncateNpub(npub) : t('n/a')
	}

	const submitPaymentReq = () => {
		navigation.navigate('processing', {
			mint,
			amount,
			memo,
			estFee,
			isMelt,
			isSendEcash,
			nostr,
			isSwap,
			targetMint,
			proofs: proofs.filter(p => p.selected),
			recipient
		})
	}

	// set proofs
	useEffect(() => {
		void (async () => {
			const proofsDB = (await getProofsByMintUrl(mint.mintUrl)).map(p => ({ ...p, selected: false }))
			setProofs(proofsDB)
		})()
	}, [mint.mintUrl])

	return (
		<View style={[globals(color).container, styles.container]}>
			<TopNav
				screenName={t('paymentOverview', { ns: NS.mints })}
				withBackBtn
				handlePress={() => {
					if (scanned) { return navigation.navigate('qr scan', {}) }
					navigation.goBack()
				}}
			/>
			<ScrollView>
				<View style={globals(color).wrapContainer}>
					<OverviewRow txt1={t('paymentType')} txt2={t(getPaymentType())} />
					<OverviewRow txt1={t('mint')} txt2={mint.customName || formatMintUrl(mint.mintUrl)} />
					{(recipient || nostr) &&
						<OverviewRow
							txt1={t('recipient')}
							txt2={getRecipient()}
						/>
					}
					{isSwap && targetMint &&
						<OverviewRow txt1={t('recipient')} txt2={targetMint.customName || formatMintUrl(targetMint.mintUrl)} />
					}
					<OverviewRow txt1={t('amount')} txt2={`${formatInt(amount)} Sat`} />
					{isNum(estFee) && !nostr && !isSendEcash &&
						<OverviewRow txt1={t('estimatedFees')} txt2={`${estFee} Sat`} />
					}
					<OverviewRow
						txt1={t('balanceAfterTX')}
						txt2={estFee > 0 ? `${formatInt(balance - amount - estFee)} ${t('to')} ${formatInt(balance - amount)} Sat` : `${formatInt(balance - amount)} Sat`}
					/>
					{memo && memo.length > 0 &&
						<OverviewRow txt1={t('memo', { ns: NS.history })} txt2={memo} />
					}
					<View style={globals().wrapRow}>
						<View>
							<Txt
								txt={t('coinSelection')}
								styles={[{ fontWeight: '500' }]}
							/>
							<Txt
								txt={t('coinSelectionHint', { ns: NS.mints })}
								styles={[styles.coinSelectionHint, { color: color.TEXT_SECONDARY }]}
							/>
						</View>
						<Toggle value={isEnabled} onChange={toggleSwitch} />
					</View>
					{isEnabled && proofs.some(p => p.selected) &&
						<>
							<Separator />
							<CoinSelectionResume
								withSeparator
								lnAmount={amount + estFee}
								selectedAmount={getSelectedAmount(proofs)}
							/>
						</>
					}
				</View>
			</ScrollView>
			<SwipeButton
				txt={t(getBtnTxt())}
				onToggle={submitPaymentReq}
			/>
			{/* coin selection page */}
			{isEnabled &&
				<CoinSelectionModal
					mint={mint}
					lnAmount={amount + estFee}
					disableCS={() => setIsEnabled(false)}
					proofs={proofs}
					setProof={setProofs}
				/>
			}
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		flexDirection: 'column',
		justifyContent: 'space-between',
	},
	coinSelectionHint: {
		fontSize: 12,
		maxWidth: '88%',
	},
})