import { ChevronRightIcon, EcashIcon, HistoryIcon, SwapCurrencyIcon, ZapIcon } from '@comps/Icons'
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

	const toggleBalanceFormat = () => {
		setFormatSats(prev => !prev)
		if (!pref || !isBool(formatSats)) { return }
		// update DB
		void setPreferences({ ...pref, formatBalance: !formatSats })
	}

	const getTxTypeStr = (type: number) => {
		if (type === 1) { return 'Ecash' }
		if (type === 2) { return 'Lightning' }
		return t('swap')
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
			<Logo size={hidden.balance ? 100 : 60} style={{ marginTop: hidden.balance ? 40 : 0, marginBottom: hidden.balance ? 40 : 20 }} />
			{/* balance */}
			{!hidden.balance &&
				<TouchableOpacity
					style={styles.balanceWrap}
					onPress={toggleBalanceFormat}
					disabled={hidden.balance}
				>
					<Text style={styles.balAmount}>
						{formatSats ? formatBalance(balance) : formatInt(balance)}
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
			{/* No transactions yet */}
			{!history.length && !hidden.txs &&
				<View style={{ padding: 10 }}>
					<Txt txt={t('noTX')} styles={[globals(color).pressTxt, { color: mainColors.WHITE }]} />
				</View>
			}
			{/* latest 3 history entries */}
			{history.length > 0 && !hidden.txs ?
				history.map(h => (
					<HistoryEntry
						key={h.timestamp}
						icon={h.type === 2 || h.type === 3 ?
							<ZapIcon width={32} height={32} color={mainColors.WHITE} />
							:
							<EcashIcon color={mainColors.WHITE} />
						}
						isSwap={h.type === 3}
						txType={getTxTypeStr(h.type)}
						timestamp={h.timestamp}
						amount={h.amount}
						onPress={() => nav?.navigate('history entry details', { entry: h })}
					/>
				))
				:
				hidden.txs ?
					<>
						<TouchableOpacity
							style={styles.boardEntry}
							onPress={() => nav?.navigate('history')}
						>
							<View style={styles.hiddenTxtWrap}>
								<View style={styles.iconWrap}>
									<HistoryIcon color={mainColors.WHITE} />
								</View>
								<Txt txt={t('hiddenTxs')} styles={[{ color: mainColors.WHITE }]} />
							</View>
							<ChevronRightIcon color={mainColors.WHITE} />
						</TouchableOpacity>
					</>
					:
					null
			}
			{history.length === 3 && !hidden.txs &&
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
	isSwap?: boolean
	timestamp: number
	amount: number
	onPress: () => void
}

function HistoryEntry({ icon, txType, isSwap, timestamp, amount, onPress }: IHistoryEntryProps) {
	const { t } = useTranslation([NS.history])

	const getAmount = () => {
		if (isSwap) { return `${formatInt(Math.abs(amount))} Satoshi` }
		return `${amount > 0 ? '+' : ''}${formatInt(amount)} Satoshi`
	}

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
				<Txt txt={getAmount()} styles={[{ color: mainColors.WHITE }]} />
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
	boardEntry: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginVertical: 10,
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
	hiddenTxtWrap: {
		flexDirection: 'row',
		alignItems: 'center',
	},
})