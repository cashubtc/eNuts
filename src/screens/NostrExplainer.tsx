import Button from '@comps/Button'
import Logo from '@comps/Logo'
import Txt from '@comps/Txt'
import { isIOS } from '@consts'
import type { TNostrExplainerPageProps } from '@model/nav'
import { useThemeContext } from '@src/context/Theme'
import { NS } from '@src/i18n'
import { store } from '@store'
import { STORE_KEYS } from '@store/consts'
import { highlight as hi } from '@styles'
import { useTranslation } from 'react-i18next'
import { StyleSheet, View } from 'react-native'

export default function NostrExplainerScreen({navigation}: TNostrExplainerPageProps) {
	const { t } = useTranslation([NS.common])
	const { highlight } = useThemeContext()
	const handlePress = async () => {
		await store.set(STORE_KEYS.nostrexplainer, '1')
		navigation.navigate('Address book')
	}
	return (
		<View style={[styles.container, { backgroundColor: hi[highlight] }]}>
			<Logo size={120} style={styles.logo} />
			<Txt txt={t('contactsNostr')} styles={[styles.header]} />
			<Txt txt={t('nostrExplainer')} styles={[styles.p]} />
			<View style={styles.btnWrap}>
				<Button
					filled
					txt={t('continue')}
					onPress={() => void handlePress()}
				/>
			</View>
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: 'center',
		padding: 20
	},
	logo: {
		marginTop: 100,
		marginBottom: 20
	},
	/* step: {
		color: '#FAFAFA',
		fontWeight: '500',
		fontSize: 20,
		marginBottom: 50
	}, */
	header: {
		color: '#FAFAFA',
		fontWeight: '500',
		fontSize: 32,
		marginBottom: 20
	},
	p: {
		color: '#FAFAFA',
		fontWeight: '500',
		fontSize: 20,
		textAlign: 'center'
	},
	btnWrap: {
		position: 'absolute',
		right: 20,
		bottom: isIOS ? 40 : 20,
		left: 20,
	}
})