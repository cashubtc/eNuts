import Button from '@comps/Button'
import Txt from '@comps/Txt'
import TopNav from '@nav/TopNav'
import type { TDisclaimerPageProps } from '@src/model/nav'
import { useTranslation } from 'react-i18next'
import { StyleSheet, View } from 'react-native'

export function Disclaimer({ navigation }: TDisclaimerPageProps) {
	const { t } = useTranslation()
	return (
		<View style={{ flex: 1 }}>
			<TopNav screenName={t('common.disclaimer')} withBackBtn />
			<View style={styles.container}>
				<Txt txt={t('wallet.disclaimer')} />
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