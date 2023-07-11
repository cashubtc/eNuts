import { ChevronRightIcon, ExclamationIcon, SwapCurrencyIcon } from '@comps/Icons'
import { setPreferences } from '@db'
import type { RootStackParamList } from '@model/nav'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { ThemeContext } from '@src/context/Theme'
import { highlight as hi, mainColors } from '@styles'
import { formatBalance, formatInt, isBool } from '@util'
import { useContext, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

interface IBalanceProps {
	balance: number
	nav: NativeStackNavigationProp<RootStackParamList, 'dashboard', 'MyStack'>
}

export default function Balance({ balance, nav }: IBalanceProps) {
	const { t } = useTranslation(['common'])
	const { pref, color, highlight } = useContext(ThemeContext)
	const [formatSats, setFormatSats] = useState(pref?.formatBalance)
	// const { prompt, openPromptAutoClose } = usePrompt()
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
			<TouchableOpacity
				style={styles.disclaimerWrap}
				onPress={() => nav.navigate('disclaimer')}
			>
				<View style={styles.disclaimerTxt}>
					<ExclamationIcon width={22} height={22} color={mainColors.WARN} />
					<Text style={styles.issue}>
						{t('risks')}
					</Text>
				</View>
				<ChevronRightIcon color={mainColors.WARN} />
			</TouchableOpacity>
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
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		padding: 15,
		borderWidth: 1,
		borderRadius: 15,
		borderColor: mainColors.WARN,
		marginTop: 20,
	},
	disclaimerTxt: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	issue: {
		fontWeight: '500',
		color: mainColors.WARN,
		marginLeft: 10,
	},
})