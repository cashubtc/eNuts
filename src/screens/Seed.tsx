import { BackupIcon, BoltIcon, LeafIcon, LeftArrow } from '@comps/Icons'
import Separator from '@comps/Separator'
import Txt from '@comps/Txt'
import type { ISeedPageProps } from '@model/nav'
import { useThemeContext } from '@src/context/Theme'
import { NS } from '@src/i18n'
import { store } from '@store'
import { STORE_KEYS } from '@store/consts'
import { mainColors } from '@styles'
import { H_Colors } from '@styles/colors'
import { useTranslation } from 'react-i18next'
import { SafeAreaView, TouchableOpacity, View } from 'react-native'
import { s, ScaledSheet, vs } from 'react-native-size-matters'

export default function SeedScreen({ navigation, route: { params } }: ISeedPageProps) {

	const { t } = useTranslation([NS.common])
	const { color } = useThemeContext()

	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: color.BACKGROUND }}>
			<View style={styles.header}>
				<Txt
					txt={t('seedBackup')}
					styles={[styles.headerTxt]}
				/>
			</View>
			{!params?.comingFromOnboarding &&
				<TouchableOpacity
					style={styles.navIcon}
					onPress={() => navigation.navigate('Security settings')}
				>
					<LeftArrow color={color.TEXT} />
				</TouchableOpacity>
			}
			<View style={[styles.wrapContainer, { backgroundColor: color.DRAWER }]}>
				<TouchableOpacity
					onPress={() => {
						void store.set(STORE_KEYS.sawSeedUpdate, '1')
						navigation.navigate('Mnemonic', { comingFromOnboarding: params?.comingFromOnboarding })
					}}
				>
					<View style={styles.action}>
						<View style={styles.optionIcon}>
							<LeafIcon width={s(22)} height={s(22)} color={mainColors.VALID} />
						</View>
						<View>
							<Txt txt={t('secureWallet')} bold />
							<Txt
								txt={t('secureWalletHint')}
								styles={[{ fontSize: vs(11), color: color.TEXT_SECONDARY }]}
							/>
						</View>
					</View>
				</TouchableOpacity>
				<Separator style={[styles.separator]} />
				{params?.comingFromOnboarding &&
					<>
						<TouchableOpacity
							onPress={() => {
								void store.set(STORE_KEYS.sawSeedUpdate, '1')
								navigation.navigate('auth', { pinHash: '' })
							}}
						>
							<View style={styles.action}>
								<View style={styles.optionIcon}>
									<BoltIcon width={s(25)} height={s(25)} color={H_Colors.Sky} />
								</View>
								<View>
									<Txt txt={t('quickWallet')} bold />
									<Txt
										txt={t('quickWalletHint')}
										styles={[{ fontSize: vs(11), color: color.TEXT_SECONDARY }]}
									/>
								</View>
							</View>
						</TouchableOpacity>
						<Separator style={[styles.separator]} />
					</>
				}
				<TouchableOpacity
					onPress={() => {
						void store.set(STORE_KEYS.sawSeedUpdate, '1')
						// TODO skip mint selection if only one mint
						navigation.navigate('Select recovery mint', {
							comingFromOnboarding: params?.comingFromOnboarding
						})
					}}
				>
					<View style={styles.action}>
						<View style={styles.optionIcon}>
							<BackupIcon width={s(21)} height={s(21)} color={H_Colors.Nuts} />
						</View>
						<View>
							<Txt txt={t('walletRecovery')} bold />
							<Txt
								txt={t('walletRecoveryHint')}
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
	header: {
		height: '40%',
		alignItems: 'center',
		justifyContent: 'center'
	},
	headerTxt: {
		fontSize: '30@s',
		textAlign: 'center',
		marginBottom: '20@s'
	},
	navIcon: {
		padding: '20@s',
	},
	optionIcon: {
		minWidth: '40@s',
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