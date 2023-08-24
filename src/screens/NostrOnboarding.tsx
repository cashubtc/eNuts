import type { TNostrOnboardingPageProps } from '@src/model/nav'
import { STORE_KEYS } from '@src/storage/store/consts'
import { store } from '@store'
import { H_Colors } from '@styles/colors'
import { useTranslation } from 'react-i18next'
import { Image, StyleSheet } from 'react-native'
import Onboarding from 'react-native-onboarding-swiper'

export default function NostrOnboardingScreen({navigation}: TNostrOnboardingPageProps) {
	const { t } = useTranslation()
	return (
		<Onboarding
			showSkip={false}
			onDone={() => {
				void store.set(STORE_KEYS.nostrexplainer, '1')
				navigation.navigate('Address book')
			}}
			pages={[
				{
					backgroundColor: H_Colors.Nostr,
					// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
					image: <Image style={styles.nostrImg} source={require('@assets/nostr.png')} />,
					title: t('contactsNostr'),
					subtitle: t('nostrExplainer'),
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
	nostrImg: {
		width: 400,
		height: 180,
		resizeMode: 'contain'
	}
})