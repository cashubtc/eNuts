import { ChevronRightIcon, ExclamationIcon, HistoryIcon, SwapCurrencyIcon } from '@comps/Icons'
import { setPreferences } from '@db'
import type { RootStackParamList } from '@model/nav'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { ThemeContext } from '@src/context/Theme'
import { globals, highlight as hi, mainColors } from '@styles'
import { formatBalance, formatInt, isBool } from '@util'
import { useContext, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

import Separator from './Separator'
import Txt from './Txt'

interface IBalanceProps {
	balance: number
	nav?: NativeStackNavigationProp<RootStackParamList, 'dashboard', 'MyStack'>
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
			<View style={[globals(color).wrapContainer, styles.board]}>
				{/* balance */}
				<TouchableOpacity style={styles.balanceWrap} onPress={toggleBalanceFormat}>
					<Text style={[styles.balAmount, { color: hi[highlight] }]}>
						{formatSats ? formatBalance(balance) : formatInt(balance)}
					</Text>
					<View style={styles.balAssetNameWrap}>
						<Text style={[styles.balAssetName, { color: color.TEXT_SECONDARY }]}>
							{formatSats ? 'BTC' : 'Satoshi'}
						</Text>
						<SwapCurrencyIcon width={20} height={20} color={color.TEXT_SECONDARY} />
					</View>
				</TouchableOpacity>
				<Separator style={[styles.separator]} />
				{/* history */}
				<BoardEntry
					txt={t('history', { ns: 'topNav' })}
					icon={<HistoryIcon width={22} height={22} color={color.TEXT} />}
					color={color.TEXT}
					onPress={() => nav?.navigate('history')}
					withSeparator
				/>
				{/* Disclaimer */}
				<BoardEntry
					txt={t('risks')}
					icon={<ExclamationIcon width={20} height={20} color={mainColors.WARN} />}
					color={mainColors.WARN}
					onPress={() => nav?.navigate('disclaimer')}
				/>
			</View>
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
	balanceContainer: {
		flex: 1,
		position: 'absolute',
		top: 110,
		left: 0,
		right: 0,
	},
	board: {
		padding: 20,
	},
	balanceWrap: {
		alignItems: 'center',
	},
	balAmount: {
		flex: 1,
		alignItems: 'center',
		fontSize: 50,
		fontWeight: '500',
	},
	balAssetNameWrap: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 10,
	},
	balAssetName: {
		fontSize: 14,
		marginRight: 5,
	},
	separator: {
		marginVertical: 20,
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