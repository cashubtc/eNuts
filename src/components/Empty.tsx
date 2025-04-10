import type { RootStackParamList } from '@model/nav'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useThemeContext } from '@src/context/Theme'
import { Image } from 'expo-image'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'
import { ScaledSheet, vs } from 'react-native-size-matters'

import { TxtButton } from './Button'
import Txt from './Txt'

interface IEmptyProps {
	txt: string
	hint?: string
	hintComponent?: React.ReactNode
	hasOk?: boolean
	pressable?: boolean
	onPress?: () => void
	nav?: NativeStackNavigationProp<RootStackParamList, 'nostrReceive', 'MyStack'> |
	NativeStackNavigationProp<RootStackParamList, 'qr scan', 'MyStack'>
}

export default function Empty({ txt, hint, hintComponent, hasOk, pressable, onPress, nav }: IEmptyProps) {
	const { t } = useTranslation()
	const { color } = useThemeContext()
	return (
		<View style={styles.container}>
			<Image
				style={styles.img}
				 
				source={require('@assets/mixed_forest.png')}
				contentFit='contain'
			/>
			{pressable && onPress ?
				<>
					{hintComponent}
					<TxtButton
						txt={txt}
						onPress={onPress}
					/>
				</>
				:
				<>
					<Txt
						txt={txt}
						bold
						center
						styles={[styles.emptyTxt, { color: color.TEXT, marginBottom: hasOk ? vs(10) : 0 }]}
					/>
					{hint && hint.length > 0 &&
						<Txt
							txt={hint}
							center
							styles={[{ color: color.TEXT_SECONDARY, fontSize: vs(12) }]}
						/>
					}
				</>
			}
			{hasOk &&
				<TxtButton
					txt={t('backToDashboard')}
					onPress={() => nav?.navigate('dashboard')}
				/>
			}
		</View>
	)
}

const styles = ScaledSheet.create({
	container: {
		paddingHorizontal: '20@s',
		alignItems: 'center',
	},
	img: {
		width: '300@s',
		height: '300@vs',
		opacity: .4,
	},
	emptyTxt: {
		fontSize: '18@vs',
		opacity: .8,
	},
})
