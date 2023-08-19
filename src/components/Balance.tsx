import { AboutIcon, ChevronRightIcon, HistoryIcon, SwapCurrencyIcon } from '@comps/Icons'
import { setPreferences } from '@db'
import type { RootStackParamList } from '@model/nav'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { usePrivacyContext } from '@src/context/Privacy'
import { useThemeContext } from '@src/context/Theme'
import { NS } from '@src/i18n'
import { highlight as hi, mainColors } from '@styles'
import { formatBalance, formatInt, isBool } from '@util'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

import Logo from './Logo'
import Separator from './Separator'
import Txt from './Txt'

const currencyColor = '#F0F0F0'

interface IBalanceProps {
	balance: number
	nav?: NativeStackNavigationProp<RootStackParamList, 'dashboard', 'MyStack'>
}

export default function Balance({ balance, nav }: IBalanceProps) {
	const { t } = useTranslation([NS.common])
	const { pref, color, highlight } = useThemeContext()
	const { hidden } = usePrivacyContext()
	const [formatSats, setFormatSats] = useState(pref?.formatBalance)
	const showBalance = () => {
		if (hidden) { return '-' }
		return formatSats ? formatBalance(balance) : formatInt(balance)
	}
	const toggleBalanceFormat = () => {
		setFormatSats(prev => !prev)
		if (!pref || !isBool(formatSats)) { return }
		// update DB
		void setPreferences({ ...pref, formatBalance: !formatSats })
	}

	return (
		<View style={[
			styles.board,
			{ borderColor: color.BORDER, backgroundColor: hi[highlight] }
		]}>
			<Logo size={ hidden ? 120 : 80} style={{ marginBottom: hidden? 60 : 20, marginTop: hidden ? 60 : 0 }} />
			{/* balance */}
			{!hidden &&
				<>
					<TouchableOpacity
						style={styles.balanceWrap}
						onPress={toggleBalanceFormat}
						disabled={hidden}
					>
						<Text style={styles.balAmount}>
							{showBalance()}
						</Text>
						<View style={styles.balAssetNameWrap}>
							<Text style={styles.balAssetName}>
								{formatSats ? 'BTC' : 'Satoshi'}
							</Text>
							<SwapCurrencyIcon width={20} height={20} color={currencyColor} />
						</View>
					</TouchableOpacity>
					<Separator style={[styles.separator]} />
				</>
			}
			{/* history */}
			<BoardEntry
				txt={t('history', { ns: NS.topNav })}
				icon={<HistoryIcon color={mainColors.WHITE} />}
				color={mainColors.WHITE}
				onPress={() => nav?.navigate('history')}
				withSeparator
			/>
			{/* Disclaimer */}
			<BoardEntry
				txt={t('risks')}
				icon={<AboutIcon color={mainColors.WHITE} />}
				color={mainColors.WHITE}
				onPress={() => nav?.navigate('disclaimer')}
			/>
		</View>
	)
}

interface IBoardEntryProps {
	txt: string
	icon: React.ReactNode
	onPress: () => void
	color: string
	withSeparator?: boolean
}

function BoardEntry({ txt, icon, onPress, color, withSeparator }: IBoardEntryProps) {
	return (
		<>
			<TouchableOpacity
				style={styles.boardEntry}
				onPress={onPress}
			>
				<View style={styles.disclaimerTxt}>
					<View style={styles.iconWrap}>
						{icon}
					</View>
					<Txt txt={txt} styles={[{ color }]} />
				</View>
				<ChevronRightIcon color={color} />
			</TouchableOpacity>
			{withSeparator && <Separator style={[styles.separator]} />}
		</>
	)
}

const styles = StyleSheet.create({
	board: {
		borderBottomLeftRadius: 50,
		borderBottomRightRadius: 50,
		paddingHorizontal: 30,
		paddingVertical: 70,
	},
	balanceWrap: {
		alignItems: 'center',
		marginHorizontal: -20,
	},
	balAmount: {
		alignItems: 'center',
		fontSize: 46,
		fontWeight: '500',
		color: mainColors.WHITE,
	},
	balAssetNameWrap: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 10,
	},
	balAssetName: {
		fontSize: 14,
		marginRight: 5,
		color: currencyColor
	},
	separator: {
		marginVertical: 20,
		borderColor: '#E0E0E0'
	},
	iconWrap: {
		minWidth: 30,
	},
	boardEntry: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	disclaimerTxt: {
		flexDirection: 'row',
		alignItems: 'center',
	},
})