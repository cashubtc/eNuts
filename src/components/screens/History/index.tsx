import Empty from '@comps/Empty'
import Separator from '@comps/Separator'
import type { IHistoryEntry } from '@model'
import type { THistoryPageProps } from '@model/nav'
import BottomNav from '@nav/BottomNav'
import TopNav from '@nav/TopNav'
import { FlashList } from '@shopify/flash-list'
import { FocusClaimCtx } from '@src/context/FocusClaim'
import { ThemeContext } from '@src/context/Theme'
import { getHistory } from '@store/HistoryStore'
import { globals } from '@styles'
import { useContext, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'

import HistoryEntry from './Entry'
import { getTranslationLangCode } from '@src/util/localization'

export default function HistoryPage({ navigation, route }: THistoryPageProps) {
	const { t } = useTranslation(getTranslationLangCode())
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
		<View style={[styles.container, { backgroundColor: color.BACKGROUND }]}>
			<TopNav screenName={t('topNav.history')} nav={{ navigation, route }} />
			{/* TODO apply filter for ecash or LN TXs */}
			<View style={styles.listWrap}>
				{/* History list grouped by settled date */}
				<FlashList
					data={Object.entries(data)}
					estimatedItemSize={300}
					// contentContainerStyle={{ paddingHorizontal: 20 }}
					renderItem={data => (
						<>
							{/* Group date */}
							<Text style={[styles.date, { color: color.TEXT }]}>
								{data.item[0] === 'Today' ? t('common.today') : data.item[0]}
							</Text>
							{/* Group entries */}
							<View style={[
								globals(color).wrapContainer,
								{ height: Math.floor(data.item[1].length * 74) }
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
					ListEmptyComponent={<Empty txt={t('common.noTX') + '...'} />}
				/>
			</View>
			<BottomNav navigation={navigation} route={route} />
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: 'center',
	},
	listWrap: {
		flex: 1,
		width: '100%',
		marginTop: 100,
		marginBottom: 60,
	},
	date: {
		fontSize: 15,
		fontWeight: '500',
		marginHorizontal: 20,
		marginBottom: 10,
		marginTop: 20,
	},
})