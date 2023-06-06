import { ExclamationIcon, SwapCurrencyIcon } from '@comps/Icons'
import { setPreferences } from '@db'
import { ThemeContext } from '@src/context/Theme'
import { highlight as hi, mainColors } from '@styles'
import { formatBalance, formatInt, isBool } from '@util'
import React, { useContext, useState } from 'react'
import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

interface IBalanceProps {
	balance: number
}

export default function Balance({ balance }: IBalanceProps) {
	const { pref, color, highlight } = useContext(ThemeContext)
	const [formatSats, setFormatSats] = useState(pref?.formatBalance)

	const toggleBalanceFormat = () => {
		setFormatSats(prev => !prev)
		if (!pref || !isBool(formatSats)) { return }
		// update DB
		void setPreferences({ ...pref, formatBalance: !formatSats })
	}

	return (
		<View style={styles.balanceContainer}>
			<TouchableOpacity style={styles.balanceWrap} onPress={toggleBalanceFormat}>
				{/* <Text style={[styles.balPending, { color: color.TEXT_SECONDARY }]}>
				Pending{'('}0{')'}
			</Text> */}
				<Text style={[styles.balAmount, { color: hi[highlight] }]}>
					{formatSats ? formatBalance(balance) : formatInt(balance)}
				</Text>
				<View style={styles.balAssetNameWrap}>
					<Text style={[styles.balAssetName, { color: color.TEXT_SECONDARY }]}>
						{formatSats ? 'BTC' : 'Satoshi'}
					</Text>
					<SwapCurrencyIcon color={color.TEXT_SECONDARY} />
				</View>
			</TouchableOpacity>
			{/* Disclaimer */}
			<View style={styles.disclaimerWrap}>
				<ExclamationIcon width={22} height={22} color={mainColors.WARN} />
				<Text style={[styles.disclaimerTxt, { color: color.TEXT }]}>
					Please note that this is an alpha version in its early stage
					and is still undergoing testing before its official release.
					The software and all content found on it are provided on an
					“as is” and “as available” basis. We do not give any warranties,
					whether express or implied, as to the suitability or usability of the
					software or any of its content.
				</Text>
				<TouchableOpacity
					style={styles.submitIssue}
					onPress={() => void Linking.openURL('https://github.com/cashubtc/eNuts/issues/new')}
				>
					<Text style={styles.issue}>
						Submit issue on Github
					</Text>
				</TouchableOpacity>
			</View>
		</View>
	)
}

const styles = StyleSheet.create({
	balanceContainer: {
		position: 'absolute',
		top: 150,
		left: 20,
		right: 20,
		flex: 1,
	},
	balanceWrap: {
		alignItems: 'center',
	},
	/* balPending: {
		fontSize: 16,
	}, */
	balAmount: {
		flex: 1,
		alignItems: 'center',
		fontSize: 50,
		fontWeight: '500',
	},
	balAssetNameWrap: {
		flexDirection: 'row',
		alignItems: 'center',
		marginTop: 5,
	},
	balAssetName: {
		fontSize: 16,
		marginRight: 5,
	},
	disclaimerWrap: {
		alignItems: 'center',
		padding: 15,
		borderWidth: 1,
		borderRadius: 15,
		borderColor: mainColors.WARN,
		marginTop: 20,
	},
	disclaimerTxt: {
		marginVertical: 10,
		textAlign: 'center',
	},
	submitIssue: {
		padding: 10,
	},
	issue: {
		fontWeight: '500',
		color: mainColors.WARN,
	},
})