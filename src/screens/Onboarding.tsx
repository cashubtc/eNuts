import Logo from '@comps/Logo'
import type { TOnboardingPageProps } from '@model/nav'
import { H_Colors } from '@styles/colors'
import { useTranslation } from 'react-i18next'
import { Image, StyleSheet } from 'react-native'
import Onboarding from 'react-native-onboarding-swiper'

export default function OnboardingScreen({ navigation }: TOnboardingPageProps) {
	const { t } = useTranslation()
	return (
		<Onboarding
			showSkip={false}
			onDone={() => navigation.navigate('auth', { pinHash: '' })}
			pages={[
				{
					backgroundColor: H_Colors.Default,
					image: <Logo size={180} />,
					title: 'eNuts & Ecash',
					subtitle: t('explainer1'),
				},
				{
					backgroundColor: '#8038CA',
					// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
					image: <Image style={styles.cashuImg} source={require('@assets/cashu.png')} />,
					title: 'Cashu & Mints',
					subtitle: t('explainer2'),
				},
				{
					backgroundColor: H_Colors.Nuts,
					// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
					image: <Image style={styles.sendReceiveImg} source={require('@assets/send_receive.png')} />,
					title: t('send&receive'),
					subtitle: t('explainer3'),
				},
			]}
			transitionAnimationDuration={250}
			titleStyles={styles.title}
			subTitleStyles={styles.subTitle}
		/>
	)
}

const styles = StyleSheet.create({
	title: { fontSize: 28 },
	subTitle: { fontSize: 18 },
	cashuImg: {
		width: 200,
		height: 200,
		resizeMode: 'contain'
	},
	sendReceiveImg: {
		width: 380,
		height: 250,
		resizeMode: 'contain'
	}
})