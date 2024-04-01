import Button from '@comps/Button'
import { ChevronRightIcon } from '@comps/Icons'
import Separator from '@comps/Separator'
import Txt from '@comps/Txt'
import type { IRestoreSuccessPageProps } from '@model/nav'
import { isIOS } from '@src/consts'
import { useThemeContext } from '@src/context/Theme'
import { addToHistory } from '@store/latestHistoryEntries'
import { globals, mainColors } from '@styles'
import { formatMintUrl, formatSatStr, vib } from '@util'
import { useEffect } from 'react'
import { TouchableOpacity, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { s, ScaledSheet } from 'react-native-size-matters'

export default function RestoreOverviewScreen({ navigation, route }: IRestoreSuccessPageProps) {

	const insets = useSafeAreaInsets()
	const { mnemonic, mint, keysetID, amount, comingFromOnboarding } = route.params
	const { color } = useThemeContext()

	const handleDone = async () => {
		await addToHistory({
			mints: [mint],
			amount,
			type: 4,
			value: '',
		})
		if (comingFromOnboarding) {
			return navigation.navigate('auth', { pinHash: '' })
		}
		return navigation.navigate('dashboard')
	}

	useEffect(() => vib(400), [])

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
					styles={[{ color: color.TEXT_SECONDARY }]}
				/>
			</View>
			<View style={[globals(color).wrapContainer, { paddingBottom: s(20) }]}>
				{/* Resored amount */}
				<View style={styles.entry}>
					<Txt
						center
						bold
						txt='Restored'
					/>
					<Txt
						center
						txt={formatSatStr(amount)}
						styles={[{ color: mainColors.VALID }]}
					/>
				</View>
				<Separator style={[styles.separator]} />
				{/* Keyset ID */}
				<View style={styles.entry}>
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
				<TouchableOpacity
					style={styles.entry}
					onPress={() => navigation.navigate('selectKeyset', { mnemonic, mintUrl: mint, comingFromOnboarding })}
				>
					<View>
						<Txt
							bold
							txt='Select another Keyset-ID'
							styles={[{ marginBottom: s(5) }]}
						/>
						<Txt
							txt='If the restored amount is less than expected, part of your balance could be linked to an old Keyset-ID of the mint.'
							styles={[{ fontSize: s(11), color: color.TEXT_SECONDARY, maxWidth: s(260) }]}
						/>
					</View>
					<ChevronRightIcon width={s(16)} height={s(16)} color={color.TEXT} />
				</TouchableOpacity>
			</View>
			<View style={[styles.btnWrap, { marginBottom: isIOS ? insets.bottom : 20 }]}>
				<Button
					txt='Done'
					onPress={() => void handleDone()}
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
		fontSize: '22@s',
		marginBottom: '5@s',
	},
	separator: {
		marginTop: '15@s',
		marginBottom: '15@s'
	},
	btnWrap: {
		position: 'absolute',
		bottom: 0,
		right: 0,
		left: 0,
		paddingHorizontal: '20@s',
	},
	entry: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	}
})