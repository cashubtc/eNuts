import Button from '@comps/Button'
import useLoading from '@comps/hooks/Loading'
import usePrompt from '@comps/hooks/Prompt'
import { ZapIcon } from '@comps/Icons'
import Txt from '@comps/Txt'
import { getMintsBalances, getMintsUrls, getProofsByMintUrl } from '@db'
import { l } from '@log'
import MyModal from '@modal'
import { PromptModal } from '@modal/Prompt'
import { IMintUrl, IProofSelection } from '@model'
import { IDecodedLNInvoice } from '@model/ln'
import { TQRScanPageProps } from '@model/nav'
import { Picker } from '@react-native-picker/picker'
import { CoinSelectionModal, CoinSelectionResume } from '@screens/Lightning/modal'
import { ThemeContext } from '@src/context/Theme'
import { addLnPaymentToHistory } from '@store/HistoryStore'
import { getCustomMintNames, getDefaultMint, getMintName } from '@store/mintStore'
import { globals, highlight as hi } from '@styles'
import { formatExpiry, formatInt, formatMintUrl, getSelectedAmount, isErr } from '@util'
import { payLnInvoice } from '@wallet'
import { useContext, useEffect, useState } from 'react'
import { StyleSheet, Switch, Text, View } from 'react-native'

interface IScannedQRProps {
	lnDecoded?: IDecodedLNInvoice
	closeDetails: () => void
	nav: TQRScanPageProps
}

// TODO adapt style
export default function ScannedQRDetails({ lnDecoded, closeDetails, nav }: IScannedQRProps) {
	const { color, highlight } = useContext(ThemeContext)
	const { loading, startLoading, stopLoading } = useLoading()
	const { prompt, openPrompt, closePrompt } = usePrompt()
	// user mints
	const [mints, setMints] = useState<IMintUrl[]>([])
	const [selectedMint, setSelectedMint] = useState<IMintUrl>()
	const [mintBal, setMintBal] = useState(0)
	// LN invoice amount
	const [invoiceAmount, setInvoiceAmount] = useState(0)
	// LN invoice time left until expiry
	const [timeLeft, setTimeLeft] = useState(0)
	// coin selection
	const [isEnabled, setIsEnabled] = useState(false)
	const toggleSwitch = () => setIsEnabled(prev => !prev)
	const [proofs, setProofs] = useState<IProofSelection[]>([])
	const handlePayment = async () => {
		if (!lnDecoded || !selectedMint?.mintUrl) { return }
		startLoading()
		const selectedProofs = proofs.filter(p => p.selected)
		try {
			const res = await payLnInvoice(selectedMint.mintUrl, lnDecoded.paymentRequest, selectedProofs)
			stopLoading()
			if (!res.result?.isPaid) {
				openPrompt('Invoice could not be payed. Please try again later.')
				return
			}
			// payment success, add as history entry
			await addLnPaymentToHistory(
				res,
				[selectedMint.mintUrl],
				-invoiceAmount,
				lnDecoded.paymentRequest
			)
			nav.navigation.navigate('success', {
				amount: invoiceAmount + res.realFee,
				fee: res.realFee,
				mints: [selectedMint.mintUrl]
			})
		} catch (e) {
			l(e)
			openPrompt(isErr(e) ? e.message : 'An error occured while paying the invoice.')
			stopLoading()
		}
	}
	// initiate user mints
	useEffect(() => {
		if (!lnDecoded) { return }
		// eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
		setInvoiceAmount(lnDecoded.sections[2].value / 1000)
		// eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
		const timePassed = Math.ceil(Date.now() / 1000) - lnDecoded.sections[4].value
		// eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
		setTimeLeft(lnDecoded.sections[8].value - timePassed)
		void (async () => {
			const userMints = await getMintsUrls(true)
			if (!userMints.length) { return }
			// get mints with custom names
			setMints(await getCustomMintNames(userMints))
			// set first selected mint
			const defaultMint = await getDefaultMint()
			if (!defaultMint) {
				setSelectedMint(userMints[0])
				return
			}
			for (const mint of userMints) {
				if (mint.mintUrl === defaultMint) {
					setSelectedMint(mint)
					break
				}
			}
		})()
	}, [lnDecoded])
	// update mint balance after picking mint
	useEffect(() => {
		void (async () => {
			const mintsBals = await getMintsBalances()
			mintsBals.forEach(m => {
				if (m.mintUrl === selectedMint?.mintUrl) {
					setMintBal(m.amount)
				}
			})
			if (!selectedMint?.mintUrl) { return }
			// proofs
			const proofsDB = (await getProofsByMintUrl(selectedMint.mintUrl)).map(p => ({ ...p, selected: false }))
			setProofs(proofsDB)
		})()
	}, [selectedMint])
	// LN invoice expiry time
	useEffect(() => {
		if (timeLeft < 0) {
			setTimeLeft(0)
			return
		}
		if (timeLeft && timeLeft > 0) {
			setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
		}
	}, [timeLeft])
	return (
		<MyModal type='invoiceAmount' animation='slide' visible>
			<View style={styles.topContainer}>
				<Text style={globals(color, highlight).modalHeader}>
					Lightning payment request
				</Text>
				<Text style={[styles.amount, { color: hi[highlight] }]}>
					{formatInt(invoiceAmount)}
				</Text>
				<Text style={[styles.sat, { color: color.TEXT_SECONDARY }]}>
					Satoshi
				</Text>
				<Text style={[styles.expiry, { color: !timeLeft ? color.ERROR : color.TEXT }]}>
					{timeLeft > 0 ? formatExpiry(timeLeft) : 'Invoice expired!'}
				</Text>
				<View style={styles.pickerWrap}>
					{!mints.length &&
						<Text style={[styles.txt, { color: color.TEXT }]}>
							Found no mints
						</Text>
					}
					{mints.length > 0 && timeLeft > 0 &&
						<>
							<Text style={[styles.txt, { color: color.TEXT }]}>
								Select a mint to send from:
							</Text>
							<Picker
								selectedValue={selectedMint?.mintUrl}
								onValueChange={(value, _idx) => {
									void (async () => {
										const customName = await getMintName(value)
										setSelectedMint({ mintUrl: value, customName: customName || '' })
									})()
								}}
								dropdownIconColor={color.TEXT}
								style={styles.picker}
							>
								{mints.map(m => (
									<Picker.Item
										key={m.mintUrl}
										label={m.customName || formatMintUrl(m.mintUrl)}
										value={m.mintUrl}
										style={{ color: color.TEXT }}
									/>
								))}
							</Picker>
							<View style={[styles.mintOpts, { borderBottomColor: color.BORDER }]}>
								<Txt txt='Balance' />
								<View style={styles.mintBal}>
									<Text style={[styles.mintAmount, { color: color.TEXT }]}>
										{formatInt(mintBal)}
									</Text>
									<ZapIcon width={18} height={18} color={color.TEXT} />
								</View>
							</View>
							{invoiceAmount > 0 && mintBal >= invoiceAmount / 1000 &&
								<>
									<View style={styles.overview}>
										<Txt txt='Coin selection' />
										<Switch
											trackColor={{ false: color.INPUT_BG, true: hi[highlight] }}
											thumbColor={color.TEXT}
											onValueChange={toggleSwitch}
											value={isEnabled}
										/>
									</View>
									{getSelectedAmount(proofs) > 0 && isEnabled &&
										<CoinSelectionResume lnAmount={invoiceAmount} selectedAmount={getSelectedAmount(proofs)} />
									}
								</>
							}
						</>
					}
				</View>
			</View>
			<View style={styles.actions}>
				{mintBal >= invoiceAmount && mints.length > 0 && timeLeft > 0 &&
					<Button
						txt={loading ? 'Processing payment...' : 'Pay'}
						onPress={() => void handlePayment()}
					/>
				}
				{mints.length > 0 && mintBal < invoiceAmount && timeLeft > 0 &&
					<Text style={[styles.txt, { color: color.TEXT }]}>
						Not enough funds!
					</Text>
				}
				<View style={{ marginVertical: 10 }} />
				<Button
					txt='Cancel'
					outlined
					onPress={closeDetails}
				/>
			</View>
			{/* coin selection page */}
			{isEnabled &&
				<CoinSelectionModal
					mint={selectedMint}
					lnAmount={invoiceAmount}
					disableCS={() => setIsEnabled(false)}
					proofs={proofs}
					setProof={setProofs}
				/>
			}
			<PromptModal
				header={prompt.msg}
				visible={prompt.open}
				close={closePrompt}
			/>
		</MyModal>
	)
}

const styles = StyleSheet.create({
	topContainer: {
		alignItems: 'center',
		width: '100%',
	},
	amount: {
		fontSize: 40,
		fontWeight: '500',
	},
	txt: {
		fontSize: 20,
		fontWeight: '500',
		textAlign: 'center',
		marginBottom: 10
	},
	sat: {
		fontSize: 16,
	},
	pickerWrap: {
		width: '100%',
	},
	picker: {
		marginHorizontal: -15
	},
	mintOpts: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingTop: 5,
		paddingBottom: 15,
	},
	mintBal: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'flex-end',
	},
	mintAmount: {
		marginRight: 5
	},
	actions: {
		width: '100%'
	},
	expiry: {
		marginTop: 20,
		marginBottom: 40,
		fontSize: 20,
	},
	overview: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingTop: 15,
	},
})