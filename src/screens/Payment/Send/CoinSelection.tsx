import Separator from '@comps/Separator'
import SwipeButton from '@comps/SwipeButton'
import Toggle from '@comps/Toggle'
import Txt from '@comps/Txt'
import { _testmintUrl } from '@consts'
import { getProofsByMintUrl } from '@db'
import type { IProofSelection } from '@model'
import type { TCoinSelectionPageProps } from '@model/nav'
import TopNav from '@nav/TopNav'
import { getNostrUsername, isNpub, npubEncode, truncateNpub, truncateStr } from '@nostr/util'
import { useInitialURL } from '@src/context/Linking'
import { useThemeContext } from '@src/context/Theme'
import { NS } from '@src/i18n'
import { globals } from '@styles'
import { formatInt, formatMintUrl, formatSatStr, getSelectedAmount, isNum } from '@util'
import { isLightningAddress } from '@util/lnurl'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, View } from 'react-native'
import { s, ScaledSheet } from 'react-native-size-matters'

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
		isZap,
		isSendEcash,
		nostr,
		isSwap,
		targetMint,
		scanned
	} = route.params
	const { t } = useTranslation([NS.common])
	const { color } = useThemeContext()
	const { url, clearUrl } = useInitialURL()
	const [isEnabled, setIsEnabled] = useState(false)
	const toggleSwitch = () => setIsEnabled(prev => !prev)
	const [proofs, setProofs] = useState<IProofSelection[]>([])

	const getPaymentType = () => {
		if (isZap) { return 'zap' }
		if (isMelt) { return 'cashOutFromMint' }
		if (isSwap) { return 'multimintSwap' }
		return 'sendEcash'
	}

	const getBtnTxt = () => {
		if (isZap) { return 'zapNow' }
		if (isMelt) { return 'submitPaymentReq' }
		if (isSwap) { return 'swapNow' }
		if (nostr) { return 'sendEcash' }
		return 'createToken'
	}

	const getRecipient = () => {
		if (recipient) {
			return !isLightningAddress(recipient) ? truncateStr(recipient, 16) : recipient
		}
		const npub = npubEncode(nostr?.contact?.hex ?? '')
		const receiverName = getNostrUsername(nostr?.contact)
		return nostr && receiverName ? receiverName : isNpub(npub) ? truncateNpub(npub) : t('n/a')
	}

	const submitPaymentReq = () => {
		if (isZap && mint.mintUrl === _testmintUrl) {
			return navigation.navigate('processingError', {
				mint, amount, errorMsg: t('zapNotAllowed', { ns: NS.mints })
			})
		}
		navigation.navigate('processing', {
			mint,
			amount,
			memo,
			estFee,
			isMelt,
			isSendEcash,
			nostr,
			isSwap,
			isZap,
			payZap: true,
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
				cancel
				handleCancel={() => {
					// clear the deep link url if user cancels
					if (url.length) { clearUrl() }
					navigation.navigate('dashboard')
				}}
				withBackBtn
				handlePress={() => {
					if (scanned) { return navigation.navigate('qr scan', {}) }
					const routes = navigation.getState()?.routes
					const prevRoute = routes[routes.length - 2]
					// if user comes from processing screen, navigate back to dashboard
					// @ts-expect-error navigation type is not complete
					if (prevRoute?.name === 'processing' && prevRoute.params?.isZap) {
						// clear the deep link url if user cancels
						clearUrl()
						return navigation.navigate('dashboard')
					}
					navigation.goBack()
				}}
			/>
			<ScrollView alwaysBounceVertical={false}>
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
					<OverviewRow txt1={t('amount')} txt2={formatSatStr(amount)} />
					{isNum(estFee) && !nostr && !isSendEcash &&
						<OverviewRow txt1={t('estimatedFees')} txt2={formatSatStr(estFee)} />
					}
					<View>
						<Txt
							txt={t('balanceAfterTX')}
							styles={[{ fontWeight: '500', marginBottom: s(5) }]}
						/>
						<Txt
							txt={estFee > 0 ? `${formatInt(balance - amount - estFee)} ${t('to')} ${formatSatStr(balance - amount)}` : `${formatSatStr(balance - amount)}`}
							styles={[{ color: color.TEXT_SECONDARY }]}
						/>
					</View>
					<Separator style={[{ marginTop: s(20) }]} />
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

const styles = ScaledSheet.create({
	container: {
		flexDirection: 'column',
		justifyContent: 'space-between',
	},
	coinSelectionHint: {
		fontSize: '10@vs',
		maxWidth: '88%',
	},
})