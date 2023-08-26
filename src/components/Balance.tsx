import { EcashIcon, SwapCurrencyIcon, ZapIcon } from '@comps/Icons'
import { setPreferences } from '@db'
import type { IHistoryEntry } from '@model'
import type { RootStackParamList } from '@model/nav'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import EntryTime from '@screens/History/entryTime'
import { usePrivacyContext } from '@src/context/Privacy'
import { useThemeContext } from '@src/context/Theme'
import { NS } from '@src/i18n'
import { getLatestHistory } from '@store/latestHistoryEntries'
import { globals, highlight as hi, mainColors } from '@styles'
import { formatBalance, formatInt, isBool } from '@util'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

import { TxtButton } from './Button'
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
	const [history, setHistory] = useState<IHistoryEntry[]>([])

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

	useEffect(() => {
		void (async () => {
			const stored = (await getLatestHistory()).reverse()
			setHistory(stored)
		})()
	}, [])

	// get history after navigating to this page
	useEffect(() => {
		// eslint-disable-next-line @typescript-eslint/no-misused-promises
		const focusHandler = nav?.addListener('focus', async () => {
			const stored = (await getLatestHistory()).reverse()
			setHistory(stored)
		})
		return focusHandler
	}, [nav])

	return (
		<View style={[
			styles.board,
			{ borderColor: color.BORDER, backgroundColor: hi[highlight] }
		]}>
			<Logo size={hidden ? 100 : 60} style={{ marginTop: hidden ? 40 : 0, marginBottom: hidden ? 40 : 20 }} />
			{/* balance */}
			{!hidden &&
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
			}
			<Separator style={[styles.separator]} />
			{/* latest 3 history entries */}
			{history.length ?
				history.map(h => (
					<HistoryEntry
						key={h.timestamp}
						icon={h.type === 2 || h.type === 3 ?
							<ZapIcon width={32} height={32} color={mainColors.WHITE} />
							:
							<EcashIcon color={mainColors.WHITE} />
						}
						txType={h.type === 2 || h.type === 3 ? 'Lightning' : 'Ecash'}
						timestamp={h.timestamp}
						amount={h.amount}
						onPress={() => nav?.navigate('history entry details', { entry: h })}
					/>
				))
				:
				<View style={{ padding: 10 }}>
					<Txt txt={t('noTX')} styles={[globals(color).pressTxt, { color: mainColors.WHITE }]} />
				</View>
			}
			{history.length === 3 &&
				<TxtButton
					txt={t('seeFullHistory')}
					onPress={() => nav?.navigate('history')}
					txtColor={mainColors.WHITE}
					style={[{ paddingTop: 20, paddingBottom: 0 }]}
				/>
			}
		</View>
	)
}

interface IHistoryEntryProps {
	icon: React.ReactNode
	txType: string
	timestamp: number
	amount: number
	onPress: () => void
}

function HistoryEntry({ icon, txType, timestamp, amount, onPress }: IHistoryEntryProps) {
	const { t } = useTranslation([NS.history])
	return (
		<>
			<TouchableOpacity
				style={styles.entry}
				onPress={onPress}
			>
				<View style={styles.wrap}>
					<View style={styles.iconWrap}>
						{icon}
					</View>
					<View>
						<Txt txt={txType} styles={[{ color: mainColors.WHITE }]} />
						<Text style={{ color: currencyColor, paddingBottom: 3 }}>
							<EntryTime from={timestamp * 1000} fallback={t('justNow')} />
						</Text>
					</View>
				</View>
				<Txt txt={`${amount > 0 ? '+' : ''}${formatInt(amount)}`} styles={[{ color: mainColors.WHITE, fontWeight: '500' }]} />
			</TouchableOpacity>
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
		marginTop: 20,
		marginBottom: 10,
		borderColor: '#E0E0E0'
	},
	iconWrap: {
		minWidth: 45,
		paddingTop: 3,
	},
	entry: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingVertical: 5,
	},
	wrap: {
		flexDirection: 'row',
		alignItems: 'center',
	},
})