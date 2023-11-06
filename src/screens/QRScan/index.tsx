import Empty from '@comps/Empty'
import useLoading from '@comps/hooks/Loading'
import useCashuToken from '@comps/hooks/Token'
import { CloseIcon, FlashlightOffIcon } from '@comps/Icons'
import { isIOS, QRType } from '@consts'
import { addMint, getMintsUrls } from '@db'
import { l } from '@log'
import TrustMintModal from '@modal/TrustMint'
import type { TQRScanPageProps } from '@model/nav'
import { isNpubQR } from '@nostr/util'
import { useIsFocused } from '@react-navigation/core'
import { usePromptContext } from '@src/context/Prompt'
import { useThemeContext } from '@src/context/Theme'
import { NS } from '@src/i18n'
import { globals, mainColors } from '@styles'
import { decodeLnInvoice, extractStrFromURL, hasTrustedMint, isCashuToken, isUrl } from '@util'
import { getTokenInfo } from '@wallet/proofs'
import { BarCodeScanner, PermissionStatus } from 'expo-barcode-scanner'
import { Camera, FlashMode } from 'expo-camera'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

import QRMarker from './Marker'

export default function QRScanPage({ navigation, route }: TQRScanPageProps) {
	const { mint, balance } = route.params
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
			openPromptAutoClose({ msg: t('invalidOrSpent') })
			return
		}
		// save token info in state
		setTokenInfo(info)
		// check if user wants to trust the token mint
		const userMints = await getMintsUrls()
		if (!hasTrustedMint(userMints, info.mints)) {
			// ask user for permission if token mint is not in his mint list
			setTrustModal(true)
			return
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
			setTrustModal(false)
			return
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
			openPromptAutoClose({ msg: t('notQrCode') })
			return
		}
		// handle cashu token claim
		if (isCashuToken(data)) {
			l('is cashu token', data)
			setToken(data)
			void handleCashuToken(data)
			return
		}
		// handle npubs
		const npub = isNpubQR(data)
		if (npub) {
			return navigation.navigate('npub confirm', { npub })
		}
		// l({ data })
		// l({ dataProtocol: new URL(data).protocol })
		// handle urls
		if (isUrl(data) && new URL(data).protocol === 'https:') {
			// l('is url', data)
			return navigation.navigate('mint confirm', { mintUrl: data })
		}
		// handle LN invoice
		try {
			const invoice = extractStrFromURL(data) ?? data
			const { amount, timeLeft } = decodeLnInvoice(invoice)
			if (timeLeft <= 0) {
				openPromptAutoClose({ msg: t('invoiceExpired') })
				return
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
						style={styles.actionLeft}
						onPress={() => setFlash(prev => !prev)}
					>
						<FlashlightOffIcon width={30} height={30} color={flash ? mainColors.WARN : mainColors.WHITE} />
					</TouchableOpacity>
					<TouchableOpacity
						style={styles.actionRight}
						onPress={() => navigation.goBack()}
					>
						<CloseIcon width={30} height={30} color={mainColors.WHITE} />
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

const styles = StyleSheet.create({
	container: {
		paddingTop: 0,
		alignItems: 'center',
	},
	scanAgain: {
		position: 'absolute',
		bottom: 150,
		padding: 20,
		backgroundColor: 'rgba(0,0,0,.5)',
		borderRadius: 40,
	},
	scanAgainTxt: {
		fontSize: 16,
		fontWeight: '500',
		color: mainColors.WHITE,
		textAlign: 'center',
	},
	actionLeft: {
		position: 'absolute',
		bottom: 40,
		left: 40,
		backgroundColor: 'rgba(0,0,0,.5)',
		padding: 20,
		borderRadius: 40,
	},
	actionRight: {
		position: 'absolute',
		bottom: 40,
		right: 40,
		backgroundColor: 'rgba(0,0,0,.5)',
		padding: 20,
		borderRadius: 40,
	},
})