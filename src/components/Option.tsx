import { useThemeContext } from '@src/context/Theme'
import { StyleSheet, TouchableOpacity, View } from 'react-native'

import { ChevronRightIcon } from './Icons'
import Loading from './Loading'
import Separator from './Separator'
import Txt from './Txt'

interface IOptionProps {
	txt: string
	hint: string
	onPress: () => void
	icon?: React.ReactNode
	hasSeparator?: boolean
	loading?: boolean
	secondIcon?: React.ReactNode
}

export default function Option({ icon, txt, hint, onPress, hasSeparator, loading, secondIcon }: IOptionProps) {
	const { color } = useThemeContext()
	return (
		<>
			<TouchableOpacity style={styles.target} onPress={onPress}>
				<View style={styles.txtWrap}>
					{icon ?
						<View style={{ minWidth: 40 }}>
							{icon}
						</View>
						:
						null
					}
					<View>
						<Txt styles={[{ fontWeight: '500' }]} txt={txt} />
						<Txt styles={[styles.targetHint, { color: color.TEXT_SECONDARY }]} txt={hint} />
					</View>
				</View>
				{loading ?
					<Loading />
					:
					secondIcon ? <View style={styles.iconWrap}>{secondIcon}</View> : <ChevronRightIcon color={color.TEXT} />
				}
			</TouchableOpacity>
			{hasSeparator && <Separator style={[styles.separator]} />}
		</>
	)
}

const styles = StyleSheet.create({
	target: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	targetHint: {
		fontSize: 12,
	},
	txtWrap: {
		flexDirection: 'row',
		alignItems: 'center',
		maxWidth: '80%'
	},
	separator: {
		marginVertical: 20,
	},
	iconWrap: {
		marginRight: -5,
	}
})