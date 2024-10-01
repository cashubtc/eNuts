import Empty from '@comps/Empty'
import { TrashbinIcon } from '@comps/Icons'
import { BottomModal } from '@comps/modal/Question'
import Separator from '@comps/Separator'
import Txt from '@comps/Txt'
import { isIOS } from '@consts'
import type { THistoryPageProps } from '@model/nav'
import TopNav from '@nav/TopNav'
import { FlashList } from '@shopify/flash-list'
import { useHistoryContext } from '@src/context/History'
import { useThemeContext } from '@src/context/Theme'
import { NS } from '@src/i18n'
import { globals } from '@styles'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { s, ScaledSheet, vs } from 'react-native-size-matters'

import HistoryEntry from './Entry'

export default function HistoryPage({ navigation, route }: THistoryPageProps) {
	const insets = useSafeAreaInsets()
	const { t } = useTranslation([NS.common])
	const { color } = useThemeContext()
	const { history, hasEntries, deleteHistory } = useHistoryContext()
	const [confirm, setConfirm] = useState(false)

	const handleDeleteHistory = async () => {
		await deleteHistory()
		setConfirm(false)
	}

	return (
		<View style={[globals(color).container, styles.container, { paddingBottom: isIOS ? insets.bottom : 0 }]}>
			<TopNav
				screenName={t('history', { ns: NS.topNav })}
				withBackBtn
				handlePress={() => navigation.goBack()}
				historyOpts={[{
					txt: t('delHistory'),
					onSelect: () => {
						if (hasEntries) {
							setConfirm(true)
						}
					},
					disabled: !hasEntries,
					icon: <TrashbinIcon width={s(20)} height={vs(20)} color={hasEntries ? color.TEXT : color.TEXT_SECONDARY} />,
				}]}
			/>
			<View style={styles.listWrap}>
				{/* History list grouped by settled date */}
				<FlashList
					data={Object.entries(history)}
					estimatedItemSize={100}
					renderItem={data => (
						<>
							{/* Group date */}
							<Txt
								txt={data.item[0] === 'Today' ? t('today') : data.item[0]}
								bold
								styles={[styles.date]}
							/>
							{/* Group entries */}
							<View style={[styles.entriesWrap, { backgroundColor: color.DRAWER }]}>
								{data.item[1].map((item, i) => (
									<View key={i}>
										<HistoryEntry
											item={item}
											nav={{ navigation, route }}
										/>
										{i < data.item[1].length - 1 && <Separator style={[{ marginBottom: vs(10) }]} />}
									</View>
								))}
							</View>
						</>
					)}
					ListEmptyComponent={<Empty txt={t('noTX') + '...'} />}
				/>
			</View>
			{/* confirm history deletion */}
			<BottomModal
				header={t('delHistoryQ')}
				txt={t('delHistoryTxt')}
				visible={confirm}
				confirmTxt={t('yes')}
				confirmFn={() => void handleDeleteHistory()}
				cancelTxt={t('no')}
				cancelFn={() => setConfirm(false)}
			/>
		</View>
	)
}

const styles = ScaledSheet.create({
	container: {
		alignItems: 'center',
	},
	listWrap: {
		flex: 1,
		width: '100%',
	},
	date: {
		fontSize: '14@vs',
		marginHorizontal: '20@s',
		marginBottom: '10@vs',
		marginTop: '20@vs',
	},
	entriesWrap: {
		flex: 1,
		borderRadius: 20,
		paddingHorizontal: '20@s',
		paddingTop: '10@vs',
		paddingBottom: 0,
		marginBottom: '20@vs',
	}
})