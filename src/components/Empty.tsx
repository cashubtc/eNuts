import type { RootStackParamList } from '@model/nav'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useThemeContext } from '@src/context/Theme'
import { useTranslation } from 'react-i18next'
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native'

import { TxtButton } from './Button'
import Txt from './Txt'

interface IEmptyProps {
	txt: string
	hint?: string
	hasOk?: boolean
	pressable?: boolean
	onPress?: () => void
	nav?: NativeStackNavigationProp<RootStackParamList, 'nostrReceive', 'MyStack'> |
	NativeStackNavigationProp<RootStackParamList, 'qr scan', 'MyStack'>
}

export default function Empty({ txt, hint, hasOk, pressable, onPress, nav }: IEmptyProps) {
	const { t } = useTranslation()
	const { color } = useThemeContext()
	return (
		<View style={styles.container}>
			<Image
				style={styles.img}
				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
				source={require('@assets/mixed_forest.png')}
			/>
			{pressable && onPress ?
				<TouchableOpacity>
					<TxtButton
						txt={txt}
						onPress={onPress}
					/>
				</TouchableOpacity>
				:
				<>
					<Txt
						txt={txt}
						bold
						center
						styles={[styles.emptyTxt, { color: color.TEXT, marginBottom: hasOk ? 10 : 0 }]}
					/>
					{hint && hint.length > 0 &&
						<Txt
							txt={hint}
							center
							styles={[{ color: color.TEXT_SECONDARY, fontSize: 14 }]}
						/>
					}
				</>
			}
			{hasOk &&
				<TxtButton
					txt={t('backToDashboard')}
					onPress={() => nav?.navigate('dashboard')}
				// style={[{ paddingVertical: 10 }]}
				/>
			}
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		paddingHorizontal: 20,
	},
	img: {
		width: '100%',
		height: 350,
		resizeMode: 'contain',
		opacity: .4,
	},
	emptyTxt: {
		fontSize: 20,
		opacity: .8,
	},
})
