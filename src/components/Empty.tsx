import type { RootStackParamList } from '@model/nav'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useThemeContext } from '@src/context/Theme'
import { useTranslation } from 'react-i18next'
import { Image, StyleSheet, TouchableOpacity } from 'react-native'

import { TxtButton } from './Button'
import Txt from './Txt'

interface IEmptyProps {
	txt: string
	hasOk?: boolean
	pressable?: boolean
	onPress?: () => void
	nav?: NativeStackNavigationProp<RootStackParamList, 'nostrReceive', 'MyStack'>
}

export default function Empty({ txt, hasOk, pressable, onPress, nav }: IEmptyProps) {
	const { t } = useTranslation()
	const { color } = useThemeContext()
	return (
		<>
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
				<Txt
					txt={txt}
					styles={[styles.emptyTxt, { color: color.TEXT_SECONDARY, marginBottom: hasOk ? 10 : 0 }]}
				/>
			}
			{hasOk &&
				<TxtButton
					txt={t('backToDashboard')}
					onPress={() => nav?.navigate('dashboard')}
					style={[{ paddingVertical: 10 }]}
				/>
			}
		</>
	)
}

const styles = StyleSheet.create({
	img: {
		width: '100%',
		height: 350,
		resizeMode: 'contain',
		opacity: .4,
	},
	emptyTxt: {
		fontSize: 20,
		fontWeight: '500',
		textAlign: 'center',
		marginTop: 20,
		opacity: .8,
	}
})
