import { ClockIcon, EcashIcon, SwapCurrencyIcon, ZapIcon } from '@comps/Icons'
import { setPreferences } from '@db'
import type { RootStackParamList } from '@model/nav'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import EntryTime from '@screens/History/entryTime'
import { useBalanceContext } from '@src/context/Balance'
import { useHistoryContext } from '@src/context/History'
import { usePrivacyContext } from '@src/context/Privacy'
import { useThemeContext } from '@src/context/Theme'
import { NS } from '@src/i18n'
import { globals, highlight as hi } from '@styles'
import { getColor } from '@styles/colors'
import { formatBalance, formatInt, formatSatStr, isBool } from '@util'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Text, TouchableOpacity, View } from 'react-native'
import { s, ScaledSheet, vs } from 'react-native-size-matters'
import { CountUp } from 'use-count-up'

import { TxtButton } from './Button'
import Logo from './Logo'
import Txt from './Txt'

interface IBalanceProps {
	nav?: NativeStackNavigationProp<RootStackParamList, 'dashboard', 'MyStack'>
}

export default function Balance({ nav }: IBalanceProps) {
	const { t } = useTranslation([NS.common])
	const { pref, color, highlight } = useThemeContext()
	const { balance } = useBalanceContext()
	const { hidden, handleLogoPress } = usePrivacyContext()
	const [formatSats, setFormatSats] = useState(pref?.formatBalance)
	const { latestHistory } = useHistoryContext()
	const oldBal = useRef(balance)
	const diff = useRef(Math.abs(balance - oldBal.current))

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
		if (oldBal.current === balance) { return }
		diff.current = Math.abs(balance - oldBal.current)
	}, [balance])

	return (
		<View style={[
			styles.board,
			{ borderColor: color.BORDER, backgroundColor: hi[highlight] }
		]}>
			<TouchableOpacity onPress={() => void handleLogoPress()}>
				<Logo size={hidden.balance ? s(100) : s(40)} style={{ marginTop: hidden.balance ? vs(40) : 0, marginBottom: hidden.balance ? vs(40) : vs(10) }} />
			</TouchableOpacity>
			{/* balance */}
			{!hidden.balance &&
				<TouchableOpacity
					style={styles.balanceWrap}
					onPress={toggleBalanceFormat}
					disabled={hidden.balance}
				>
					<Text style={[styles.balAmount, { color: getColor(highlight, color) }]}>
						<CountUp
							key={balance}
							start={oldBal.current}
							end={balance}
							duration={1.5}
							isCounting
							decimalPlaces={0}
							formatter={value => formatSats ? formatBalance(Math.trunc(value)) : formatInt(Math.trunc(value))}
							onComplete={() => { oldBal.current = balance }}
						/>
					</Text>
					<View style={styles.balAssetNameWrap}>
						<Text style={[styles.balAssetName, { color: getColor(highlight, color) }]}>
							{formatSats ? 'BTC' : formatSatStr(balance, 'compact', false)}
						</Text>
						<SwapCurrencyIcon width={s(20)} height={s(20)} color={getColor(highlight, color)} />
					</View>
				</TouchableOpacity>
			}
			{/* No transactions yet */}
			{!latestHistory.length &&
				<View style={styles.txOverview}>
					<Txt txt={t('noTX')} styles={[globals(color).pressTxt, { color: getColor(highlight, color) }]} />
				</View>
			}
			{/* latest 3 history entries */}
			{latestHistory.length > 0 && !hidden.txs &&
				latestHistory.map(h => (
					<HistoryEntry
						key={h.id}
						icon={
							h.isPending ?
								<ClockIcon color={color.TEXT} />
								:
								h.type === 2 || h.type === 3 ?
									<ZapIcon width={s(28)} height={s(28)} color={getColor(highlight, color)} />
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
			}
			{(latestHistory.length === 3 || (latestHistory.length > 0 && hidden.txs)) &&
				<TxtButton
					txt={t('seeFullHistory')}
					onPress={() => nav?.navigate('history')}
					txtColor={getColor(highlight, color)}
					style={[{ paddingTop: vs(15), paddingBottom: hidden.txs ? vs(15) : 0 }]}
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
		if (isSwap) { return formatSatStr(Math.abs(amount)) }
		return `${amount > 0 ? '+' : ''}${formatSatStr(amount)}`
	}

	return (
		<TouchableOpacity style={styles.entry} onPress={onPress}>
			<View style={styles.wrap}>
				<View style={styles.iconWrap}>
					{icon}
				</View>
				<View>
					<Txt txt={txType} styles={[{ color: getColor(highlight, color), marginBottom: vs(2) }]} />
					<Text style={{ color: getColor(highlight, color), fontSize: vs(12) }}>
						<EntryTime from={timestamp * 1000} fallback={t('justNow')} />
					</Text>
				</View>
			</View>
			<Txt txt={getAmount()} styles={[{ color: getColor(highlight, color) }]} />
		</TouchableOpacity>
	)
}

const styles = ScaledSheet.create({
	board: {
		borderBottomLeftRadius: 50,
		borderBottomRightRadius: 50,
		paddingHorizontal: '20@s',
		paddingTop: '40@vs',
		paddingBottom: '50@vs',
		minHeight: '50%'
	},
	balanceWrap: {
		alignItems: 'center',
		marginHorizontal: '-20@s',
		marginBottom: '5@vs',
	},
	balAmount: {
		alignItems: 'center',
		fontSize: '42@vs',
		fontWeight: '600',
	},
	balAssetNameWrap: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: '10@vs',
	},
	balAssetName: {
		fontSize: '14@vs',
		marginRight: '5@s'
	},
	iconWrap: {
		minWidth: '40@s',
		paddingTop: '3@vs',
	},
	entry: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingBottom: '6@vs',
	},
	wrap: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	txOverview: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center'
	}
})