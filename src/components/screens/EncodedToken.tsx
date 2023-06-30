import ActionButtons from '@comps/ActionButtons'
import QR from '@comps/QR'
import Txt from '@comps/Txt'
import { l } from '@log'
import type { TEncodedTokenPageProps } from '@model/nav'
import TopNav from '@nav/TopNav'
import { ThemeContext } from '@src/context/Theme'
import { dark, globals, highlight as hi } from '@styles'
import { vib } from '@util'
import * as Clipboard from 'expo-clipboard'
import { useContext, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Share, StyleSheet, View } from 'react-native'

/**
 * The page that shows the created Cashu token that can be scanned, copied or shared
 */
export default function EncodedTokenPage({ route }: TEncodedTokenPageProps) {
	const { t } = useTranslation()
	const { color, highlight } = useContext(ThemeContext)
	const [copied, setCopied] = useState(false)
	const [error, setError] = useState({ msg: '', open: false })
	useEffect(() => vib(400), [])
	// share token
	const handleShare = async () => {
		try {
			const res = await Share.share({
				message: route.params.token, // `cashu://${route.params.token}`
				url: `cashu://${route.params.token}`
			})
			if (res.action === Share.sharedAction) {
				if (res.activityType) {
					// shared with activity type of result.activityType
					l('shared with activity type of result.activityType')
				} else {
					// shared
					l('shared')
				}
			} else if (res.action === Share.dismissedAction) {
				// dismissed
				l('sharing dismissed')
			}
		} catch (e) {
			l(e)
		}
	}
	// copy token
	const handleCopy = async () => {
		await Clipboard.setStringAsync(route.params.token)
		setCopied(true)
		const t = setTimeout(() => {
			setCopied(false)
			clearTimeout(t)
		}, 3000)
	}
	return (
		<View style={[styles.container, { backgroundColor: color.BACKGROUND }]}>
			<TopNav withBackBtn />
			{/* The amount of the created token */}
			<View style={styles.qrWrap}>
				<Txt txt={route.params.amount} styles={[styles.tokenAmount, { color: hi[highlight] }]} />
				<Txt txt='Satoshi' styles={[styles.tokenFormat]} />
				{/* The QR code */}
				{error.open ?
					<Txt txt={error.msg} styles={[globals(color).navTxt, styles.errorMsg]} />
					:
					<View style={color.BACKGROUND === dark.colors.background ? styles.qrCodeWrap : undefined}>
						<QR
							size={320}
							value={`cashu://${route.params.token}`}
							onError={() => setError({ msg: t('common.bigQrMsg'), open: true })}
						/>
					</View>
				}
			</View>
			{/* Action buttons */}
			<ActionButtons
				topBtnTxt={t('common.share')}
				topBtnAction={() => void handleShare()}
				bottomBtnTxt={copied ? t('common.copied') + '!' : t('common.copyToken')}
				bottomBtnAction={() => void handleCopy()}
			/>
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'space-between',
		width: '100%',
		padding: 20,
	},
	qrWrap: {
		alignItems: 'center',
		marginTop: 75,
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
		borderColor: '#FFF'
	},
	errorMsg: {
		marginVertical: 25,
		textAlign: 'center',
	}
})