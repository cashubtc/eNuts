import Button from '@comps/Button'
import { ExclamationIcon } from '@comps/Icons'
import Txt from '@comps/Txt'
import type { TBeforeRemoveEvent, TProcessingErrorPageProps } from '@model/nav'
import { preventBack } from '@nav/utils'
import { useThemeContext } from '@src/context/Theme'
import { NS } from '@src/i18n'
import { globals, mainColors } from '@styles'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'
import { s, ScaledSheet, vs } from 'react-native-size-matters'

const alreadySpentErr = 'Token already spent.'

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
				<ExclamationIcon width={s(60)} height={s(60)} color={mainColors.ERROR} />
				<Txt txt={route.params.errorMsg} bold center styles={[styles.errMsg]} />
				{!route.params.scan && route.params.errorMsg !== alreadySpentErr &&
					<Txt center styles={[styles.hint, { color: color.TEXT_SECONDARY }]} txt={t('tryLater')} />
				}
				{route.params.errorMsg === alreadySpentErr &&
					<Txt center styles={[styles.hint, { color: color.TEXT_SECONDARY }]} txt={t('alreadySpentHint')} />
				}
			</View>
			<View style={globals().fullWidth}>
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
	errMsg: {
		color: mainColors.ERROR,
		marginVertical: '15@vs',
		fontSize: '18@vs',
	},
	hint: {
		fontSize: '14@vs',
		marginTop: '10@vs',
	}
})