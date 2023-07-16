import Button from '@comps/Button'
import type { RootStackParamList } from '@model/nav'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { formatInt, formatMintUrl, isNum, vib } from '@util'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Image, StyleSheet, Text, View } from 'react-native'

interface ISuccessProps {
	amount: number
	fee?: number
	mints?: string[]
	mint?: string
	memo?: string
	nav?: NativeStackNavigationProp<RootStackParamList, 'success', 'MyStack'>
	hash?: string
}

export default function Success({ amount, fee, mints, mint, memo, nav, hash }: ISuccessProps) {
	const { t } = useTranslation(['common'])
	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'success', 'MyStack'>>()
	useEffect(() => vib(400), [hash])
	return (
		<>
			<View style={styles.imgWrap}>
				<Image
					style={styles.img}
					// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
					source={require('@assets/icon_transparent.png')}
				/>
				{/* TODO show payment summary */}
				<Text style={styles.successTxt}>
					{isNum(fee) ?
						t('paymentSuccess')
						:
						<>{formatInt(amount)} Satoshi {mints ? t('claimed') : t('minted')}!</>
					}
				</Text>
				{memo &&
					<Text style={styles.mints}>
						{memo}
					</Text>
				}
				{mints && mints.map(m => (
					<Text style={styles.mints} key={m}>
						{formatMintUrl(m)}
					</Text>
				))}
				{mint && mint.length > 0 &&
					<Text style={styles.mints}>
						{formatMintUrl(mint)}
					</Text>
				}
			</View>
			{/* TODO replace with action btns component */}
			<View style={styles.btnWrap}>
				<Button border txt={t('manageMints')} onPress={() => nav ? nav.navigate('mints') : navigation.navigate('mints')} />
				<View style={{ marginBottom: 20 }} />
				<Button filled txt={t('backToDashboard')} onPress={() => nav ? nav.navigate('dashboard') : navigation.navigate('dashboard')} />
			</View>
		</>
	)
}

const styles = StyleSheet.create({
	imgWrap: {
		alignItems: 'center',
	},
	img: {
		width: 200,
		height: 250,
		resizeMode: 'contain',
		marginTop: 100,
	},
	successTxt: {
		marginTop: 25,
		fontSize: 32,
		fontWeight: '800',
		textAlign: 'center',
		color: '#FAFAFA',
	},
	mints: {
		marginTop: 10,
		fontSize: 16,
		color: '#FAFAFA'
	},
	btnWrap: {
		width: '100%',
		marginBottom: 20,
	},
	awaitTestMint: {
		fontSize: 16,
		fontWeight: '500',
		color: '#FFF',
		textAlign: 'center',
	}
})