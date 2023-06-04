import type { IHistoryEntry } from '@model'
import type { THistoryPageProps } from '@model/nav'
import BottomNav from '@nav/BottomNav'
import TopNav from '@nav/TopNav'
import { FlashList } from '@shopify/flash-list'
import { FocusClaimCtx } from '@src/context/FocusClaim'
import { ThemeContext } from '@src/context/Theme'
import { getHistory } from '@store/HistoryStore'
import { globals } from '@styles/globals'
import { useContext, useEffect, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'

import HistoryEntry from './Entry'

export default function HistoryPage({ navigation, route }: THistoryPageProps) {
	const { color, highlight } = useContext(ThemeContext)
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
			<TopNav nav={{ navigation, route }} />
			<View style={styles.topSection}>
				<Text style={[globals(color).header, { marginBottom: 0 }]}>
					History
				</Text>
				<Text style={[globals(color, highlight).txt, { color: color.TEXT_SECONDARY }]}>
					Press on entry to open details.
				</Text>
			</View>
			{/* TODO apply filter for ecash or LN TXs */}
			{/* TODO check theme change re-render */}
			<View style={styles.listWrap}>
				{/* History list grouped by settled date */}
				<FlashList
					data={Object.entries(data)}
					estimatedItemSize={300}
					contentContainerStyle={{ paddingHorizontal: 20 }}
					renderItem={data => (
						<>
							{/* Group date */}
							<Text style={[styles.date, { color: color.TEXT_SECONDARY }]}>
								{data.item[0]}
							</Text>
							{/* Group entries */}
							<View style={{ height: data.item[1].length * 70 }}>
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
									ItemSeparatorComponent={() => <View style={[styles.separator, { borderColor: color.BORDER }]} />}
								/>
							</View>
						</>
					)}
					ListEmptyComponent={<Text style={[globals(color, highlight).txt, { textAlign: 'center', marginTop: 20, color: color.TEXT_SECONDARY }]}>
						No transactions yet...
					</Text>}
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
	topSection: {
		width: '100%',
		marginTop: 130,
		marginBottom: 20,
		paddingHorizontal: 20,
	},
	listWrap: {
		flex: 1,
		width: '100%',
		marginBottom: 75,
	},
	date: {
		fontSize: 15,
		fontWeight: '500',
		marginTop: 10,
	},
	separator: {
		borderBottomWidth: 1,
		width: '100%',
	}
})