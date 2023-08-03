import Button from '@comps/Button'
import Logo from '@comps/Logo'
import Txt from '@comps/Txt'
import { isIOS } from '@consts'
import type { TSuccessPageProps } from '@model/nav'
import { ThemeContext } from '@src/context/Theme'
import { highlight as hi } from '@styles'
import { formatInt, formatMintUrl, vib } from '@util'
import { useContext, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default function SuccessPage({ navigation, route }: TSuccessPageProps) {
	const { amount, memo, fee, mint, isClaim, isMelt, nostr } = route.params
	const { t } = useTranslation(['common'])
	const { highlight } = useContext(ThemeContext)
	const insets = useSafeAreaInsets()
	useEffect(() => vib(400), [])
	return (
		<View style={[styles.container, { backgroundColor: hi[highlight] }]}>
			<Logo size={250} style={styles.img} />
			<View style={{ width: '100%' }}>
				<Text style={styles.successTxt}>
					{nostr &&
						<>
							{formatInt(amount || 0)} Satoshi {t('nostrPaymentSuccess')}!
						</>
					}
					{isMelt ?
						t('paymentSuccess')
						:
						!nostr ?
							<>{formatInt(amount || 0)} Satoshi {isClaim ? t('claimed') : t('minted')}!</>
							:
							null
					}
				</Text>
				{memo &&
					<Text style={styles.mints}>
						{memo}
					</Text>
				}
				{mint && mint.length > 0 &&
					<Text style={styles.mints}>
						{formatMintUrl(mint)}
					</Text>
				}
				{isMelt && amount &&
					<View style={styles.meltWrap}>
						<View style={styles.meltOverview}>
							<Txt txt={t('paidOut', { ns: 'wallet' })} styles={[styles.meltTxt]} />
							<Txt txt={`${amount} Satoshi`} styles={[styles.meltTxt]} />
						</View>
						<View style={styles.meltOverview}>
							<Txt txt={t('fee')} styles={[styles.meltTxt]} />
							<Txt txt={`${fee} Satoshi`} styles={[styles.meltTxt]} />
						</View>
						<View style={styles.meltOverview}>
							<Txt txt={t('totalInclFee')} styles={[styles.meltTxt]} />
							<Txt txt={`${amount + (fee || 0)} Satoshi`} styles={[styles.meltTxt]} />
						</View>
					</View>
				}
			</View>
			<View style={[styles.btnWrap, { marginBottom: isIOS ? insets.bottom : 20 }]}>
				<Button border txt={t('manageMints')} onPress={() => navigation.navigate('mints')} />
				<View style={{ marginVertical: 10 }} />
				<Button filled txt={t('backToDashboard')} onPress={() => navigation.navigate('dashboard')} />
			</View>
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'space-between',
		padding: 20,
	},
	img: {
		marginTop: 100,
	},
	successTxt: {
		fontSize: 30,
		fontWeight: '800',
		textAlign: 'center',
		color: '#FAFAFA',
	},
	meltWrap: {
		width: '100%',
		marginTop: 20,
	},
	meltOverview: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: 10,
	},
	meltTxt: {
		color: '#FFF',
		fontWeight: '500'
	},
	mints: {
		marginTop: 20,
		fontSize: 16,
		textAlign: 'center',
		fontWeight: '500',
		color: '#FAFAFA'
	},
	btnWrap: {
		width: '100%',
	},
})