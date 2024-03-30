import Button from '@comps/Button'
import Separator from '@comps/Separator'
import Txt from '@comps/Txt'
import type { IRestoreSuccessPageProps } from '@model/nav'
import { isIOS } from '@src/consts'
import { useThemeContext } from '@src/context/Theme'
import { formatMintUrl, formatSatStr } from '@src/util'
import { globals } from '@styles'
import { View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { s, ScaledSheet } from 'react-native-size-matters'

export default function RestoreSuccess({ navigation, route }: IRestoreSuccessPageProps) {

	const insets = useSafeAreaInsets()
	const { mint, keysetID, amount, cycle, comingFromOnboarding } = route.params
	const { color } = useThemeContext()

	return (
		<View style={[globals(color).container, styles.container]}>
			<View style={styles.headerWrap}>
				<Txt
					center
					bold
					txt='Restore Overview'
					styles={[styles.header]}
				/>
				<Txt
					center
					txt={formatMintUrl(mint)}
				/>
			</View>
			<View style={[globals(color).wrapContainer, { paddingBottom: s(20) }]}>
				<View style={{
					flexDirection: 'row',
					alignItems: 'center',
					justifyContent: 'space-between',
				}}>
					<Txt
						center
						bold
						txt='Restored'
					/>
					<Txt
						center
						txt={formatSatStr(amount)}
					/>
				</View>
				<Separator style={[styles.separator]} />
				<View style={{
					flexDirection: 'row',
					alignItems: 'center',
					justifyContent: 'space-between',
				}}>
					<Txt
						center
						bold
						txt='Keyset-ID'
					/>
					<Txt
						center
						txt={keysetID}
					/>
				</View>
				<Separator style={[styles.separator]} />
				<View style={{
					flexDirection: 'row',
					alignItems: 'center',
					justifyContent: 'space-between',
				}}>
					<Txt
						center
						bold
						txt='Last Cycle'
					/>
					<Txt
						center
						txt={`${cycle.start} to ${cycle.end}`}
					/>
				</View>
			</View>
			<View style={[styles.btnWrap, { marginBottom: isIOS ? insets.bottom : 20 }]}>
				<Button
					txt='Done'
					onPress={() => {
						if (comingFromOnboarding) {
							return navigation.navigate('auth', { pinHash: '' })
						}
						return navigation.navigate('success', {
							mint,
							amount,
							isRestored: true,
							comingFromOnboarding
						})
					}}
				/>
			</View>
		</View>
	)
}

const styles = ScaledSheet.create({
	container: {
		paddingTop: '60@s',
	},
	headerWrap: {
		paddingHorizontal: '20@s',
		marginBottom: '20@s',
	},
	header: {
		fontSize: '28@s',
		marginBottom: '10@s',
	},
	separator: {
		marginVertical: '15@vs',
	},
	btnWrap: {
		position: 'absolute',
		bottom: 0,
		right: 0,
		left: 0,
		paddingHorizontal: '20@s',
	},
})