import { getDecodedLnInvoice } from '@cashu/cashu-ts'
import useLoading from '@comps/hooks/Loading'
import useCashuToken from '@comps/hooks/Token'
import { CloseIcon, FlashlightOffIcon } from '@comps/Icons'
import { isIOS, QRType } from '@consts'
import { addMint, getMintsBalances, getMintsUrls } from '@db'
import { l } from '@log'
import TrustMintModal from '@modal/TrustMint'
import type { IDecodedLNInvoice } from '@model/ln'
import type { TQRScanPageProps } from '@model/nav'
import { usePromptContext } from '@src/context/Prompt'
import { useThemeContext } from '@src/context/Theme'
import { NS } from '@src/i18n'
import { addToHistory } from '@store/latestHistoryEntries'
import { getCustomMintNames } from '@store/mintStore'
import { globals, mainColors } from '@styles'
import { hasTrustedMint, isCashuToken } from '@util'
import { checkFees, claimToken } from '@wallet'
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
		await receiveToken(data)
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
		// add token to db
		await receiveToken(token)
	}

	const receiveToken = async (data: string) => {
		const success = await claimToken(data).catch(l)
		stopLoading()
		// close modal
		setTrustModal(false)
		if (!success) {
			openPromptAutoClose({ msg: t('invalidOrSpent') })
			return
		}
		const info = getTokenInfo(data)
		if (!info) {
			openPromptAutoClose({ msg: t('tokenInfoErr') })
			return
		}
		// success prompt
		openPromptAutoClose({
			msg: t('claimSuccess', { amount: info?.value, mintUrl: info?.mints[0], memo: info?.decoded.memo }),
			success: true
		})
		// add as history entry (receive ecash)
		await addToHistory({
			amount: info.value,
			type: 1,
			value: data,
			mints: info.mints,
		})
	}

	const handleBarCodeScanned = async ({ type, data }: { type: string, data: string }) => {
		setScanned(true)
		const bcType = isIOS ? 'org.iso.QRCode' : +QRType
		// early return if barcode is not a QR
		if (type !== bcType) {
			openPromptAutoClose({ msg: t('notQrCode') })
			return
		}
		// handle cashu token claim
		if (isCashuToken(data)) {
			setToken(data)
			void handleCashuToken(data)
			return
		}
		// handle LN invoice
		try {
			const invoice = data.includes(':') ? data.split(':')[1] : data
			const decoded: IDecodedLNInvoice = getDecodedLnInvoice(invoice)
			// eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
			const amount = decoded.sections[2].value / 1000
			// eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
			const timePassed = Math.ceil(Date.now() / 1000) - decoded.sections[4].value
			// eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
			const timeLeft = decoded.sections[8].value - timePassed
			if (timeLeft <= 0) {
				openPromptAutoClose({ msg: t('invoiceExpired') })
				return
			}
			// user already has selected the mint in the previous screens
			if (mint && balance) {
				// check if invoice amount is higher than the selected mint balance to avoid navigating
				const estFee = await checkFees(mint.mintUrl, invoice)
				if (amount + estFee > balance) {
					openPromptAutoClose({ msg: t('noFundsForFee', { fee: estFee }), ms: 4000 })
					return
				}
				navigation.navigate('coinSelection', {
					mint,
					balance,
					amount,
					estFee,
					isMelt: true
				})
				return
			}
			// user has not selected the mint yet (Pressed scan QR and scanned a Lightning invoice)
			const mintsWithBal = await getMintsBalances()
			const mints = await getCustomMintNames(mintsWithBal.map(m => ({ mintUrl: m.mintUrl })))
			const nonEmptyMint = mintsWithBal.filter(m => m.amount > 0)
			// user has no funds
			if (!nonEmptyMint.length) {
				// user is redirected to the mint selection screen where he gets an appropriate message
				navigation.navigate('selectMint', {
					mints,
					mintsWithBal,
					isMelt: true,
					allMintsEmpty: true
				})
				return
			}
			// user has funds, select his first mint for the case that he has only one
			const mintUsing = mints.find(m => m.mintUrl === nonEmptyMint[0].mintUrl) || { mintUrl: 'N/A', customName: 'N/A' }
			const estFee = await checkFees(mintUsing.mintUrl, invoice)
			if (nonEmptyMint.length === 1 && amount + estFee > nonEmptyMint[0].amount) {
				openPromptAutoClose({ msg: t('noFundsForFee', { fee: estFee }), ms: 4000 })
				return
			}
			// user has only 1 mint with enough balance, he can directly navigate to the payment overview page
			if (nonEmptyMint.length === 1) {
				navigation.navigate('coinSelection', {
					mint: mintUsing,
					balance: nonEmptyMint[0].amount,
					amount,
					estFee,
					isMelt: true,
					recipient: invoice
				})
				return
			}
			// user needs to select mint from which he wants to pay the invoice
			navigation.navigate('selectMint', {
				mints,
				mintsWithBal,
				allMintsEmpty: !nonEmptyMint.length,
				invoiceAmount: amount,
				invoice,
			})

		} catch (e) {
			openPromptAutoClose({ msg: t('unknownType') + data })
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

	return (
		<View style={[globals(color).container, styles.container]}>
			{hasPermission ?
				<>
					<Camera
						flashMode={flash ? FlashMode.torch : FlashMode.off}
						style={StyleSheet.absoluteFill}
						ratio={'16:9'}
						onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
					/>
					<QRMarker size={300} />
					<View style={styles.hint}>
						<Text style={styles.hintTxt}>
							{mint ? t('scanLn') : t('scanTokenOrLn')}
						</Text>
					</View>
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
				<Text style={styles.noAccess}>
					{t('noCamAccess')}
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
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		paddingTop: 0,
		alignItems: 'center',
		justifyContent: 'center',
	},
	noAccess: {
		fontSize: 16,
		fontWeight: '500',
		color: mainColors.WHITE
	},
	flashOn: {
		position: 'absolute',
		bottom: 40,
		padding: 20,
		backgroundColor: mainColors.BLACK,
		opacity: .8,
		borderRadius: 40,
	},
	scanAgain: {
		position: 'absolute',
		bottom: 150,
		padding: 20,
		backgroundColor: mainColors.BLACK,
		opacity: .5,
		borderRadius: 40,
	},
	scanAgainTxt: {
		fontSize: 16,
		fontWeight: '500',
		color: mainColors.WHITE,
		textAlign: 'center',
	},
	hint: {
		position: 'absolute',
		top: 75,
		backgroundColor: mainColors.BLACK,
		opacity: .5,
		padding: 20,
		borderRadius: 40,
	},
	hintTxt: {
		textAlign: 'center',
		fontSize: 16,
		fontWeight: '500',
		color: mainColors.WHITE
	},
	actionLeft: {
		position: 'absolute',
		bottom: 40,
		left: 40,
		backgroundColor: mainColors.BLACK,
		opacity: .5,
		padding: 20,
		borderRadius: 40,
	},
	actionRight: {
		position: 'absolute',
		bottom: 40,
		right: 40,
		backgroundColor: mainColors.BLACK,
		opacity: .5,
		padding: 20,
		borderRadius: 40,
	},
})