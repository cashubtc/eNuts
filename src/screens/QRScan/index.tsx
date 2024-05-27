import Empty from '@comps/Empty'
import useLoading from '@comps/hooks/Loading'
import useCashuToken from '@comps/hooks/Token'
import { CloseIcon, FlashlightOffIcon } from '@comps/Icons'
import { isIOS, QRType } from '@consts'
import { addMint, getMintsUrls } from '@db'
import TrustMintModal from '@modal/TrustMint'
import type { TQRScanPageProps } from '@model/nav'
import { isNProfile, isNpubQR } from '@nostr/util'
import { useIsFocused } from '@react-navigation/core'
import { usePromptContext } from '@src/context/Prompt'
import { useThemeContext } from '@src/context/Theme'
import { NS } from '@src/i18n'
import { getDefaultMint } from '@store/mintStore'
import { globals, mainColors } from '@styles'
import { decodeLnInvoice, extractStrFromURL, hasTrustedMint, isCashuToken, isNull, isStr } from '@util'
import { decodeUrlOrAddress, isLnurlOrAddress, isUrl } from '@util/lnurl'
import { getTokenInfo } from '@wallet/proofs'
import { BarCodeScanner, PermissionStatus } from 'expo-barcode-scanner'
import { Camera, FlashMode } from 'expo-camera/legacy'
import { nip19 } from 'nostr-tools'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { s, ScaledSheet } from 'react-native-size-matters'

import QRMarker from './Marker'

export default function QRScanPage({ navigation, route }: TQRScanPageProps) {
	const { mint, balance, isPayment } = route.params
	const { t } = useTranslation([NS.common])
	const { openPromptAutoClose } = usePromptContext()
	const { color } = useThemeContext()
	const isFocused = useIsFocused()
	const [hasPermission, setHasPermission] = useState<boolean | null>(null)
	const [scanned, setScanned] = useState(false)
	const [flash, setFlash] = useState(false)
	// prompt modal
	const { loading, startLoading, stopLoading } = useLoading()
	// cashu token
	const {
		token,
		setToken,
		tokenInfo,
		setTokenInfo,
		trustModal,
		setTrustModal
	} = useCashuToken()

	const handleCashuToken = async (data: string) => {
		const info = getTokenInfo(data)
		if (!info) {
			return openPromptAutoClose({ msg: t('invalidOrSpent') })
		}
		// save token info in state
		setTokenInfo(info)
		// check if user wants to trust the token mint
		const defaultM = await getDefaultMint()
		const userMints = await getMintsUrls()
		if (!hasTrustedMint(userMints, info.mints) || (isStr(defaultM) && !info.mints.includes(defaultM))) {
			// ask user for permission if token mint is not in his mint list
			return setTrustModal(true)
		}
		navigation.navigate('qr processing', { tokenInfo: info, token: data })
	}

	const handleTrustModal = async () => {
		if (loading) { return }
		startLoading()
		if (!tokenInfo) {
			openPromptAutoClose({ msg: t('invalidToken') })
			stopLoading()
			// close modal
			return setTrustModal(false)
		}
		for (const mint of tokenInfo.mints) {
			// eslint-disable-next-line no-await-in-loop
			await addMint(mint)
		}
		stopLoading()
		// close modal
		setTrustModal(false)
		navigation.navigate('qr processing', { tokenInfo, token })
	}

	const handleBarCodeScanned = ({ type, data }: { type: string, data: string }) => {
		setScanned(true)
		const bcType = isIOS ? 'org.iso.QRCode' : +QRType
		// early return if barcode is not a QR
		if (type !== bcType) {
			return openPromptAutoClose({ msg: t('notQrCode') })
		}
		// handle cashu token claim
		const cashuToken = isCashuToken(data)
		if (cashuToken) {
			setToken(cashuToken)
			return handleCashuToken(cashuToken)
		}
		// handle nostr
		if (isNProfile(data)) {
			try {
				const res = nip19.decode(data)?.data
				return navigation.navigate('npub confirm', { hex: res.pubkey, isPayment })
			} catch (e) {
				return openPromptAutoClose({ msg: t('unknownType') + ` "${data}"` })
			}
		}
		const npub = isNpubQR(data)
		if (npub) {
			const hex = nip19.decode(npub)?.data
			return navigation.navigate('npub confirm', { hex, isPayment })
		}
		// handle mint urls
		if (isUrl(data) && new URL(data).protocol === 'https:') {
			return navigation.navigate('mint confirm', { mintUrl: data })
		}
		// handle LNURL
		if (isLnurlOrAddress(data)) {
			const decoded = decodeUrlOrAddress(data)
			if (!decoded) {
				return openPromptAutoClose({ msg: t('unknownType') + ` - decoded LNURL: "${decoded}"` })
			}
			return navigation.navigate('qr processing', { lnurl: { data, mint, balance, url: decoded }, scanned: true })
		}
		// handle LN invoice
		try {
			const invoice = extractStrFromURL(data) || data
			const { amount, timeLeft } = decodeLnInvoice(invoice)
			if (timeLeft <= 0) {
				return openPromptAutoClose({ msg: t('invoiceExpired') })
			}
			navigation.navigate('qr processing', { ln: { invoice, mint, balance, amount } })
		} catch (e) {
			openPromptAutoClose({ msg: t('unknownType') + ` "${data}"` })
		}
	}

	// Camera permission
	useEffect(() => {
		const getBarCodeScannerPermissions = async () => {
			const { status } = await BarCodeScanner.requestPermissionsAsync()
			setHasPermission(status === PermissionStatus.GRANTED)
		}
		void getBarCodeScannerPermissions()
	}, [])

	useEffect(() => {
		if (!isFocused) {
			setScanned(false)
		}
	}, [isFocused])

	if (isNull(hasPermission)) {
		return <View style={styles.empty} />
	}

	return (
		<View style={[
			globals(color).container,
			styles.container,
			isFocused && hasPermission ? { justifyContent: 'center' } : {}
		]}>
			{isFocused && hasPermission ?
				<>
					<Camera
						flashMode={flash ? FlashMode.torch : FlashMode.off}
						style={StyleSheet.absoluteFill}
						ratio={'16:9'}
						// eslint-disable-next-line @typescript-eslint/no-misused-promises
						onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
					/>
					<QRMarker size={300} color={scanned ? mainColors.GREY : mainColors.WHITE} />
					{scanned &&
						<TouchableOpacity
							style={styles.scanAgain}
							onPress={() => setScanned(false)}
						>
							<Text style={styles.scanAgainTxt}>
								{t('scanAgain')}
							</Text>
						</TouchableOpacity>
					}
					<TouchableOpacity
						style={[styles.action, styles.left]}
						onPress={() => setFlash(prev => !prev)}
					>
						<FlashlightOffIcon width={s(30)} height={s(30)} color={flash ? mainColors.WARN : mainColors.WHITE} />
					</TouchableOpacity>
					<TouchableOpacity
						style={[styles.action, styles.right]}
						onPress={() => navigation.goBack()}
					>
						<CloseIcon width={s(30)} height={s(30)} color={mainColors.WHITE} />
					</TouchableOpacity>
				</>
				:
				<Empty txt={t('noCamAccess')} hasOk nav={navigation} />
			}
			{/* Question modal for mint trusting */}
			{trustModal &&
				<TrustMintModal
					loading={loading}
					tokenInfo={tokenInfo}
					handleTrustModal={() => void handleTrustModal()}
					closeModal={() => {
						setTrustModal(false)
						setScanned(false)
					}}
				/>
			}
		</View>
	)
}

const styles = ScaledSheet.create({
	empty: {
		flex: 1,
		backgroundColor: mainColors.BLACK,
	},
	container: {
		paddingTop: 0,
		alignItems: 'center',
	},
	scanAgain: {
		position: 'absolute',
		bottom: '150@vs',
		padding: '20@s',
		backgroundColor: 'rgba(0,0,0,.5)',
		borderRadius: 40,
	},
	scanAgainTxt: {
		fontSize: '14@vs',
		fontWeight: '500',
		color: mainColors.WHITE,
		textAlign: 'center',
	},
	action: {
		position: 'absolute',
		bottom: '40@vs',
		backgroundColor: 'rgba(0,0,0,.5)',
		width: '60@s',
		height: '60@s',
		alignItems: 'center',
		justifyContent: 'center',
		borderRadius: '30@s',
	},
	left: {
		left: '40@s',
	},
	right: {
		right: '40@s',
	},
})