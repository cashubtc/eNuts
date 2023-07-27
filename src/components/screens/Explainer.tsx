/* eslint-disable new-cap */
import Button from '@comps/Button'
import Logo from '@comps/Logo'
import Txt from '@comps/Txt'
import { isIOS } from '@consts'
import type { TExplainerPageProps } from '@model/nav'
import { ThemeContext } from '@src/context/Theme'
import { highlight as hi } from '@styles'
import { useContext, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, View } from 'react-native'

export default function ExplainerScreen({ navigation }: TExplainerPageProps) {
	const { t } = useTranslation(['common'])
	const { highlight } = useContext(ThemeContext)
	const [steps, setSteps] = useState(0)
	const Steps = () => [
		<Step key={0} header='eNuts & Ecash' txt={t('explainer1')} />,
		<Step key={1} header='Cashu & Mints' txt={t('explainer2')} />,
		<Step key={2} header={t('send&receive')} txt={t('explainer3')} />,
	]
	return (
		<View style={[styles.container, { backgroundColor: hi[highlight] }]}>
			<Logo size={120} style={styles.logo} />
			<Txt txt={`${steps + 1}/3`} styles={[styles.step]} />
			{Steps()[steps]}
			<View style={styles.btnWrap}>
				<Button
					filled
					txt={t('continue')}
					onPress={() => {
						if (steps < 2) {
							setSteps(prev => prev + 1)
							return
						}
						navigation.navigate('dashboard')
					}}
				/>
			</View>
		</View>
	)
}

function Step({ header, txt }: { header: string, txt: string }) {
	return (
		<>
			<Txt txt={header} styles={[styles.header]} />
			<Txt txt={txt} styles={[styles.p]} />
		</>
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
	step: {
		color: '#FAFAFA',
		fontWeight: '500',
		fontSize: 20,
		marginBottom: 50
	},
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