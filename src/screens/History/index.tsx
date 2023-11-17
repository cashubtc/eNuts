import Empty from '@comps/Empty'
import { TrashbinIcon } from '@comps/Icons'
import { BottomModal } from '@comps/modal/Question'
import Separator from '@comps/Separator'
import Txt from '@comps/Txt'
import { isIOS } from '@consts'
import type { IHistoryEntry } from '@model'
import type { THistoryPageProps } from '@model/nav'
import TopNav from '@nav/TopNav'
import { FlashList } from '@shopify/flash-list'
import { useFocusClaimContext } from '@src/context/FocusClaim'
import { usePromptContext } from '@src/context/Prompt'
import { useThemeContext } from '@src/context/Theme'
import { NS } from '@src/i18n'
import { store } from '@src/storage/store'
import { STORE_KEYS } from '@store/consts'
import { getHistory, historyStore } from '@store/HistoryStore'
import { globals } from '@styles'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import HistoryEntry from './Entry'

export default function HistoryPage({ navigation, route }: THistoryPageProps) {
	const insets = useSafeAreaInsets()
	const { t } = useTranslation([NS.common])
	const { color } = useThemeContext()
	const { claimed } = useFocusClaimContext()
	const [data, setData] = useState<Record<string, IHistoryEntry[]>>({})
	const { openPromptAutoClose } = usePromptContext()
	const [confirm, setConfirm] = useState(false)

	const hasEntries = Object.keys(data).length > 0

	const handleDeleteHistory = async () => {
		const success = await historyStore.clear()
		await store.delete(STORE_KEYS.latestHistory)
		setData({})
		openPromptAutoClose({
			msg: success ? t('historyDeleted') : t('delHistoryErr'),
			success
		})
		setConfirm(false)
	}

	// update history after claiming from clipboard when the app comes to the foreground
	useEffect(() => {
		void (async () => {
			setData(await getHistory())
		})()
	}, [claimed])

	// update history after navigating to this page
	useEffect(() => {
		// eslint-disable-next-line @typescript-eslint/no-misused-promises
		const focusHandler = navigation.addListener('focus', async () => {
			setData(await getHistory())
		})
		return focusHandler
	}, [navigation])

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
					icon: <TrashbinIcon width={20} height={20} color={hasEntries ? color.TEXT : color.TEXT_SECONDARY} />,
				}]}
			/>
			<View style={styles.listWrap}>
				{/* History list grouped by settled date */}
				<FlashList
					data={Object.entries(data)}
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
										{i < data.item[1].length - 1 && <Separator style={[{ marginBottom: 10 }]} />}
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

const styles = StyleSheet.create({
	container: {
		paddingTop: 0,
		alignItems: 'center',
	},
	listWrap: {
		flex: 1,
		width: '100%',
		marginTop: 100,
	},
	date: {
		fontSize: 15,
		marginHorizontal: 20,
		marginBottom: 10,
		marginTop: 20,
	},
	entriesWrap: {
		flex: 1,
		borderRadius: 20,
		paddingHorizontal: 20,
		paddingTop: 10,
		paddingBottom: 0,
		marginBottom: isIOS ? 50 : 20,
	}
})