import { AboutIcon, ChevronRightIcon, HistoryIcon, SwapCurrencyIcon } from '@comps/Icons'
import { setPreferences } from '@db'
import type { RootStackParamList } from '@model/nav'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { ThemeContext } from '@src/context/Theme'
import { highlight as hi } from '@styles'
import { formatBalance, formatInt, isBool } from '@util'
import { useContext, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

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
		<View style={[
			styles.board,
			{ borderColor: color.BORDER, backgroundColor: hi[highlight] }
		]}>
			<View style={styles.imgWrap}>
				<Image
					style={styles.img}
					// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
					source={require('@assets/icon_transparent.png')}
				/>
			</View>
			{/* balance */}
			<TouchableOpacity style={styles.balanceWrap} onPress={toggleBalanceFormat}>
				<Text style={styles.balAmount}>
					{formatSats ? formatBalance(balance) : formatInt(balance)}
				</Text>
				<View style={styles.balAssetNameWrap}>
					<Text style={styles.balAssetName}>
						{formatSats ? 'BTC' : 'Satoshi'}
					</Text>
					<SwapCurrencyIcon width={20} height={20} color='#F0F0F0' />
				</View>
			</TouchableOpacity>
			<Separator style={[styles.separator]} />
			{/* history */}
			<BoardEntry
				txt={t('history', { ns: 'topNav' })}
				icon={<HistoryIcon color='#FAFAFA' />}
				color='#FAFAFA'
				onPress={() => nav?.navigate('history')}
				withSeparator
			/>
			{/* Disclaimer */}
			<BoardEntry
				txt={t('risks')}
				icon={<AboutIcon color='#FAFAFA' />}
				color='#FAFAFA'
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
	imgWrap: {
		alignItems: 'center',
	},
	img: {
		height: 80,
		resizeMode: 'contain',
		marginBottom: 20
	},
	balanceWrap: {
		alignItems: 'center',
	},
	balAmount: {
		alignItems: 'center',
		fontSize: 50,
		fontWeight: '500',
		color: '#FAFAFA'
	},
	balAssetNameWrap: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 10,
	},
	balAssetName: {
		fontSize: 14,
		marginRight: 5,
		color: '#F0F0F0'
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