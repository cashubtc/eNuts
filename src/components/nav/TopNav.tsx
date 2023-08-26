import { LeftArrow, ScanQRIcon } from '@comps/Icons'
import { useThemeContext } from '@src/context/Theme'
import { NS } from '@src/i18n'
import { globals, highlight as hi } from '@styles'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

interface TTopNavProps {
	screenName?: string
	withBackBtn?: boolean
	cancel?: boolean
	handlePress?: () => void
	txt?: string
}

export default function TopNav({ screenName, withBackBtn, cancel, handlePress, txt }: TTopNavProps) {
	const { t } = useTranslation([NS.common])
	const { color, highlight } = useThemeContext()
	return (
		<View style={[styles.topNav, { backgroundColor: color.BACKGROUND }]}>
			{/* Placeholder */}
			{!screenName && !withBackBtn && <View />}
			<View style={styles.wrap}>
				{withBackBtn && !cancel && !txt?.length &&
					<TouchableOpacity
						onPress={handlePress}
						style={styles.backiconWrap}
					>
						<LeftArrow color={hi[highlight]} />
					</TouchableOpacity>
				}
				{screenName &&
					<Text style={globals(color).navTxt}>
						{screenName}
					</Text>
				}
			</View>
			<TouchableOpacity style={styles.right} onPress={handlePress}>
				{(cancel || txt?.length) ?
					<Text style={globals(color, highlight).pressTxt}>
						{txt || t('cancel')}
					</Text>
					:
					!withBackBtn && <ScanQRIcon color={color.TEXT} />
				}
			</TouchableOpacity>
		</View>
	)
}

const styles = StyleSheet.create({
	topNav: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingTop: 60,
		paddingHorizontal: 20,
		paddingBottom: 10,
	},
	wrap: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	backiconWrap: {
		marginLeft: -20,
		paddingLeft: 20,
		paddingRight: 20,
	},
	right: {
		paddingLeft: 20,
	},
})