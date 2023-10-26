import { IncomingArrowIcon, OutgoingArrowIcon, SwapCurrencyIcon } from '@comps/Icons'
import Txt from '@comps/Txt'
import type { IHistoryEntry } from '@model'
import type { THistoryPageProps } from '@model/nav'
import { useThemeContext } from '@src/context/Theme'
import { NS } from '@src/i18n'
import { globals, mainColors } from '@styles'
import { formatInt } from '@util'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

import EntryTime from './entryTime'

interface IHistoryEntryProps {
	nav: THistoryPageProps
	item: IHistoryEntry
}

export default function HistoryEntry({ nav, item }: IHistoryEntryProps) {
	const { t } = useTranslation([NS.history])
	const { color, highlight } = useThemeContext()

	const getTxTypeStr = () => {
		if (item.type === 1) { return 'Ecash' }
		if (item.type === 2) { return 'Lightning' }
		return t('swap', { ns: NS.common })
	}

	const getTxColor = () => {
		if (item.type === 3) { return color.TEXT }
		return item.amount < 0 ? mainColors.ERROR : mainColors.VALID
	}

	const getAmount = () => {
		if (item.type === 3) { return `${formatInt(Math.abs(item.amount), 'compact', 'en')}` }
		return `${item.amount > 0 ? '+' : ''}${formatInt(item.amount, 'compact', 'en')}`
	}

	const getIcon = () => {
		if (item.type === 3) { return <SwapCurrencyIcon width={16} height={16} color={color.TEXT} /> }
		return item.amount < 0 ?
			<OutgoingArrowIcon color={color.TEXT} />
			:
			<IncomingArrowIcon color={color.TEXT} />
	}

	return (
		<TouchableOpacity
			style={styles.listItem}
			onPress={() => nav.navigation.navigate('history entry details', { entry: item })}
		>
			<View style={{ paddingBottom: 10 }}>
				{getIcon()}
			</View>
			<View style={styles.infoWrap}>
				<Txt txt={getTxTypeStr()} />
				<Text style={[globals(color, highlight).txt, { color: color.TEXT_SECONDARY, fontSize: 14 }]}>
					<EntryTime from={item.timestamp * 1000} fallback={t('justNow')} />
				</Text>
			</View>
			<View style={styles.placeholder} />
			<View style={styles.amount}>
				<Txt
					txt={getAmount()}
					styles={[{ color: getTxColor() }]}
				/>
				<Txt
					txt=' Sat.'
					styles={[{ color: getTxColor() }]}
				/>
			</View>
		</TouchableOpacity>
	)
}

const styles = StyleSheet.create({
	listItem: {
		position: 'relative',
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	infoWrap: {
		alignItems: 'center',
		paddingBottom: 10
	},
	placeholder: {
		width: 30,
	},
	amount: {
		flexDirection: 'row',
		alignItems: 'center',
		position: 'absolute',
		top: 10,
		right: 0,
	},
})