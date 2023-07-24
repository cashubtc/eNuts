import { IncomingArrowIcon, OutgoingArrowIcon, ZapIcon } from '@comps/Icons'
import Txt from '@comps/Txt'
import type { IHistoryEntry } from '@model'
import type { THistoryPageProps } from '@model/nav'
import { ThemeContext } from '@src/context/Theme'
import { globals, mainColors } from '@styles'
import { formatInt } from '@util'
import { useContext } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

import EntryTime from './entryTime'

interface IHistoryEntryProps {
	nav: THistoryPageProps
	item: IHistoryEntry
}

export default function HistoryEntry({ nav, item }: IHistoryEntryProps) {
	const { t } = useTranslation(['history'])
	const { color, highlight } = useContext(ThemeContext)
	return (
		<TouchableOpacity
			style={styles.listItem}
			onPress={() => nav.navigation.navigate('history entry details', { entry: item })}
		>
			{item.amount < 0 ?
				<OutgoingArrowIcon color={color.TEXT} />
				:
				<IncomingArrowIcon color={color.TEXT} />
			}
			<View style={styles.infoWrap}>
				<Txt txt={item.type === 1 ? 'Ecash' : 'Lightning'} />
				<Text style={[globals(color, highlight).txt, { color: color.TEXT_SECONDARY }]}>
					<EntryTime from={item.timestamp * 1000} fallback={t('justNow')} />
				</Text>
			</View>
			<View style={styles.placeholder} />
			<Text style={[globals(color, highlight).txt, styles.amount, { color: item.amount < 0 ? mainColors.ERROR : mainColors.VALID }]}>
				{formatInt(item.amount < 0 ? Math.abs(item.amount) : item.amount, 'compact', 'en')}
				<ZapIcon width={15} height={15} color={item.amount < 0 ? mainColors.ERROR : mainColors.VALID} />
			</Text>
		</TouchableOpacity>
	)
}

const styles = StyleSheet.create({
	listItem: {
		position: 'relative',
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingVertical: 12,
	},
	infoWrap: {
		alignItems: 'center',
	},
	placeholder: {
		width: 30,
	},
	amount: {
		textAlign: 'right',
		position: 'absolute',
		right: 0,
	},
})