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
	disabled?: boolean
}

export default function SettingsMenuItem({ txt, icon, onPress, hasSeparator, hasChevron, disabled }: IMenuItemProps) {
	const { color } = useThemeContext()
	return (
		<>
			<TouchableOpacity
				style={[globals().wrapRow, { paddingBottom: vs(15) }]}
				onPress={onPress}
				disabled={disabled}
			>
				<View style={styles.setting}>
					{icon}
					<Txt
						txt={txt}
						styles={[styles.settingTxt, { color: disabled ? color.TEXT_SECONDARY : color.TEXT }]}
					/>
				</View>
				{hasChevron && <ChevronRightIcon color={color.TEXT} />}
			</TouchableOpacity>
			{hasSeparator && <Separator style={[styles.separator]} />}
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
	separator: {
		marginBottom: '15@vs',
		marginTop: '3@vs',
	}
})