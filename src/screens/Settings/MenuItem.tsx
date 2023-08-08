import { ChevronRightIcon } from '@comps/Icons'
import Separator from '@comps/Separator'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

interface IMenuItemProps {
	txt: string
	txtColor: string
	onPress: () => void
	icon: React.ReactElement
	hasSeparator?: boolean
	hasChevron?: boolean
}


export default function SettingsMenuItem({ txt, txtColor, icon, onPress, hasSeparator, hasChevron }: IMenuItemProps) {
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
})