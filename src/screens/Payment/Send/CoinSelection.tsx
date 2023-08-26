import Button from '@comps/Button'
import Separator from '@comps/Separator'
import Txt from '@comps/Txt'
import { getProofsByMintUrl } from '@db'
import type { IProofSelection } from '@model'
import type { TCoinSelectionPageProps } from '@model/nav'
import TopNav from '@nav/TopNav'
import { truncateNpub } from '@nostr/util'
import { useThemeContext } from '@src/context/Theme'
import { NS } from '@src/i18n'
import { globals } from '@styles'
import { highlight as hi } from '@styles/colors'
import { formatInt, formatMintUrl, getSelectedAmount, isLnurl } from '@util'
import { nip19 } from 'nostr-tools'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, Switch, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

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
		targetMint
	} = route.params
	const insets = useSafeAreaInsets()
	const { t } = useTranslation([NS.common])
	const { color, highlight } = useThemeContext()
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
			return recipient.length > 16 && !isLnurl(recipient) ? recipient.slice(0, 16) + '...' : recipient
		}
		return nostr && nostr.receiverName ? nostr.receiverName : truncateNpub(nip19.npubEncode(nostr?.receiverNpub || ''))
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
				handlePress={() => navigation.goBack()}
			/>
			<ScrollView>
				<View style={[globals(color).wrapContainer, styles.wrap]}>
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
					<OverviewRow txt1={t('amount')} txt2={`${formatInt(amount)} Satoshi`} />
					{estFee > 0 &&
						<OverviewRow txt1={t('estimatedFees')} txt2={`${estFee} Satoshi`} />
					}
					<OverviewRow
						txt1={t('balanceAfterTX')}
						txt2={estFee > 0 ? `${formatInt(balance - amount - estFee)} ${t('to')} ${formatInt(balance - amount)} Satoshi` : `${formatInt(balance - amount)} Satoshi`}
					/>
					{memo && memo.length > 0 &&
						<OverviewRow txt1={t('memo', { ns: NS.history })} txt2={memo} />
					}
					<View style={styles.csRow}>
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
						<Switch
							trackColor={{ false: color.BORDER, true: hi[highlight] }}
							thumbColor={color.TEXT}
							onValueChange={toggleSwitch}
							value={isEnabled}
						/>
					</View>
					{isEnabled && proofs.some(p => p.selected) &&
						<>
							<Separator style={[styles.separator]} />
							<CoinSelectionResume
								withSeparator
								lnAmount={amount + estFee}
								selectedAmount={getSelectedAmount(proofs)}
							/>
						</>
					}
				</View>
			</ScrollView>
			<View style={{ padding: 20, paddingBottom: insets.bottom + 20 }}>
				<Button
					txt={t(getBtnTxt())}
					onPress={submitPaymentReq}
				/>
			</View>
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
	wrap: {
		padding: 20,
	},
	csRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		width: '100%',
	},
	coinSelectionHint: {
		fontSize: 12,
		maxWidth: '88%',
	},
	separator: {
		marginVertical: 20,
	},
})