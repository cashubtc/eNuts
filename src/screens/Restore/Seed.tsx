import { TxtButton } from '@comps/Button'
import { BackupIcon, BoltIcon, ExitIcon, InfoIcon, LeafIcon, LeftArrow } from '@comps/Icons'
import MyModal from '@comps/modal'
import Separator from '@comps/Separator'
import Txt from '@comps/Txt'
import type { ISeedPageProps } from '@model/nav'
import { useThemeContext } from '@src/context/Theme'
import { NS } from '@src/i18n'
import { l } from '@src/logger'
import { store } from '@store'
import { STORE_KEYS } from '@store/consts'
import { globals, mainColors } from '@styles'
import { H_Colors } from '@styles/colors'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SafeAreaView, Text, TouchableOpacity, View } from 'react-native'
import { s, ScaledSheet, vs } from 'react-native-size-matters'

export default function SeedScreen({ navigation, route: { params } }: ISeedPageProps) {

	const { t } = useTranslation([NS.common])
	const { color } = useThemeContext()
	const [infoOpen, setInfoOpen] = useState(false)

	l({
		sawSeedUpdate: params?.sawSeedUpdate,
		comingFromOnboarding: params?.comingFromOnboarding,
		hasSeed: params?.hasSeed,
	})

	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: color.BACKGROUND }}>
			<View style={styles.header}>
				<Txt
					txt={t('seedBackup')}
					styles={[styles.headerTxt]}
				/>
			</View>
			<View style={styles.headerActions}>
				{!params?.comingFromOnboarding && params?.sawSeedUpdate ?
					<TouchableOpacity
						style={styles.navIcon}
						onPress={() => navigation.navigate('Security settings')}
					>
						<LeftArrow color={color.TEXT} />
					</TouchableOpacity>
					: <View />
				}
				<TouchableOpacity
					style={styles.navIcon}
					onPress={() => setInfoOpen(true)}
				>
					<InfoIcon color={color.TEXT} />
				</TouchableOpacity>
			</View>
			<View style={[styles.wrapContainer, { backgroundColor: color.DRAWER }]}>
				{/* secure wallet */}
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
				{/* quick wallet */}
				{params?.comingFromOnboarding && !params?.hasSeed &&
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
				{/* wallet recovery */}
				<TouchableOpacity
					onPress={() => {
						void store.set(STORE_KEYS.sawSeedUpdate, '1')
						navigation.navigate('Restore warning', { comingFromOnboarding: params?.comingFromOnboarding })
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
				{/* skip seed setup */}
				{!params?.comingFromOnboarding && !params?.hasSeed && !params?.sawSeedUpdate &&
					<>
						<Separator style={[styles.separator]} />
						<TouchableOpacity
							onPress={() => {
								void store.set(STORE_KEYS.sawSeedUpdate, '1')
								navigation.navigate('dashboard')
							}}
						>
							<View style={styles.action}>
								<View style={styles.optionIcon}>
									<ExitIcon color={H_Colors.Sky} />
								</View>
								<View>
									<Txt txt={t('willDoLater')} bold />
									<Txt
										txt={t('skipSeedHint')}
										styles={[{ fontSize: vs(11), color: color.TEXT_SECONDARY }]}
									/>
								</View>
							</View>
						</TouchableOpacity>
					</>
				}
			</View>
			<MyModal type='bottom' animation='slide' visible={infoOpen} close={() => setInfoOpen(false)} >
				<Text style={globals(color).modalHeader}>
					{t('seedBackup')}
				</Text>
				<Text style={[globals(color).modalTxt, { marginHorizontal: 0 }]}>
					{t('seedMigrationHint')}
				</Text>
				<TxtButton
					txt='OK'
					onPress={() => setInfoOpen(false)}
					style={[{ paddingBottom: s(20), marginTop: s(-20) }]}
				/>
			</MyModal>
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
		height: '35%',
		alignItems: 'center',
		justifyContent: 'center',
		paddingHorizontal: '20@s',
	},
	headerTxt: {
		fontSize: '30@s',
		textAlign: 'center',
	},
	headerActions: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between'
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