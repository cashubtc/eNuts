import Empty from '@comps/Empty'
import Separator from '@comps/Separator'
import { isIOS } from '@consts'
import type { IHistoryEntry } from '@model'
import type { THistoryPageProps } from '@model/nav'
import TopNav from '@nav/TopNav'
import { FlashList } from '@shopify/flash-list'
import { useFocusClaimContext } from '@src/context/FocusClaim'
import { useThemeContext } from '@src/context/Theme'
import { NS } from '@src/i18n'
import { getHistory } from '@store/HistoryStore'
import { globals } from '@styles'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import HistoryEntry from './Entry'

const listEntryHeight = isIOS ? 59 : 70

export default function HistoryPage({ navigation, route }: THistoryPageProps) {
	const insets = useSafeAreaInsets()
	const { t } = useTranslation([NS.common])
	const { color } = useThemeContext()
	const { claimed } = useFocusClaimContext()
	const [data, setData] = useState<Record<string, IHistoryEntry[]>>({})
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
			/>
			<View style={styles.listWrap}>
				{/* History list grouped by settled date */}
				<FlashList
					data={Object.entries(data)}
					estimatedItemSize={300}
					renderItem={data => (
						<>
							{/* Group date */}
							<Text style={[styles.date, { color: color.TEXT }]}>
								{data.item[0] === 'Today' ? t('today') : data.item[0]}
							</Text>
							{/* Group entries */}
							<View style={[
								globals(color).wrapContainer,
								{ height: Math.ceil(data.item[1].length * listEntryHeight) }
							]}>
								<FlashList
									data={data.item[1]}
									scrollEnabled={false}
									renderItem={({ item }) => (
										<HistoryEntry
											item={item}
											nav={{ navigation, route }}
										/>
									)}
									estimatedItemSize={300}
									ItemSeparatorComponent={() => <Separator />}
								/>
							</View>
						</>
					)}
					ListEmptyComponent={<Empty txt={t('noTX') + '...'} />}
				/>
			</View>
			{/* <BottomNav navigation={navigation} route={route} /> */}
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
		fontWeight: '500',
		marginHorizontal: 20,
		marginBottom: 10,
		marginTop: 20,
	},
})