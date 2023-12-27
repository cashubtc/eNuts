import { ExclamationIcon, FlagIcon, KeyIcon, PenIcon, TrashbinIcon } from '@comps/Icons'
import Screen from '@comps/Screen'
import Separator from '@comps/Separator'
import Toggle from '@comps/Toggle'
import Txt from '@comps/Txt'
import { appVersion } from '@consts/env'
import { getProofs } from '@db'
import { getBackUpToken } from '@db/backup'
import type { TSecuritySettingsPageProps } from '@model/nav'
import BottomNav from '@nav/BottomNav'
import { usePromptContext } from '@src/context/Prompt'
import { useThemeContext } from '@src/context/Theme'
import { NS } from '@src/i18n'
import { secureStore, store } from '@store'
import { SECURESTORE_KEY, STORE_KEYS } from '@store/consts'
import { globals } from '@styles'
import { isNull, isStr } from '@util'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, View } from 'react-native'
import { s, ScaledSheet, vs } from 'react-native-size-matters'

import MenuItem from './MenuItem'

export default function SecuritySettings({ navigation, route }: TSecuritySettingsPageProps) {
	const { t } = useTranslation([NS.common])
	const { color } = useThemeContext()
	const { openPromptAutoClose } = usePromptContext()
	const [pin, setPin] = useState<string | null>(null)
	const [hasLimit, setHasLimit] = useState(true)
	const handleBackup = async () => {
		try {
			const proofs = await getProofs()
			if (!proofs.length) {
				openPromptAutoClose({ msg: t('noProofsToBackup') })
				return
			}
			const token = await getBackUpToken()
			navigation.navigate('BackupPage', { token })
		} catch (e) {
			openPromptAutoClose({ msg: t('backupErr') })
		}
	}
	const handlePin = async () => {
		const pinHash = await secureStore.get(SECURESTORE_KEY)
		setPin(isNull(pinHash) ? '' : pinHash)
	}
	const handleLimit = async () => {
		await store.set(STORE_KEYS.mintLimit, hasLimit ? '0' : '1')
		setHasLimit(prev => !prev)
	}
	useEffect(() => {
		void handlePin()
		void (async () => {
			const limit = await store.get(STORE_KEYS.mintLimit)
			if (!isStr(limit)) { return }
			setHasLimit(limit === '1')
		})()
	}, [])
	useEffect(() => {
		// eslint-disable-next-line @typescript-eslint/no-misused-promises
		const focusHandler = navigation.addListener('focus', async () => {
			await handlePin()
		})
		return focusHandler
	}, [navigation])
	if (isNull(pin)) { return null }
	return (
		<Screen
			screenName={t('security', { ns: NS.topNav })}
			withBackBtn
			handlePress={() => {
				if (route.params?.isUnlocking) { return navigation.goBack() }
				navigation.navigate('General settings')
			}}
		>
			<ScrollView alwaysBounceVertical={false}>
				<View style={globals(color).wrapContainer}>
					<View style={[globals().wrapRow, { paddingBottom: vs(15) }]}>
						<View style={styles.setting}>
							<ExclamationIcon width={20} height={20} color={color.TEXT} />
							<Txt
								txt={t('limitBal')}
								styles={[styles.settingTxt, { color: color.TEXT }]}
							/>
						</View>
						<View style={styles.toggleWrap}>
							<Toggle value={hasLimit} onChange={() => void handleLimit()} />
						</View>
					</View>
					<Separator style={[styles.separator]} />
					{pin ?
						<>
							<MenuItem
								txt={t('editPin', { ns: NS.auth })}
								icon={<PenIcon width={s(22)} height={s(22)} color={color.TEXT} />}
								onPress={() => navigation.navigate('auth', { pinHash: pin, shouldEdit: true })}
								hasSeparator
							/>
							<MenuItem
								txt={t('removePin', { ns: NS.auth })}
								icon={<TrashbinIcon width={s(22)} height={s(22)} color={color.TEXT} />}
								onPress={() => navigation.navigate('auth', { pinHash: pin, shouldRemove: true })}
								hasSeparator
							/>
						</>
						:
						<MenuItem
							txt={t('createPin', { ns: NS.auth })}
							icon={<KeyIcon width={s(20)} height={s(20)} color={color.TEXT} />}
							onPress={() => navigation.navigate('auth', { pinHash: '' })}
							hasSeparator
						/>
					}
					<MenuItem
						txt={t('createBackup')}
						icon={<FlagIcon width={s(22)} height={s(22)} color={color.TEXT} />}
						onPress={() => void handleBackup()}
					/>
				</View>
				<Txt txt={appVersion} bold center />
			</ScrollView>
			<BottomNav navigation={navigation} route={route} />
		</Screen>
	)
}

const styles = ScaledSheet.create({
	setting: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	settingTxt: {
		marginLeft: '15@s',
	},
	separator: {
		marginBottom: '15@vs',
		marginTop: '3@vs',
	},
	toggleWrap: {
		marginRight: '-10@s'
	}
})