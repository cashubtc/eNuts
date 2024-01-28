import { BackupIcon, BoltIcon, LeafIcon, LeftArrow } from '@comps/Icons'
import Separator from '@comps/Separator'
import Txt from '@comps/Txt'
import type { ISeedPageProps } from '@model/nav'
import { useThemeContext } from '@src/context/Theme'
import { l } from '@src/logger'
import { H_Colors } from '@src/styles/colors'
import { mainColors } from '@styles'
import { SafeAreaView, TouchableOpacity, View } from 'react-native'
import { s, ScaledSheet, vs } from 'react-native-size-matters'

// TODO if route.params.comingFromOnboarding -> navigation.navigate('auth', { pinHash: '' })
// TODO Mnemonic Seed screen
// TODO Confirm mnemonic seed screen
// TODO Seed screen from options
// TODO Restore screen

export default function SeedScreen({ navigation, route: { params } }: ISeedPageProps) {

	const { color } = useThemeContext()

	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: color.BACKGROUND }}>
			<View style={{ height: '40%', alignItems: 'center', justifyContent: 'center' }}>
				<Txt
					txt='Seed Backup'
					styles={[{ fontSize: 36, textAlign: 'center', marginBottom: s(20) }]}
				/>
			</View>
			{!params?.comingFromOnboarding &&
				<TouchableOpacity
					style={{ padding: s(20) }}
					onPress={() => navigation.navigate('Security settings')}
				>
					<LeftArrow color={color.TEXT} />
				</TouchableOpacity>
			}
			<View style={[styles.wrapContainer, { backgroundColor: color.DRAWER }]}>
				<TouchableOpacity
					onPress={() => l('new wallet with seed')}
				>
					<View style={styles.action}>
						<View style={{ minWidth: s(40) }}>
							<LeafIcon width={s(22)} height={s(22)} color={mainColors.VALID} />
						</View>
						<View>
							<Txt txt='Secure Wallet' bold />
							<Txt
								txt='Generate and write down a backup seed to secure your wallet.'
								styles={[{ fontSize: vs(11), color: color.TEXT_SECONDARY }]}
							/>
						</View>
					</View>
				</TouchableOpacity>
				<Separator style={[styles.separator]} />
				{params?.comingFromOnboarding &&
					<>
						<TouchableOpacity
							onPress={() => navigation.navigate('auth', { pinHash: '' })}
						>
							<View style={styles.action}>
								<View style={{ minWidth: s(40) }}>
									<BoltIcon width={s(25)} height={s(25)} color={H_Colors.Sky} />
								</View>
								<View>
									<Txt txt='Quick Wallet' bold />
									<Txt
										txt='Create a new wallet instantly. Backup seed can be generated later.'
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
							<BackupIcon width={s(21)} height={s(21)} color={H_Colors.Nuts} />
						</View>
						<View>
							<Txt txt='Recover Existing Wallet' bold />
							<Txt
								txt='Use a backup seed to restore your wallet.'
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