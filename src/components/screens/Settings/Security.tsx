import { ChevronRightIcon } from '@comps/Icons'
import Screen from '@comps/Screen'
import Separator from '@comps/Separator'
import Txt from '@comps/Txt'
import { getProofs } from '@db'
import { getBackUpToken } from '@db/backup'
import type { TSecuritySettingsPageProps } from '@model/nav'
import BottomNav from '@nav/BottomNav'
import { usePromptContext } from '@src/context/Prompt'
import { useThemeContext } from '@src/context/Theme'
import { SECURESTORE_KEY } from '@src/storage/store/consts'
import { secureStore } from '@store'
import { globals } from '@styles'
import { isNull } from '@util'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, TouchableOpacity, View } from 'react-native'

export default function SecuritySettings({ navigation, route }: TSecuritySettingsPageProps) {
	const { t } = useTranslation(['common'])
	const { color } = useThemeContext()
	const { openPromptAutoClose } = usePromptContext()
	const [pin, setPin] = useState<string | null>(null)
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
	useEffect(() => void handlePin(), [])
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
			screenName={t('security', { ns: 'topNav' })}
			withBackBtn
			handlePress={() => navigation.navigate('Settings')}
		>
			<View style={globals(color).wrapContainer}>
				{pin ?
					<>
						<SecurityOption
							txt={t('editPin', { ns: 'auth' })}
							onPress={() => navigation.navigate('auth', { pinHash: pin, shouldEdit: true })}
						/>
						<Separator />
						<SecurityOption
							txt={t('removePin', { ns: 'auth' })}
							onPress={() => navigation.navigate('auth', { pinHash: pin, shouldRemove: true })}
						/>
						<Separator />
					</>
					:
					<>
						<SecurityOption
							txt={t('createPin', { ns: 'auth' })}
							onPress={() => navigation.navigate('auth', { pinHash: '' })}
						/>
						<Separator />
					</>
				}
				<SecurityOption
					txt={t('createBackup')}
					onPress={() => void handleBackup()}
				/>
			</View>
			<BottomNav navigation={navigation} route={route} />
		</Screen>
	)
}

interface ISecurityOptsProps {
	txt: string
	onPress: () => void
}

function SecurityOption({ txt, onPress }: ISecurityOptsProps) {
	const { color } = useThemeContext()
	return (
		<TouchableOpacity
			style={styles.settingsRow}
			onPress={onPress}
		>
			<Txt txt={txt} />
			<ChevronRightIcon color={color.TEXT} />
		</TouchableOpacity>
	)
}

const styles = StyleSheet.create({
	settingsRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingVertical: 20,
	},
})