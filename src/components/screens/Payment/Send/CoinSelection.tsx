import Button from '@comps/Button'
import Separator from '@comps/Separator'
import Txt from '@comps/Txt'
import { getProofsByMintUrl } from '@db'
import type { IProofSelection } from '@model'
import type { TCoinSelectionPageProps } from '@model/nav'
import TopNav from '@nav/TopNav'
import { CoinSelectionModal, CoinSelectionResume2 } from '@screens/Lightning/modal'
import { ThemeContext } from '@src/context/Theme'
import { globals } from '@styles'
import { highlight as hi } from '@styles/colors'
import { getSelectedAmount } from '@util'
import { useContext, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Switch, View } from 'react-native'

export default function CoinSelectionScreen({ navigation, route }: TCoinSelectionPageProps) {
	const { mint, amount, recipient, estFee, isMelt, isSendEcash } = route.params
	const { t } = useTranslation(['common'])
	const { color, highlight } = useContext(ThemeContext)
	const [isEnabled, setIsEnabled] = useState(false)
	const toggleSwitch = () => setIsEnabled(prev => !prev)
	const [proofs, setProofs] = useState<IProofSelection[]>([])
	const submitPaymentReq = () => {
		navigation.navigate('processing', {
			mint,
			amount,
			isMelt,
			isSendEcash,
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
				screenName={t('cashOut')}
				withBackBtn
			/>
			<View style={[styles.wrap, globals(color).wrapContainer]}>
				<View>
					
				</View>
				<Separator style={[styles.separator]} />
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
			<View style={styles.btnWrap}>
				<Button
					txt={t('submitPaymentReq')}
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
		flex: 1,
		paddingTop: 110,
		flexDirection: 'column',
		justifyContent: 'space-between',
	},
	wrap: {
		paddingVertical: 20,
	},
	csRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		width: '100%',
	},
	coinSelectionHint: {
		fontSize: 12,
		maxWidth: '90%',
	},
	separator: {
		marginVertical: 20,
	},
	btnWrap: {
		padding: 20,
	}
})