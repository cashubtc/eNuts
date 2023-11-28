import { IncomingArrowIcon, OutgoingArrowIcon, SwapCurrencyIcon } from '@comps/Icons'
import Txt from '@comps/Txt'
import type { IHistoryEntry } from '@model'
import type { THistoryPageProps } from '@model/nav'
import { useThemeContext } from '@src/context/Theme'
import { NS } from '@src/i18n'
import { globals, mainColors } from '@styles'
import { formatSatStr, isNum } from '@util'
import { useTranslation } from 'react-i18next'
import { Text, TouchableOpacity, View } from 'react-native'
import { ScaledSheet, vs } from 'react-native-size-matters'

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
			<View style={{ paddingBottom: vs(10) }}>
				{getIcon()}
			</View>
			<View style={styles.infoWrap}>
				<Txt txt={getTxTypeStr()} />
				<Text style={[globals(color, highlight).txt, { color: color.TEXT_SECONDARY, fontSize: vs(12) }]}>
					<EntryTime from={item.timestamp * 1000} fallback={t('justNow')} />
				</Text>
			</View>
			<View style={styles.placeholder} />
			<View style={styles.amount}>
				<Txt
					txt={`${item.amount > 0 ? '+' : ''}${formatSatStr(item.type === 3 ? Math.abs(item.amount) : item.amount, 'standard')}`}
					styles={[{ color: getTxColor() }]}
				/>
				<Text style={{ color: color.TEXT_SECONDARY, textAlign: 'right', fontSize: vs(12) }}>
					{t('fee', { ns: NS.common })}: {isNum(item.fee) ? item.fee : 0}
				</Text>
			</View>
		</TouchableOpacity>
	)
}

const styles = ScaledSheet.create({
	listItem: {
		position: 'relative',
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	infoWrap: {
		alignItems: 'center',
		paddingBottom: '10@vs',
	},
	placeholder: {
		width: '30@s',
	},
	amount: {
		position: 'absolute',
		top: 0,
		right: 0,
	},
})