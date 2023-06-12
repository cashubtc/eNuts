import { getDecodedLnInvoice } from '@cashu/cashu-ts'
import useLoading from '@comps/hooks/Loading'
import usePrompt from '@comps/hooks/Prompt'
import useCashuToken from '@comps/hooks/Token'
import { CloseIcon, FlashlightOffIcon, ZapIcon } from '@comps/Icons'
import Toaster from '@comps/Toaster'
import { QRType } from '@consts'
import { addMint, getMintsUrls } from '@db'
import { l } from '@log'
import TrustMintModal from '@modal/TrustMint'
import { IDecodedLNInvoice } from '@model/ln'
import { TQRScanPageProps } from '@model/nav'
import ScannedQRDetails from '@pages/Lightning/scannedQR'
import { ThemeContext } from '@src/context/Theme'
import { addToHistory } from '@store/HistoryStore'
import { hasTrustedMint, isCashuToken, vib } from '@util'
import { claimToken } from '@wallet'
import { getTokenInfo } from '@wallet/proofs'
import { BarCodeScanner } from 'expo-barcode-scanner'
import { Camera, FlashMode } from 'expo-camera'
import { useContext, useEffect, useState } from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

import QRMarker from './Marker'

export default function QRScanPage({ navigation, route }: TQRScanPageProps) {
	const { color } = useContext(ThemeContext)
	const [hasPermission, setHasPermission] = useState<boolean | null>(null)
	const [scanned, setScanned] = useState(false)
	const [flash, setFlash] = useState(false)
	// LN invoice
	const [lnDecoded, setLnDecoded] = useState<IDecodedLNInvoice | undefined>()
	// LN details modal
	const [detailsOpen, setDetailsOpen] = useState(false)
	// prompt modal
	const { prompt, openPromptAutoClose } = usePrompt()
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
			openPromptAutoClose({ msg: 'Token invalid or already claimed' })
			return
		}
		// save token info in state
		setTokenInfo(info)
		// check if user wants to trust the token mint
		const userMints = await getMintsUrls()
		// TODO update this check for future multiple mints of token
		if (!hasTrustedMint(userMints, info.mints)) {
			// ask user for permission if token mint is not in his mint list
			setTrustModal(true)
			return
		}
		await receiveToken(data)
	}

	const handleTrustModal = async () => {
		if (loading) { return }
		startLoading()
		// TODO Maybe we should provide the user the possibility to choose mints
		// in the trust modal-question once multiple mints per token are available...
		if (!tokenInfo) {
			openPromptAutoClose({ msg: 'Invalid cashu token' })
			stopLoading()
			// close modal
			setTrustModal(false)
			return
		}
		// TODO only add chosen mints by the user
		for (const mint of tokenInfo.mints) {
			// eslint-disable-next-line no-await-in-loop
			await addMint(mint)
		}
		// add token to db
		await receiveToken(token)
	}

	const receiveToken = async (data: string) => {
		const success = await claimToken(data).catch(l)
		stopLoading()
		// close modal
		setTrustModal(false)
		if (!success) {
			openPromptAutoClose({ msg: 'Token invalid or already claimed' })
			return
		}
		const info = getTokenInfo(data)
		// TODO show all mints of token
		if (!info) {
			openPromptAutoClose({ msg: 'Error while getting token info' })
			return
		}
		// success prompt
		openPromptAutoClose({
			msg: `Claimed ${info?.value} Satoshi from${'\n'}${info?.mints[0]}!${'\n'}Memo: ${info?.decoded.memo}`,
			success: true
		})
		// add as history entry
		await addToHistory({
			amount: info.value,
			type: 1,
			value: data,
			mints: info.mints,
		})
	}

	const handleBarCodeScanned = ({ type, data }: { type: string, data: string }) => {
		setScanned(true)
		// early return if barcode is not a QR
		if (+type !== QRType) {
			openPromptAutoClose({ msg: 'Not a QR code!' })
			return
		}
		// handle cashu token claim
		if (isCashuToken(data)) {
			setToken(data)
			void handleCashuToken(data)
			return
		}
		// handle LN invoice (LN payment request (mint -> LN))
		try {
			const invoice = data.split(':')[1]
			const ln = getDecodedLnInvoice(invoice)
			setLnDecoded(ln)
			setDetailsOpen(true)
		} catch (e) {
			l(e)
			openPromptAutoClose({ msg: `Unknown data: ${data}` })
		}
	}

	// Camera permission
	useEffect(() => {
		const getBarCodeScannerPermissions = async () => {
			const { status } = await BarCodeScanner.requestPermissionsAsync()
			setHasPermission(status === 'granted')
		}
		void getBarCodeScannerPermissions()
	}, [])

	return (
		<View style={[styles.container, { backgroundColor: color.BACKGROUND }]}>
			{hasPermission && !detailsOpen ?
				<>
					<Camera
						flashMode={flash ? FlashMode.torch : FlashMode.off}
						style={StyleSheet.absoluteFill}
						ratio={'16:9'}
						barCodeScannerSettings={{
							barCodeTypes: [`${QRType}`],
						}}
						onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
					/>
					<QRMarker size={300} />
					<View style={styles.hint}>
						<Text style={styles.hintTxt}>
							Scan cashu token or Lightning invoice
						</Text>
					</View>
					{scanned &&
						<TouchableOpacity
							style={styles.scanAgain}
							onPress={() => setScanned(false)}
						>
							<Text style={styles.scanAgainTxt}>
								Tap to Scan Again
							</Text>
						</TouchableOpacity>
					}
					<TouchableOpacity
						style={styles.actionLeft}
						onPress={() => setFlash(prev => !prev)}
					>
						<FlashlightOffIcon width={30} height={30} color='#FFF' />
					</TouchableOpacity>
					{flash &&
						<View style={styles.flashOn}>
							<ZapIcon width={30} height={30} color='#FFCC00' />
						</View>
					}
					<TouchableOpacity
						style={styles.actionRight}
						onPress={() => {
							vib(100)
							navigation.goBack()
						}}
					>
						<CloseIcon width={30} height={30} color='#FFF' />
					</TouchableOpacity>
				</>
				:
				<Text style={styles.noAccess}>
					No access to camera
				</Text>
			}
			{/* Question modal for mint trusting */}
			{trustModal &&
				<TrustMintModal
					loading={loading}
					tokenInfo={tokenInfo}
					handleTrustModal={() => void handleTrustModal()}
					closeModal={() => setTrustModal(false)}
				/>
			}
			{detailsOpen &&
				<ScannedQRDetails
					lnDecoded={lnDecoded}
					closeDetails={() => {
						setDetailsOpen(false)
						setScanned(false)
					}}
					nav={{ navigation, route }}
				/>
			}
			{prompt.open &&
				<Toaster
					success={prompt.success}
					txt={prompt.msg}
				/>
			}
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
	},
	noAccess: {
		fontSize: 16,
		fontWeight: '500',
		color: '#FFF'
	},
	flashOn: {
		position: 'absolute',
		bottom: 40,
		padding: 20,
		backgroundColor: '#000',
		opacity: .8,
		borderRadius: 40,
	},
	scanAgain: {
		position: 'absolute',
		bottom: 150,
		padding: 20,
		backgroundColor: '#000',
		opacity: .5,
		borderRadius: 40,
	},
	scanAgainTxt: {
		fontSize: 16,
		fontWeight: '500',
		color: '#FFF',
		textAlign: 'center',
	},
	hint: {
		position: 'absolute',
		top: 75,
		backgroundColor: '#000',
		opacity: .5,
		padding: 20,
		borderRadius: 40,
	},
	hintTxt: {
		textAlign: 'center',
		fontSize: 16,
		fontWeight: '500',
		color: '#FFF'
	},
	actionLeft: {
		position: 'absolute',
		bottom: 40,
		left: 40,
		backgroundColor: '#000',
		opacity: .5,
		padding: 20,
		borderRadius: 40,
	},
	actionRight: {
		position: 'absolute',
		bottom: 40,
		right: 40,
		backgroundColor: '#000',
		opacity: .5,
		padding: 20,
		borderRadius: 40,
	},
	no: {
		fontSize: 16,
		fontWeight: '500',
		marginTop: 15,
		marginBottom: -15,
		padding: 10,
	},
	mintPrompt: {
		fontSize: 12,
		marginBottom: 5,
	},
	tokenMintsView: {
		marginBottom: 20
	},
})