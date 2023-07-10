import usePrompt from '@comps/hooks/Prompt'
import { AboutIcon, ChevronRightIcon, LanguageIcon, LockIcon, PaletteIcon, TrashbinIcon2 } from '@comps/Icons'
import Separator from '@comps/Separator'
import Toaster from '@comps/Toaster'
import Txt from '@comps/Txt'
import { QuestionModal } from '@modal/Question'
import type { TSettingsPageProps } from '@model/nav'
import BottomNav from '@nav/BottomNav'
import TopNav from '@nav/TopNav'
import { ThemeContext } from '@src/context/Theme'
import { historyStore } from '@store'
import { globals } from '@styles'
import { getTranslationLangCode } from '@util/localization'
import { useContext, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

import { version } from '../../../../package.json'

export default function Settings({ navigation, route }: TSettingsPageProps) {
	const { t } = useTranslation(getTranslationLangCode())
	const { color } = useContext(ThemeContext)
	const [confirm, setConfirm] = useState(false)
	const { prompt, openPromptAutoClose } = usePrompt()
	const handleDeleteHistory = async () => {
		const success = await historyStore.clear()
		openPromptAutoClose({
			msg: success ? t('common.historyDeleted') : t('common.delHistoryErr'),
			success
		})
		setConfirm(false)
	}
	return (
		<View style={[styles.container, { backgroundColor: color.BACKGROUND }]}>
			<TopNav screenName={t('topNav.settings')} nav={{ navigation, route }} />
			<View style={[globals(color).wrapContainer, styles.wrap]}>
				<SettingsMenuItem
					txt={t('topNav.security')}
					txtColor={color.TEXT}
					icon={<LockIcon color={color.TEXT} />}
					onPress={() => navigation.navigate('Security settings')}
					hasSeparator
					hasChevron
				/>
				<SettingsMenuItem
					txt={t('topNav.display')}
					txtColor={color.TEXT}
					icon={<PaletteIcon color={color.TEXT} />}
					onPress={() => navigation.navigate('Display settings')}
					hasSeparator
					hasChevron
				/>
				<SettingsMenuItem
					txt={t('topNav.language')}
					txtColor={color.TEXT}
					icon={<LanguageIcon color={color.TEXT} />}
					onPress={() => navigation.navigate('Language settings')}
					hasSeparator
					hasChevron
				/>
				<SettingsMenuItem
					txt={t('topNav.about')}
					txtColor={color.TEXT}
					icon={<AboutIcon color={color.TEXT} />}
					onPress={() => navigation.navigate('About settings')}
					hasSeparator
					hasChevron
				/>
				<SettingsMenuItem
					txt={t('common.delHistory')}
					txtColor={color.ERROR}
					icon={<TrashbinIcon2 color={color.ERROR} />}
					onPress={() => setConfirm(true)}
				/>
			</View>
			<Txt txt={`eNuts v${version}`} styles={[styles.version]} />
			<BottomNav navigation={navigation} route={route} />
			<QuestionModal
				header={t('common.delHistoryQ')}
				txt={t('common.delHistoryTxt')}
				visible={confirm}
				confirmTxt={t('common.yes')}
				confirmFn={() => void handleDeleteHistory()}
				cancelTxt={t('common.no')}
				cancelFn={() => setConfirm(false)}
			/>
			{prompt.open && <Toaster success={prompt.success} txt={prompt.msg} /> }
		</View>
	)
}

interface IMenuItemProps {
	txt: string
	txtColor: string
	onPress: () => void
	icon: React.ReactElement
	hasSeparator?: boolean
	hasChevron?: boolean
}

function SettingsMenuItem({ txt, txtColor, icon, onPress, hasSeparator, hasChevron }: IMenuItemProps) {
	return (
		<>
			<TouchableOpacity
				style={styles.settingsRow}
				onPress={onPress}
			>
				<View style={styles.setting}>
					{icon}
					<Text style={[styles.settingTxt, { color: txtColor }]}>
						{txt}
					</Text>
				</View>
				{hasChevron &&
					<ChevronRightIcon color={txtColor} />
				}
			</TouchableOpacity>
			{hasSeparator && <Separator style={[{ marginVertical: 10 }]} />}
		</>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		paddingTop: 110,
	},
	wrap: {
		paddingVertical: 10,
		marginBottom: 20,
	},
	settingsRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingVertical: 10,
	},
	setting: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	settingTxt: {
		marginLeft: 15,
		fontSize: 16,
	},
	version: {
		fontWeight: '500',
		textAlign: 'center',
	}
})