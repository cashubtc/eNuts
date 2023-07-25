import Empty from '@comps/Empty'
import Separator from '@comps/Separator'
import { isIOS } from '@consts'
import type { IHistoryEntry } from '@model'
import type { THistoryPageProps } from '@model/nav'
import TopNav from '@nav/TopNav'
import { FlashList } from '@shopify/flash-list'
import { FocusClaimCtx } from '@src/context/FocusClaim'
import { ThemeContext } from '@src/context/Theme'
import { getHistory } from '@store/HistoryStore'
import { globals } from '@styles'
import { useContext, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import HistoryEntry from './Entry'

export default function HistoryPage({ navigation, route }: THistoryPageProps) {
	const insets = useSafeAreaInsets()
	const { t } = useTranslation(['common'])
	const { color } = useContext(ThemeContext)
	const { claimed } = useContext(FocusClaimCtx)
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
				screenName={t('history', { ns: 'topNav' })}
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
								{ flex: 1, height: Math.floor(data.item[1].length * (isIOS ? 61 : 66)) }
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