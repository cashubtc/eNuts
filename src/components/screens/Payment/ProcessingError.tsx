import Button from '@comps/Button'
import Txt from '@comps/Txt'
import type { TProcessingErrorPageProps } from '@model/nav'
import { ThemeContext } from '@src/context/Theme'
import { mainColors } from '@styles'
import { useContext } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, View } from 'react-native'

export default function ProcessingErrorScreen({ navigation, route }: TProcessingErrorPageProps) {
	const { t } = useTranslation(['common'])
	const { color } = useContext(ThemeContext)
	return (
		<View style={[styles.container, { backgroundColor: color.BACKGROUND }]}>
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
		flex: 1,
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