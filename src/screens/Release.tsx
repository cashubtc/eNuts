/* eslint-disable @typescript-eslint/restrict-template-expressions */
import Blank from '@comps/Blank'
import { AppleIcon, ChevronRightIcon, DownloadIcon, EyeClosedIcon, EyeIcon, GithubIcon } from '@comps/Icons'
import Screen from '@comps/Screen'
import Txt from '@comps/Txt'
import { isIOS } from '@consts'
import { latestApkUrl, releaseUrl, testflightUrl } from '@consts/urls'
import type { TReleasePageProps } from '@model/nav'
import { usePromptContext } from '@src/context/Prompt'
import { useReleaseContext } from '@src/context/Release'
import { useThemeContext } from '@src/context/Theme'
import { NS } from '@src/i18n'
import { mainColors } from '@styles'
import { getShortDateStr, isErr, openUrl } from '@util'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { s, ScaledSheet, vs } from 'react-native-size-matters'

import { version } from '../../package.json'
import ProfilePic from './Addressbook/ProfilePic'

export default function ReleaseScreen({ navigation }: TReleasePageProps) {
	const { t } = useTranslation([NS.common])
	const { isOutdated, info } = useReleaseContext()
	const { color } = useThemeContext()
	const { openPromptAutoClose } = usePromptContext()
	const [showBody, setShowBody] = useState(false)
	if (!info) { return <Blank /> }
	return (
		<Screen
			screenName={isOutdated ? t('newRelease') : t('releaseNotes')}
			withBackBtn
			handlePress={() => navigation.goBack()}
		>
			<View style={styles.container}>
				<View style={styles.author}>
					<ProfilePic
						size={s(30)}
						uri={info.author.avatar_url}
						isUser
					/>
					<Text style={{ marginLeft: s(10), fontWeight: '600', color: color.TEXT, fontSize: vs(16) }}>
						{info.author.login}
						<Text style={{ color: color.TEXT_SECONDARY, marginLeft: s(5), fontSize: vs(14), fontWeight: '400' }}>
							{t('publishedOn', { date: getShortDateStr(new Date(info.published_at)) })}
						</Text>
					</Text>
				</View>
				<View style={styles.badgeWrap}>
					{isOutdated &&
						<>
							<Badge txt={`v${version}`} color={mainColors.WARN} />
							<View style={styles.chevronWrap}>
								<ChevronRightIcon width={8} height={15} color={color.TEXT} />
							</View>
						</>
					}
					<Badge txt={info.tag_name} color={mainColors.VALID} />
				</View>
			</View>
			{isOutdated &&
				<View style={styles.container}>
					<ActionBtn
						txt={isIOS ? t('openOnTestflight') : t('downloadApk')}
						icon={isIOS ? <AppleIcon color={color.TEXT} /> : <DownloadIcon color={color.TEXT} />}
						onPress={() => {
							void openUrl(isIOS ? testflightUrl : latestApkUrl(info.tag_name))?.catch(e =>
								openPromptAutoClose({ msg: isErr(e) ? e.message : t('deepLinkErr') }))
						}}
					/>
					<ActionBtn
						txt={t('showOnGithub')}
						icon={<GithubIcon color={color.TEXT} />}
						onPress={() => {
							void openUrl(releaseUrl(info.tag_name))?.catch(e =>
								openPromptAutoClose({ msg: isErr(e) ? e.message : t('deepLinkErr') }))
						}}
					/>
					<ActionBtn
						txt={showBody ? t('hideReleaseNotes') : t('releaseNotes')}
						icon={showBody ? <EyeClosedIcon color={color.TEXT} /> : <EyeIcon color={color.TEXT} />}
						onPress={() => setShowBody(prev => !prev)}
					/>
				</View>
			}
			{(showBody || !isOutdated) &&
				<ScrollView alwaysBounceVertical={false} style={[styles.container, styles.notesBody]}>
					<Txt txt={info.body} styles={[styles.body]} />
				</ScrollView>
			}
		</Screen>
	)
}

function Badge({ txt, color }: { txt: string, color: string }) {
	return (
		<View style={[styles.badge, { backgroundColor: color }]}>
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
	badgeWrap: {
		flexDirection: 'row',
		alignItems: 'center',
		marginTop: '5@vs',
	},
	badge: {
		alignSelf: 'flex-start',
		paddingHorizontal: '6@s',
		paddingVertical: '3@s',
		borderRadius: '5@s',
		marginBottom: '5@vs',
	},
	chevronWrap: {
		marginHorizontal: '10@s',
		marginBottom: '5@vs',
	},
	author: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingBottom: '20@vs',
		paddingRight: '20@s',
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