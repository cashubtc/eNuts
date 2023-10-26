import Button from '@comps/Button'
import Txt from '@comps/Txt'
import { isIOS } from '@consts'
import type { TBeforeRemoveEvent, TProcessingErrorPageProps } from '@model/nav'
import { preventBack } from '@nav/utils'
import { useThemeContext } from '@src/context/Theme'
import { NS } from '@src/i18n'
import { globals, mainColors } from '@styles'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, View } from 'react-native'

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
		<View style={[globals(color).container, styles.container, { paddingBottom: isIOS ? 50 : 20 }]}>
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
					<View style={{ marginVertical: 10 }} />
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

const styles = StyleSheet.create({
	container: {
		paddingTop: 0,
		alignItems: 'center',
		justifyContent: 'space-between',
		padding: 20
	},
	setion: {
		alignItems: 'center',
	},
	hint: {
		fontSize: 14,
		marginTop: 10,
	}
})