import { ChevronRightIcon } from '@comps/Icons'
import LeaveAppModal from '@comps/LeaveAppModal'
import Screen from '@comps/Screen'
import Separator from '@comps/Separator'
import Txt from '@comps/Txt'
import { appVersion } from '@consts/env'
import type { TAboutSettingsPageProps } from '@model/nav'
import { useThemeContext } from '@src/context/Theme'
import { NS } from '@src/i18n'
import { globals } from '@styles'
import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

export default function AboutSettings({ navigation }: TAboutSettingsPageProps) {
	const { t } = useTranslation([NS.common])
	const { color } = useThemeContext()
	const [visible, setVisible] = useState(false)
	const closeModal = useCallback(() => setVisible(false), [])
	const [url, setUrl] = useState('')
	const handlePress = (url: string) => {
		setVisible(true)
		setUrl(url)
	}
	return (
		<Screen
			screenName={t('about', { ns: NS.topNav })}
			withBackBtn
			handlePress={() => navigation.goBack()}
		>
			<View style={[globals(color).wrapContainer, styles.wrap]}>
				<AboutRow
					txt={t('readme')}
					handlePress={() => handlePress('https://github.com/cashubtc/eNuts#readme')}
					hasSeparator
				/>
				<AboutRow
					txt={t('githubIssues')}
					handlePress={() => handlePress('https://github.com/cashubtc/eNuts/issues/new/choose')}
					hasSeparator
				/>
				{/* <AboutRow
					txt={t('cashuRandD')}
					handlePress={() => handlePress('https://t.me/CashuBTC')}
					hasSeparator
				/> */}
				<AboutRow
					txt={t('enutsRandD')}
					handlePress={() => handlePress('https://t.me/eNutsWallet')}
				/>
			</View>
			<Txt txt={appVersion} styles={[styles.version]} />
			<LeaveAppModal url={url} visible={visible} closeModal={closeModal} />
		</Screen>
	)
}

interface IAboutRowProps {
	txt: string
	handlePress: () => void
	hasSeparator?: boolean
}

function AboutRow({ txt, handlePress, hasSeparator }: IAboutRowProps) {
	const { color } = useThemeContext()
	return (
		<>
			<TouchableOpacity
				style={styles.aboutRow}
				onPress={handlePress}
			>
				<Text style={[styles.aboutTxt, { color: color.TEXT }]}>
					{txt}
				</Text>
				<ChevronRightIcon color={color.TEXT} />
			</TouchableOpacity>
			{hasSeparator && <Separator style={[{ marginVertical: 10 }]} />}
		</>
	)
}

const styles = StyleSheet.create({
	wrap: {
		paddingVertical: 10,
		marginBottom: 20,
	},
	aboutRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingVertical: 10,
	},
	aboutTxt: {
		fontSize: 16,
	},
	version: {
		fontWeight: '500',
		textAlign: 'center',
	},
	cancel: {
		marginTop: 25,
	},
})