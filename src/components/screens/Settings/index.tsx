import usePrompt from '@comps/hooks/Prompt'
import { ChevronRightIcon, LockIcon, PaletteIcon, TrashbinIcon2 } from '@comps/Icons'
import Separator from '@comps/Separator'
import Txt from '@comps/Txt'
import { PromptModal } from '@modal/Prompt'
import { QuestionModal } from '@modal/Question'
import { TSettingsPageProps } from '@model/nav'
import BottomNav from '@nav/BottomNav'
import TopNav from '@nav/TopNav'
import { ThemeContext } from '@src/context/Theme'
import { historyStore } from '@store'
import { globals } from '@styles'
import { useContext, useState } from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

import { version } from '../../../../package.json'

export default function Settings({ navigation, route }: TSettingsPageProps) {
	const { color } = useContext(ThemeContext)
	const [confirm, setConfirm] = useState(false)
	const { prompt, openPrompt, closePrompt } = usePrompt()
	const handleDeleteHistory = async () => {
		const success = await historyStore.clear()
		openPrompt(success ? 'History deleted' : 'Could not delete the history.')
		setConfirm(false)
	}
	return (
		<View style={[styles.container, { backgroundColor: color.BACKGROUND }]}>
			<TopNav screenName='Settings' />
			<View style={[globals(color).wrapContainer, styles.wrap]}>
				<SettingsMenuItem
					txt='Security'
					txtColor={color.TEXT}
					icon={<LockIcon color={color.TEXT} />}
					onPress={() => navigation.navigate('Security settings')}
					hasSeparator
				/>
				<SettingsMenuItem
					txt='Display'
					txtColor={color.TEXT}
					icon={<PaletteIcon color={color.TEXT} />}
					onPress={() => navigation.navigate('Display settings')}
					hasSeparator
				/>
				<SettingsMenuItem
					txt='Delete transaction history'
					txtColor={color.ERROR}
					icon={<TrashbinIcon2 color={color.ERROR} />}
					onPress={() => setConfirm(true)}
				/>
			</View>
			<Txt txt={`v${version}`} styles={[styles.version]} />
			<BottomNav navigation={navigation} route={route} />
			<QuestionModal
				header='Are you sure that you want to delete the history?'
				txt='The data can not be retrieved afterwards.'
				visible={confirm}
				confirmTxt='Yes'
				confirmFn={() => void handleDeleteHistory()}
				cancelTxt='No'
				cancelFn={() => setConfirm(false)}
			/>
			<PromptModal
				hideIcon
				header={prompt.msg}
				visible={prompt.open}
				close={closePrompt}
			/>
		</View>
	)
}

interface IMenuItemProps {
	txt: string
	txtColor: string
	onPress: () => void
	icon: React.ReactElement
	hasSeparator?: boolean
}

function SettingsMenuItem({ txt, txtColor, icon, onPress, hasSeparator }: IMenuItemProps) {
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
				{!txt.includes('Delete') &&
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
		paddingTop: 120,
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