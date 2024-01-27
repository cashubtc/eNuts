import { SwapIcon } from '@comps/Icons'
import Separator from '@comps/Separator'
import Txt from '@comps/Txt'
import type { ISeedPageProps } from '@model/nav'
import { useThemeContext } from '@src/context/Theme'
import { l } from '@src/logger'
import { mainColors } from '@styles'
import { SafeAreaView, TouchableOpacity, View } from 'react-native'
import { s, ScaledSheet, vs } from 'react-native-size-matters'

// TODO if route.params.comingFromOnboarding -> navigation.navigate('auth', { pinHash: '' })
// TODO Mnemonic Seed screen
// TODO Confirm mnemonic seed screen
// TODO Seed screen from options
// TODO Restore screen

export default function SeedScreen({ navigation, route }: ISeedPageProps) {

	const { color } = useThemeContext()

	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: color.BACKGROUND }}>
			<View style={{ height: '50%', alignItems: 'center', justifyContent: 'center' }}>
				<Txt
					txt='Wallet setup'
					styles={[{ fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: s(20) }]}
				/>
			</View>

			<View style={[styles.wrapContainer, { backgroundColor: color.DRAWER }]}>
				<TouchableOpacity
					onPress={() => l('new wallet with seed')}
				>
					<View style={styles.action}>
						<View style={{ minWidth: s(40) }}>
							<SwapIcon width={s(22)} height={s(22)} color={mainColors.ZAP} />
						</View>
						<View>
							<Txt txt='New wallet with seed' bold />
							<Txt
								txt='Generate a backup seed and create a new wallet.'
								styles={[{ fontSize: vs(11), color: color.TEXT_SECONDARY }]}
							/>
						</View>
					</View>
				</TouchableOpacity>
				<Separator style={[styles.separator]} />
				{route.params?.comingFromOnboarding &&
					<>
						<TouchableOpacity
							onPress={() => navigation.navigate('auth', { pinHash: '' })}
						>
							<View style={styles.action}>
								<View style={{ minWidth: s(40) }}>
									<SwapIcon width={s(22)} height={s(22)} color={mainColors.ZAP} />
								</View>
								<View>
									<Txt txt='New wallet without seed' bold />
									<Txt
										txt='Create a new wallet without a backup seed. You can generate a seed later.'
										styles={[{ fontSize: vs(11), color: color.TEXT_SECONDARY }]}
									/>
								</View>
							</View>
						</TouchableOpacity>
						<Separator style={[styles.separator]} />
					</>
				}
				<TouchableOpacity
					onPress={() => l('restore wallet')}
				>
					<View style={styles.action}>
						<View style={{ minWidth: s(40) }}>
							<SwapIcon width={s(22)} height={s(22)} color={mainColors.ZAP} />
						</View>
						<View>
							<Txt txt='Restore wallet' bold />
							<Txt
								txt='Restore your wallet using a backup seed.'
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