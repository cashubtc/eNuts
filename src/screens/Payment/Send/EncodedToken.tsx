import ActionButtons from '@comps/ActionButtons'
import useCopy from '@comps/hooks/Copy'
import { CopyIcon, ShareIcon } from '@comps/Icons'
import QR from '@comps/QR'
import Txt from '@comps/Txt'
import type { TEncodedTokenPageProps } from '@model/nav'
import TopNav from '@nav/TopNav'
import { isIOS } from '@src/consts'
import { useThemeContext } from '@src/context/Theme'
import { NS } from '@src/i18n'
import { globals, highlight as hi, mainColors } from '@styles'
import { share, vib } from '@util'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, View } from 'react-native'

/**
 * The page that shows the created Cashu token that can be scanned, copied or shared
 */
export default function EncodedTokenPage({ navigation, route }: TEncodedTokenPageProps) {
	const { t } = useTranslation([NS.common])
	const { color, highlight, theme } = useThemeContext()
	const { copied, copy } = useCopy()
	const [error, setError] = useState({ msg: '', open: false })

	useEffect(() => vib(400), [])

	return (
		<View style={[globals(color).container, styles.container, { paddingBottom: isIOS ? 50 : 20 }]}>
			<TopNav
				withBackBtn
				// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
				screenName={`${t('newToken')}  🥜🐿️`}
				handlePress={() => navigation.navigate('dashboard')}
			/>
			{/* The amount of the created token */}
			<View style={styles.qrWrap}>
				<Txt txt={`${route.params.amount}`} styles={[styles.tokenAmount, { color: hi[highlight] }]} />
				<Txt txt='Satoshi' styles={[styles.tokenFormat]} />
				{/* The QR code */}
				{error.open ?
					<Txt txt={error.msg} styles={[globals(color).navTxt, styles.errorMsg]} />
					:
					<View style={theme === 'Dark' ? styles.qrCodeWrap : undefined}>
						<QR
							size={320}
							value={`cashu://${route.params.token}`}
							onError={() => setError({ msg: t('bigQrMsg'), open: true })}
						/>
					</View>
				}
			</View>
			{/* Action buttons */}
			<ActionButtons
				topBtnTxt={t('share')}
				topIcon={<ShareIcon width={20} height={20} color={mainColors.WHITE} />}
				topBtnAction={() => void share(route.params.token, `cashu://${route.params.token}`)}
				bottomBtnTxt={copied ? t('copied') + '!' : t('copyToken')}
				bottomIcon={<CopyIcon color={hi[highlight]} />}
				bottomBtnAction={() => void copy(route.params.token)}
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
		marginTop: 90,
	},
	tokenAmount: {
		fontSize: 36,
		fontWeight: '500',
		marginTop: 25,
	},
	tokenFormat: {
		marginBottom: 25,
	},
	qrCodeWrap: {
		borderWidth: 5,
		borderColor: mainColors.WHITE
	},
	errorMsg: {
		marginVertical: 25,
		textAlign: 'center',
	}
})