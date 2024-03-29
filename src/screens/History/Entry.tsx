import { IncomingArrowIcon, OutgoingArrowIcon } from '@comps/Icons'
import Txt from '@comps/Txt'
import { type IHistoryEntry,txType } from '@model'
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
		if (item.type === txType.SEND_RECEIVE) { return 'Ecash' }
		if (item.type === txType.LIGHTNING) { return 'Lightning' }
		if (item.type === txType.SWAP) { return t('swap', { ns: NS.common }) }
		return t('seedBackup', { ns: NS.common })
	}

	const getTxColor = () => {
		if (item.type === txType.SWAP || item.type === txType.RESTORE) { return color.TEXT }
		return item.amount < 0 ? mainColors.ERROR : mainColors.VALID
	}

	const getIcon = () => item.amount < 0 ?
		<OutgoingArrowIcon color={color.TEXT} />
		:
		<IncomingArrowIcon color={color.TEXT} />

	return (
		<TouchableOpacity
			style={styles.listItem}
			onPress={() => nav.navigation.navigate('history entry details', { entry: item })}
		>
			<View style={{ paddingBottom: vs(10) }}>
				{getIcon()}
			</View>
			<View style={styles.infoWrap}>
				<Txt txt={getTxTypeStr()} styles={[{ marginBottom: vs(5) }]} />
				<Text style={[globals(color, highlight).txt, { color: color.TEXT_SECONDARY, fontSize: vs(12) }]}>
					<EntryTime from={item.timestamp * 1000} fallback={t('justNow')} />
				</Text>
			</View>
			<View style={styles.placeholder} />
			<View style={[styles.amount, { top: isNum(item.fee) ? 0 : vs(10) }]}>
				<Txt
					txt={`${item.amount > 0 && item.type < txType.SWAP ? '+' : ''}${formatSatStr(item.type === txType.SWAP || item.type === txType.RESTORE ? Math.abs(item.amount) : item.amount, 'standard')}`}
					styles={[{ color: getTxColor(), marginBottom: vs(5), textAlign: 'right' }]}
				/>
				{isNum(item.fee) &&
					<Text style={{ color: color.TEXT_SECONDARY, textAlign: 'right', fontSize: vs(12) }}>
						{t('fee', { ns: NS.common })}: {item.fee}
					</Text>
				}

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
		right: 0,
	},
})