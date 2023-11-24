import Button from '@comps/Button'
import Txt from '@comps/Txt'
import type { TBeforeRemoveEvent, TProcessingErrorPageProps } from '@model/nav'
import { preventBack } from '@nav/utils'
import { useThemeContext } from '@src/context/Theme'
import { NS } from '@src/i18n'
import { globals, mainColors } from '@styles'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'
import { ScaledSheet, vs } from 'react-native-size-matters'

export default function ProcessingErrorScreen({ navigation, route }: TProcessingErrorPageProps) {

	const { t } = useTranslation([NS.common])
	const { color } = useThemeContext()

	// prevent back navigation - https://reactnavigation.org/docs/preventing-going-back/
	useEffect(() => {
		const backHandler = (e: TBeforeRemoveEvent) => preventBack(e, navigation.dispatch)
		navigation.addListener('beforeRemove', backHandler)
		return () => navigation.removeListener('beforeRemove', backHandler)
	}, [navigation])

	return (
		<View style={[globals(color).container, styles.container, { paddingBottom: vs(20) }]}>
			<View />
			<View style={styles.setion}>
				<Txt txt={route.params.errorMsg} styles={[{ color: mainColors.ERROR, textAlign: 'center' }]} />
				{!route.params.scan &&
					<Txt styles={[styles.hint, { color: color.TEXT_SECONDARY }]} txt={t('tryLater')} />
				}
			</View>
			{route.params.scan &&
				<>
					<Button
						txt={t('scanAgain')}
						onPress={() => navigation.navigate('qr scan', {})}
					/>
					<View style={{ marginVertical: vs(10) }} />
				</>
			}
			<Button
				outlined={route.params.scan}
				txt={t('backToDashboard')}
				onPress={() => navigation.navigate('dashboard')}
			/>
		</View>
	)
}

const styles = ScaledSheet.create({
	container: {
		paddingTop: 0,
		alignItems: 'center',
		justifyContent: 'space-between',
		padding: '20@s',
	},
	setion: {
		alignItems: 'center',
	},
	hint: {
		fontSize: '12@vs',
		marginTop: '10@vs',
	}
})