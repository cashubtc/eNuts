import Button from '@comps/Button'
import { ShareIcon } from '@comps/Icons'
import QR from '@comps/QR'
import Txt from '@comps/Txt'
import type { TBeforeRemoveEvent, TEncodedTokenPageProps } from '@model/nav'
import TopNav from '@nav/TopNav'
import { preventBack } from '@nav/utils'
import { isIOS } from '@src/consts'
import { useThemeContext } from '@src/context/Theme'
import { NS } from '@src/i18n'
import { store } from '@store'
import { STORE_KEYS } from '@store/consts'
import { globals, highlight as hi } from '@styles'
import { formatInt, share, vib } from '@util'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, View } from 'react-native'

/**
 * The page that shows the created Cashu token that can be scanned, copied or shared
 */
export default function EncodedTokenPage({ navigation, route }: TEncodedTokenPageProps) {
	const { t } = useTranslation([NS.common])
	const { color, highlight } = useThemeContext()
	const [error, setError] = useState({ msg: '', open: false })

	useEffect(() => {
		// we can save the created token here to avoid foreground prompts of self-created tokens
		void store.set(STORE_KEYS.createdToken, route.params.token)
		vib(400)
	}, [route.params.token])

	// prevent back navigation - https://reactnavigation.org/docs/preventing-going-back/
	useEffect(() => {
		const backHandler = (e: TBeforeRemoveEvent) => preventBack(e, navigation.dispatch)
		navigation.addListener('beforeRemove', backHandler)
		return () => navigation.removeListener('beforeRemove', backHandler)
	}, [navigation])

	return (
		<View style={[globals(color).container, styles.container, { paddingBottom: isIOS ? 50 : 20 }]}>
			<TopNav
				withBackBtn
				screenName={`${t('newToken')}  🥜🐿️`}
				handlePress={() => navigation.navigate('dashboard')}
			/>
			{/* The amount of the created token */}
			<View style={styles.qrWrap}>
				<Txt txt={formatInt(route.params.amount)} styles={[styles.tokenAmount, { color: hi[highlight] }]} />
				<Txt txt='Satoshi' styles={[styles.tokenFormat]} />
				{/* The QR code */}
				{error.open ?
					<Txt txt={error.msg} styles={[globals(color).navTxt, styles.errorMsg]} />
					:
					<QR
						size={320}
						value={`cashu://${route.params.token}`}
						onError={() => setError({ msg: t('bigQrMsg'), open: true })}
					/>
				}
			</View>
			<Button
				outlined
				txt={t('share')}
				onPress={() => void share(route.params.token, `cashu://${route.params.token}`)}
				icon={<ShareIcon width={18} height={18} color={hi[highlight]} />}
			/>
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		paddingTop: 0,
		alignItems: 'center',
		justifyContent: 'space-between',
		width: '100%',
		padding: 20,
	},
	qrWrap: {
		alignItems: 'center',
		marginTop: 100,
	},
	tokenAmount: {
		fontSize: 42,
		fontWeight: '500',
		marginTop: 25,
	},
	tokenFormat: {
		marginBottom: 25,
	},
	errorMsg: {
		marginVertical: 25,
		textAlign: 'center',
	}
})