import usePrompt from '@comps/hooks/Prompt'
import { ChevronRightIcon } from '@comps/Icons'
import Separator from '@comps/Separator'
import Toaster from '@comps/Toaster'
import Txt from '@comps/Txt'
import { getProofs } from '@db'
import { getBackUpToken } from '@db/backup'
import type { TSecuritySettingsPageProps } from '@model/nav'
import BottomNav from '@nav/BottomNav'
import TopNav from '@nav/TopNav'
import { ThemeContext } from '@src/context/Theme'
import { isNull } from '@src/util'
import { getTranslationLangCode } from '@src/util/localization'
import { secureStore } from '@store'
import { globals } from '@styles'
import { useContext, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, TouchableOpacity, View } from 'react-native'

export default function SecuritySettings({ navigation, route }: TSecuritySettingsPageProps) {
	const { t } = useTranslation(getTranslationLangCode())
	const { color } = useContext(ThemeContext)
	const { prompt, openPromptAutoClose } = usePrompt()
	const [pin, setPin] = useState<string | null>(null)
	const handleBackup = async () => {
		try {
			const proofs = await getProofs()
			if (!proofs.length) {
				openPromptAutoClose({ msg: t('common.noProofsToBackup') })
				return
			}
			const token = await getBackUpToken()
			navigation.navigate('BackupPage', { token })
		} catch (e) {
			openPromptAutoClose({ msg: t('common.backupErr') })
		}
	}
	const handlePin = async () => {
		const pinHash = await secureStore.get('auth_pin')
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
		<View style={[styles.container, { backgroundColor: color.BACKGROUND }]}>
			<TopNav
				screenName={t('topNav.security')}
				withBackBtn
				backHandler={() => navigation.navigate('Settings')}
			/>
			<View style={globals(color).wrapContainer}>
				{pin ?
					<>
						<SecurityOption
							txt={t('auth.editPin')}
							onPress={() => navigation.navigate('auth', { pinHash: pin, shouldEdit: true })}
						/>
						<Separator />
						<SecurityOption
							txt={t('auth.removePin')}
							onPress={() => navigation.navigate('auth', { pinHash: pin, shouldRemove: true })}
						/>
						<Separator />
					</>
					:
					<>
						<SecurityOption
							txt={t('auth.createPin')}
							onPress={() => navigation.navigate('auth', { pinHash: '' })}
						/>
						<Separator />
					</>
				}
				<SecurityOption
					txt={t('common.createBackup')}
					onPress={() => void handleBackup()}
				/>
			</View>
			<BottomNav navigation={navigation} route={route} />
			{prompt.open && <Toaster txt={prompt.msg} />}
		</View>
	)
}

interface ISecurityOptsProps {
	txt: string
	onPress: () => void
}

function SecurityOption({ txt, onPress }: ISecurityOptsProps) {
	const { color } = useContext(ThemeContext)
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
	container: {
		flex: 1,
		paddingTop: 110,
	},
	settingsRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingVertical: 20,
	},
})