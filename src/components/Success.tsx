import Button from '@comps/Button'
import { _mintUrl } from '@consts'
import { l } from '@log'
import type { RootStackParamList } from '@model/nav'
import { useNavigation } from '@react-navigation/core'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { addToHistory } from '@store/HistoryStore'
import { formatInt, formatMintUrl, isNum, vib } from '@util'
import { requestToken } from '@wallet'
import React, { useEffect, useState } from 'react'
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
	const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'success', 'MyStack'>>()
	const [testMintTokenRdy, setTestMintTokenRdy] = useState(false)
	// Only for the hard-coded test mint. Otherwise this is done for other mints before landing in this page
	useEffect(() => {
		vib(400)
		if (hash && mint === _mintUrl) {
			// only for test mint
			void (async () => {
				const { success, invoice } = await requestToken(mint, amount, hash)
				if (!success) {
					l('requestToken failed', success, invoice)
					return
				}
				// add as history entry
				await addToHistory({
					amount,
					type: 2,
					value: invoice?.pr || '',
					mints: [mint],
				})
				setTestMintTokenRdy(true)
			})()
		}
	}, [])
	return (
		<>
			<View style={styles.imgWrap}>
				<Image
					style={styles.img}
					// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
					source={require('../../assets/icon_transparent.png')}
				/>
				{/* TODO show payment summary */}
				<Text style={styles.successTxt}>
					{isNum(fee) ?
						'Payment successfull!'
						:
						<>{formatInt(amount)} Satoshi {mints ? 'claimed' : 'minted'}!</>
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
			<View style={styles.btnWrap}>
				{(testMintTokenRdy || mint !== _mintUrl) ?
					<>
						<Button border txt='Manage mints' onPress={() => nav ? nav.navigate('mints') : navigation.navigate('mints')} />
						<View style={{ marginBottom: 20 }} />
						<Button filled txt='Back to dashboard' onPress={() => nav ? nav.navigate('dashboard') : navigation.navigate('dashboard')} />
					</>
					:
					<>
						<Text style={styles.awaitTestMint}>
							Awaiting test-mint tokens...
						</Text>
					</>
				}
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