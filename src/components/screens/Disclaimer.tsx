import Button from '@comps/Button'
import Txt from '@comps/Txt'
import type { TDisclaimerPageProps } from '@model/nav'
import TopNav from '@nav/TopNav'
import { ThemeContext } from '@src/context/Theme'
import { useContext } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, View } from 'react-native'

export function Disclaimer({ navigation }: TDisclaimerPageProps) {
	const { color } = useContext(ThemeContext)
	const { t } = useTranslation(['common'])
	return (
		<View style={{ flex: 1, backgroundColor: color.BACKGROUND }}>
			<TopNav screenName={t('disclaimer')} withBackBtn />
			<View style={styles.container}>
				<Txt txt={t('disclaimer', { ns: 'wallet' })} />
			</View>
			<View style={styles.ok}>
				<Button
					txt='OK'
					onPress={() => navigation.navigate('dashboard')}
				/>
			</View>
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		marginTop: 110,
		paddingHorizontal: 20,
	},
	ok: {
		position: 'absolute',
		bottom: 20,
		right: 20,
		left: 20,
	}
})