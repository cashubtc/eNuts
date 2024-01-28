import { BoltIcon, LeafIcon } from '@comps/Icons'
import Separator from '@comps/Separator'
import Txt from '@comps/Txt'
import type { ISeedUpdatePageProps } from '@model/nav'
import { useThemeContext } from '@src/context/Theme'
import { store } from '@src/storage/store'
import { STORE_KEYS } from '@src/storage/store/consts'
import { mainColors } from '@styles'
import { H_Colors } from '@styles/colors'
import { SafeAreaView, TouchableOpacity, View } from 'react-native'
import { s, ScaledSheet, vs } from 'react-native-size-matters'

export default function SeedUpdateScreen({ navigation }: ISeedUpdatePageProps) {

	const { color } = useThemeContext()

	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: color.BACKGROUND }}>
			<View style={{ height: '40%', alignItems: 'center', justifyContent: 'center' }}>
				<Txt
					txt='Seed Backup'
					styles={[{ fontSize: 36, textAlign: 'center', marginBottom: s(20) }]}
				/>
			</View>
			<View style={[styles.wrapContainer, { backgroundColor: color.DRAWER }]}>
				<TouchableOpacity
					onPress={() => {
						void store.set(STORE_KEYS.sawSeedUpdate, '1')
						navigation.navigate('Mnemonic', { comingFromOnboarding: false })
					}}
				>
					<View style={styles.action}>
						<View style={{ minWidth: s(40) }}>
							<LeafIcon width={s(22)} height={s(22)} color={mainColors.VALID} />
						</View>
						<View>
							<Txt txt='Secure Wallet' bold />
							<Txt
								txt='Generate and write down a seed backup to secure your wallet. Recommended.'
								styles={[{ fontSize: vs(11), color: color.TEXT_SECONDARY }]}
							/>
						</View>
					</View>
				</TouchableOpacity>
				<Separator style={[styles.separator]} />
				<TouchableOpacity
					onPress={() => {
						void store.set(STORE_KEYS.sawSeedUpdate, '1')
						navigation.navigate('dashboard')
					}}
				>
					<View style={styles.action}>
						<View style={{ minWidth: s(40) }}>
							<BoltIcon width={s(25)} height={s(25)} color={H_Colors.Sky} />
						</View>
						<View>
							<Txt txt='Will do later' bold />
							<Txt
								txt='You can skip this process and generated a seed backup later.'
								styles={[{ fontSize: vs(11), color: color.TEXT_SECONDARY }]}
							/>
						</View>
					</View>
				</TouchableOpacity>
			</View>
		</SafeAreaView>
	)
}

const styles = ScaledSheet.create({
	wrapContainer: {
		borderRadius: 20,
		paddingVertical: '20@vs',
		marginBottom: '20@vs',
		paddingRight: '40@s',
	},
	action: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: '20@s',
		width: '100%'
	},
	separator: {
		width: '100%',
		marginTop: '20@vs'
	}
})