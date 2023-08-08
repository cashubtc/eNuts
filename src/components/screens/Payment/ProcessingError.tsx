import Button from '@comps/Button'
import Txt from '@comps/Txt'
import { isIOS } from '@consts'
import type { TProcessingErrorPageProps } from '@model/nav'
import { useThemeContext } from '@src/context/Theme'
import { globals, mainColors } from '@styles'
import { useTranslation } from 'react-i18next'
import { StyleSheet, View } from 'react-native'

export default function ProcessingErrorScreen({ navigation, route }: TProcessingErrorPageProps) {
	const { t } = useTranslation(['common'])
	const { color } = useThemeContext()
	return (
		<View style={[globals(color).container, styles.container, { paddingBottom: isIOS ? 50 : 20 }]}>
			<View />
			<View style={styles.setion}>
				<Txt txt={route.params.errorMsg} styles={[{ color: mainColors.ERROR }]} />
				<Txt styles={[styles.hint, { color: color.TEXT_SECONDARY }]} txt={t('tryLater')} />
			</View>
			<Button
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