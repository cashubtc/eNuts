import type { TNostrOnboardingPageProps } from '@src/model/nav'
import { STORE_KEYS } from '@src/storage/store/consts'
import { store } from '@store'
import { H_Colors } from '@styles/colors'
import { useTranslation } from 'react-i18next'
import { Image } from 'react-native'
import Onboarding from 'react-native-onboarding-swiper'
import { ScaledSheet } from 'react-native-size-matters'

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

const styles = ScaledSheet.create({
	title: { fontSize: '28@vs', fontWeight: '500' },
	subTitle: { fontSize: '16@vs' },
	nostrImg: {
		width: '480@s',
		height: '180@vs',
		resizeMode: 'contain'
	},
})