import { ChevronRightIcon } from '@comps/Icons'
import Separator from '@comps/Separator'
import Txt from '@comps/Txt'
import { useThemeContext } from '@src/context/Theme'
import { globals } from '@styles'
import { TouchableOpacity, View } from 'react-native'
import { ScaledSheet, vs } from 'react-native-size-matters'

interface IMenuItemProps {
	txt: string
	onPress: () => void
	icon: React.ReactElement
	hasSeparator?: boolean
	hasChevron?: boolean
}

export default function SettingsMenuItem({ txt, icon, onPress, hasSeparator, hasChevron }: IMenuItemProps) {
	const { color } = useThemeContext()
	return (
		<>
			<TouchableOpacity
				style={[globals().wrapRow, { paddingBottom: vs(15) }]}
				onPress={onPress}
			>
				<View style={styles.setting}>
					{icon}
					<Txt
						txt={txt}
						styles={[styles.settingTxt]}
					/>
				</View>
				{hasChevron && <ChevronRightIcon color={color.TEXT} />}
			</TouchableOpacity>
			{hasSeparator && <Separator style={[{ marginBottom: vs(15) }]} />}
		</>
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
})