import Button from '@comps/Button'
import Separator from '@comps/Separator'
import Txt from '@comps/Txt'
import { getProofsByMintUrl } from '@db'
import type { IProofSelection } from '@model'
import type { TCoinSelectionPageProps } from '@model/nav'
import TopNav from '@nav/TopNav'
import { ThemeContext } from '@src/context/Theme'
import { globals } from '@styles'
import { highlight as hi } from '@styles/colors'
import { formatMintUrl, getSelectedAmount } from '@util'
import { useContext, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, Switch, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { CoinSelectionModal, CoinSelectionResume2 } from './ProofList'

export default function CoinSelectionScreen({ navigation, route }: TCoinSelectionPageProps) {
	const {
		mint,
		balance,
		amount,
		estFee,
		recipient,
		isMelt,
		isSendEcash,
		isSwap,
		targetMint
	} = route.params
	const insets = useSafeAreaInsets()
	const { t } = useTranslation(['common'])
	const { color, highlight } = useContext(ThemeContext)
	const [isEnabled, setIsEnabled] = useState(false)
	const toggleSwitch = () => setIsEnabled(prev => !prev)
	const [proofs, setProofs] = useState<IProofSelection[]>([])
	const getPaymentType = () => {
		if (isMelt) { return 'cashOutFromMint' }
		if (isSwap) { return 'multimintSwap' }
		return 'sendEcash'
	}
	const submitPaymentReq = () => {
		navigation.navigate('processing', {
			mint,
			amount,
			estFee,
			isMelt,
			isSendEcash,
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
		<View style={[styles.container, { backgroundColor: color.BACKGROUND }]}>
			<TopNav
				screenName={t('paymentOverview', { ns: 'mints' })}
				withBackBtn
			/>
			<ScrollView>
				<View style={[globals(color).wrapContainer, styles.wrap]}>
					<OverviewRow txt1={t('paymentType')} txt2={t(getPaymentType())} />
					<OverviewRow txt1={t('mint')} txt2={mint.customName || formatMintUrl(mint.mintUrl)} />
					{recipient &&
						<OverviewRow txt1={t('recipient')} txt2={recipient.length > 16 ? recipient.slice(0, 16) + '...' : recipient} />
					}
					{isSwap && targetMint &&
						<OverviewRow txt1={t('recipient')} txt2={targetMint.customName || formatMintUrl(targetMint.mintUrl)} />
					}
					<OverviewRow txt1={t('amount')} txt2={`${amount} Satoshi`} />
					{estFee > 0 &&
						<OverviewRow txt1={t('estimatedFees')} txt2={`${estFee} Satoshi`} />
					}
					<OverviewRow
						txt1={t('balanceAfterTX')}
						txt2={estFee > 0 ? `${balance - amount - estFee} to ${balance - amount} Satoshi` : `${balance - amount} Satoshi`}
					/>
					<View style={styles.csRow}>
						<View>
							<Txt
								txt={t('coinSelection')}
								styles={[{ fontWeight: '500' }]}
							/>
							<Txt
								txt={t('coinSelectionHint', { ns: 'mints' })}
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
							<CoinSelectionResume2 lnAmount={amount + estFee} selectedAmount={getSelectedAmount(proofs)} />
						</>
					}
				</View>
			</ScrollView>
			<View style={{ padding: 20, paddingBottom: 20 + insets.bottom }}>
				<Button
					txt={t(isMelt ? 'submitPaymentReq' : 'createToken')}
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

interface IOverviewRowProps { txt1: string, txt2: string }

function OverviewRow({ txt1, txt2 }: IOverviewRowProps) {
	return (
		<>
			<View style={styles.overviewRow}>
				<Txt txt={txt1} styles={[{ fontWeight: '500' }]} />
				<Txt txt={txt2} />
			</View>
			<Separator style={[styles.separator]} />
		</>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		paddingTop: 110,
		flexDirection: 'column',
		justifyContent: 'space-between',
	},
	wrap: {
		padding: 20,
	},
	overviewRow: {
		flexDirection: 'row',
		alignItems: 'baseline',
		justifyContent: 'space-between'
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