import RadioBtn from '@comps/RadioBtn'
import Screen from '@comps/Screen'
import Separator from '@comps/Separator'
import Txt from '@comps/Txt'
import type { TAdvancedSettingsPageProps } from '@model/nav'
import { ThemeContext } from '@src/context/Theme'
import { store } from '@store'
import { STORE_KEYS } from '@store/consts'
import { globals } from '@styles'
import { useCallback, useContext, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const reqTimeouts = [5, 10, 20, 30]

export default function AdvancedFunctionScreen({ navigation }: TAdvancedSettingsPageProps) {
	const insets = useSafeAreaInsets()
	const { t } = useTranslation(['topNav'])
	const { color } = useContext(ThemeContext)
	const [reqTimeout, setReqTimeout] = useState(10)
	const setReqTimeoutCB = useCallback((val: number) => { setReqTimeout(val) }, [])
	useEffect(() => {
		void (async () => {
			const savedTimeout = await store.get(STORE_KEYS.reqTimeout)
			if (!savedTimeout) {
				return
			}
			setReqTimeout(+savedTimeout)
		})()
	}, [])
	return (
		<Screen
			screenName={t('advancedFunctions')}
			withBackBtn
			handlePress={() => navigation.goBack()}
		>
			<ScrollView style={{ width: '100%', marginBottom: 60 + insets.bottom }} showsVerticalScrollIndicator={false}>
				<Text style={[styles.subHeader, { color: color.TEXT }]}>
					{t('reqTimeout', { ns: 'common' })}
				</Text>
				<View style={[globals(color).wrapContainer, styles.highlightWrap]}>
					{reqTimeouts.map((v, i) => (
						<SelectionRow
							key={v}
							value={`${v} ${t('seconds', { ns: 'common' })}`}
							selected={reqTimeout === v}
							handleChange={setReqTimeoutCB}
							withSeparator={i < reqTimeouts.length - 1}
						/>
					))}
				</View>
			</ScrollView>
		</Screen>
	)
}

interface ISelectionRowProps {
	value: string
	selected?: boolean
	handleChange: (val: number) => void
	withSeparator?: boolean
}

function SelectionRow({ value, selected, handleChange, withSeparator }: ISelectionRowProps) {
	const handleTimeout = async () => {
		const newTimeout = value.split(' ')[0]
		await store.set(STORE_KEYS.reqTimeout, newTimeout)
		handleChange(+newTimeout)
	}
	return (
		<>
			<TouchableOpacity style={styles.row}
				onPress={() => void handleTimeout()}
			>
				<Txt txt={value} />
				<RadioBtn selected={selected} />
			</TouchableOpacity>
			{withSeparator && <Separator style={[styles.separator]} />}
		</>
	)
}

const styles = StyleSheet.create({
	subHeader: {
		fontSize: 16,
		fontWeight: '500',
		paddingHorizontal: 20,
		marginBottom: 10,
	},
	highlightWrap: {
		paddingHorizontal: 0,
		paddingVertical: 10,
		marginBottom: 20,
	},
	row: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingVertical: 10,
		paddingHorizontal: 20,
	},
	separator: {
		marginHorizontal: 20,
		marginVertical: 10
	}
})