import Logo from '@comps/Logo'
import type { TOnboardingPageProps } from '@model/nav'
import { NS } from '@src/i18n'
import { H_Colors } from '@styles/colors'
import { useTranslation } from 'react-i18next'
import { Image } from 'react-native'
import Onboarding from 'react-native-onboarding-swiper'
import { s, ScaledSheet } from 'react-native-size-matters'

export default function OnboardingScreen({ navigation }: TOnboardingPageProps) {
	const { t } = useTranslation([NS.common])
	return (
		<Onboarding
			onDone={() => navigation.navigate('Seed', { comingFromOnboarding: true })} /* navigation.navigate('auth', { pinHash: '' }) */
			pages={[
				{
					backgroundColor: H_Colors.Default,
					image: <Logo size={s(180)} />,
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
			nextLabel={t('next')}
			skipLabel={t('skip')}
			onSkip={() => navigation.navigate('Seed', { comingFromOnboarding: true })} /* navigation.navigate('auth', { pinHash: '' }) */
		/>
	)
}

const styles = ScaledSheet.create({
	title: { fontSize: '28@vs', fontWeight: '500' },
	subTitle: { fontSize: '16@vs' },
	cashuImg: {
		width: '200@s',
		height: '200@vs',
		resizeMode: 'contain'
	},
	sendReceiveImg: {
		width: '380@s',
		height: '250@vs',
		resizeMode: 'contain'
	}
})