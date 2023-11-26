import Blank from '@comps/Blank'
import { AppleIcon, DownloadIcon, EyeClosedIcon, EyeIcon, GithubIcon } from '@comps/Icons'
import Screen from '@comps/Screen'
import Txt from '@comps/Txt'
import { isIOS } from '@consts'
import { latestApkUrl, releaseUrl, testflightUrl } from '@consts/urls'
import type { TReleasePageProps } from '@model/nav'
import { usePromptContext } from '@src/context/Prompt'
import { useThemeContext } from '@src/context/Theme'
import { NS } from '@src/i18n'
import { mainColors } from '@styles'
import { H_Colors } from '@styles/colors'
import { getShortDateStr, isErr, openUrl } from '@util'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, TouchableOpacity, View } from 'react-native'
import { s, ScaledSheet } from 'react-native-size-matters'

import ProfilePic from './Addressbook/ProfilePic'

export default function ReleaseScreen({ navigation, route }: TReleasePageProps) {
	const { t } = useTranslation([NS.common])
	const { info } = route.params
	const { color } = useThemeContext()
	const { openPromptAutoClose } = usePromptContext()
	const [showBody, setShowBody] = useState(false)
	if (!info) { return <Blank /> }
	return (
		<Screen
			screenName={info.tag_name}
			withBackBtn
			handlePress={() => navigation.goBack()}
		>
			<View style={styles.container}>
				<Badge txt='Latest Release' />
				<View style={styles.author}>
					<ProfilePic
						size={s(30)}
						uri={info.author.avatar_url}
						isUser
					/>
					<Txt
						txt={info.author.login}
						styles={[{ marginLeft: s(10) }]}
						bold
					/>
					<Txt
						txt={`published on ${getShortDateStr(new Date(info.published_at))}`}
						styles={[{ color: color.TEXT_SECONDARY, marginLeft: s(5) }]}
					/>
				</View>
			</View>
			<View style={styles.container}>
				<ActionBtn
					txt={isIOS ? 'Open on Testflight' : 'Download APK'}
					icon={isIOS ? <AppleIcon color={color.TEXT} /> : <DownloadIcon color={color.TEXT} />}
					onPress={() => {
						void openUrl(isIOS ? testflightUrl : latestApkUrl(info.tag_name))?.catch(e =>
							openPromptAutoClose({ msg: isErr(e) ? e.message : t('deepLinkErr') }))
					}}
				/>
				<ActionBtn
					txt='Show on Github'
					icon={<GithubIcon color={color.TEXT} />}
					onPress={() => {
						void openUrl(releaseUrl(info.tag_name))?.catch(e =>
							openPromptAutoClose({ msg: isErr(e) ? e.message : t('deepLinkErr') }))
					}}
				/>
				<ActionBtn
					txt={showBody ? 'Hide Release Notes' : 'Show Release Notes'}
					icon={showBody ? <EyeClosedIcon color={color.TEXT} /> : <EyeIcon color={color.TEXT} />}
					onPress={() => setShowBody(prev => !prev)}
				/>
			</View>
			{showBody &&
				<ScrollView alwaysBounceVertical={false} style={[styles.container, styles.notesBody]}>
					<Txt txt={info.body} styles={[styles.body]} />
				</ScrollView>
			}
		</Screen>
	)
}

function Badge({ txt }: { txt: string }) {
	return (
		<View style={styles.badge}>
			<Txt
				txt={txt}
				bold
				styles={[{ color: mainColors.WHITE }]}
			/>
		</View>
	)
}

function ActionBtn({ txt, onPress, icon }: { txt: string, onPress: () => void, icon?: React.ReactNode }) {
	const { color } = useThemeContext()
	return (
		<TouchableOpacity
			onPress={onPress}
			style={[styles.pressable, { backgroundColor: color.INPUT_BG }]}
		>
			<Txt txt={txt} bold />
			{icon}
		</TouchableOpacity>
	)
}

const styles = ScaledSheet.create({
	container: {
		paddingHorizontal: '20@s',
	},
	badge: {
		alignSelf: 'flex-start',
		backgroundColor: H_Colors.Default,
		paddingHorizontal: '6@s',
		paddingVertical: '3@s',
		borderRadius: '5@s',
	},
	author: {
		flexDirection: 'row',
		alignItems: 'center',
		marginTop: '10@vs',
		paddingBottom: '10@vs',
	},
	pressable: {
		paddingVertical: '15@vs',
		paddingHorizontal: '20@s',
		borderRadius: '5@s',
		marginVertical: '5@vs',
		flexDirection: 'row',
		justifyContent: 'space-between',
	},
	notesBody: {
		marginTop: '10@vs',
		paddingTop: '10@vs',
	},
	body: {
		marginBottom: '20@vs',
		paddingBottom: '20@vs',
	}
})