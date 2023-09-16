import { ChevronRightIcon, EcashIcon, HistoryIcon, SwapCurrencyIcon, ZapIcon } from '@comps/Icons'
import { setPreferences } from '@db'
import type { IHistoryEntry } from '@model'
import type { RootStackParamList } from '@model/nav'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import EntryTime from '@screens/History/entryTime'
import { useFocusClaimContext } from '@src/context/FocusClaim'
import { usePrivacyContext } from '@src/context/Privacy'
import { useThemeContext } from '@src/context/Theme'
import { NS } from '@src/i18n'
import { getLatestHistory } from '@store/latestHistoryEntries'
import { globals, highlight as hi } from '@styles'
import { getColor } from '@styles/colors'
import { formatBalance, formatInt, isBool } from '@util'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

import { TxtButton } from './Button'
import Logo from './Logo'
import Separator from './Separator'
import Txt from './Txt'

interface IBalanceProps {
	balance: number
	nav?: NativeStackNavigationProp<RootStackParamList, 'dashboard', 'MyStack'>
}

export default function Balance({ balance, nav }: IBalanceProps) {
	const { t } = useTranslation([NS.common])
	const { pref, color, highlight } = useThemeContext()
	// State to indicate token claim from clipboard after app comes to the foreground, to re-render total balance
	const { claimed } = useFocusClaimContext()
	const { hidden } = usePrivacyContext()
	const [formatSats, setFormatSats] = useState(pref?.formatBalance)
	const [history, setHistory] = useState<IHistoryEntry[]>([])

	const setHistoryEntries = async () => {
		const stored = (await getLatestHistory()).reverse()
		setHistory(stored)
	}

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
		void setHistoryEntries()
	}, [])

	// get history after navigating to this page
	useEffect(() => {
		// eslint-disable-next-line @typescript-eslint/no-misused-promises
		const focusHandler = nav?.addListener('focus', async () => {
			await setHistoryEntries()
		})
		return focusHandler
	}, [nav])

	useEffect(() => {
		void setHistoryEntries()
	}, [claimed])

	return (
		<View style={[
			styles.board,
			{ borderColor: color.BORDER, backgroundColor: hi[highlight] }
		]}>
			<Logo size={hidden.balance ? 100 : 40} style={{ marginTop: hidden.balance ? 40 : 0, marginBottom: hidden.balance ? 40 : 10 }} />
			{/* balance */}
			{!hidden.balance &&
				<TouchableOpacity
					style={styles.balanceWrap}
					onPress={toggleBalanceFormat}
					disabled={hidden.balance}
				>
					<Text style={[styles.balAmount, { color: getColor(highlight, color) }]}>
						{formatSats ? formatBalance(balance) : formatInt(balance)}
					</Text>
					<View style={styles.balAssetNameWrap}>
						<Text style={[styles.balAssetName, { color: getColor(highlight, color) }]}>
							{formatSats ? 'BTC' : 'Satoshi'}
						</Text>
						<SwapCurrencyIcon width={20} height={20} color={getColor(highlight, color)} />
					</View>
				</TouchableOpacity>
			}
			<Separator style={[styles.separator, { borderColor: getColor(highlight, color) }]} />
			{/* No transactions yet */}
			{!history.length && !hidden.txs &&
				<View style={{ padding: 10 }}>
					<Txt txt={t('noTX')} styles={[globals(color).pressTxt, { color: getColor(highlight, color) }]} />
				</View>
			}
			{/* latest 3 history entries */}
			{history.length > 0 && !hidden.txs ?
				history.map(h => (
					<HistoryEntry
						key={h.timestamp}
						icon={h.type === 2 || h.type === 3 ?
							<ZapIcon width={32} height={32} color={getColor(highlight, color)} />
							:
							<EcashIcon color={getColor(highlight, color)} />
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
									<HistoryIcon color={getColor(highlight, color)} />
								</View>
								<Txt txt={t('hiddenTxs')} styles={[{ color: getColor(highlight, color) }]} />
							</View>
							<ChevronRightIcon color={getColor(highlight, color)} />
						</TouchableOpacity>
					</>
					:
					null
			}
			{history.length === 3 && !hidden.txs &&
				<TxtButton
					txt={t('seeFullHistory')}
					onPress={() => nav?.navigate('history')}
					txtColor={getColor(highlight, color)}
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
	const { color, highlight } = useThemeContext()

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
						<Txt txt={txType} styles={[{ color: getColor(highlight, color) }]} />
						<Text style={{ color: getColor(highlight, color), paddingBottom: 3 }}>
							<EntryTime from={timestamp * 1000} fallback={t('justNow')} />
						</Text>
					</View>
				</View>
				<Txt txt={getAmount()} styles={[{ color: getColor(highlight, color) }]} />
			</TouchableOpacity>
		</>
	)
}

const styles = StyleSheet.create({
	board: {
		borderBottomLeftRadius: 50,
		borderBottomRightRadius: 50,
		paddingHorizontal: 30,
		paddingTop: 70,
		paddingBottom: 60,
	},
	balanceWrap: {
		alignItems: 'center',
		marginHorizontal: -20,
	},
	balAmount: {
		alignItems: 'center',
		fontSize: 46,
		fontWeight: '500',
	},
	balAssetNameWrap: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 10,
	},
	balAssetName: {
		fontSize: 14,
		marginRight: 5
	},
	separator: {
		marginVertical: 10
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