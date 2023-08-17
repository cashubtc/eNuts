import type { RootStackParamList } from '@model/nav'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useThemeContext } from '@src/context/Theme'
import { globals, highlight as hi } from '@styles'
import { useTranslation } from 'react-i18next'
import { Image, StyleSheet, TouchableOpacity } from 'react-native'

import Txt from './Txt'

interface IEmptyProps {
	txt: string
	hasOk?: boolean
	nav?: NativeStackNavigationProp<RootStackParamList, 'nostrReceive', 'MyStack'>
}

export default function Empty({ txt, hasOk, nav }: IEmptyProps) {
	const { t } = useTranslation()
	const { color, highlight } = useThemeContext()
	return (
		<>
			<Image
				style={styles.img}
				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
				source={require('@assets/mixed_forest.png')}
			/>
			<Txt
				txt={txt}
				styles={[styles.emptyTxt, { color: color.TEXT_SECONDARY, marginBottom: hasOk ? 10 : 0 }]}
			/>
			{hasOk &&
				<TouchableOpacity
					onPress={() => nav?.navigate('dashboard')}
					style={{ paddingVertical: 10 }}
				>
					<Txt txt={t('backToDashboard')} styles={[globals(color).pressTxt, { color: hi[highlight], padding: 10 }]} />
				</TouchableOpacity>
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
