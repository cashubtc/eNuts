import Button from '@comps/Button'
import useLoading from '@comps/hooks/Loading'
import usePrompt from '@comps/hooks/Prompt'
import { ZapIcon } from '@comps/Icons'
import { getMintsBalances, getMintsUrls, getProofsByMintUrl } from '@db'
import { l } from '@log'
import MyModal from '@modal'
import { PromptModal } from '@modal/Prompt'
import { IMintUrl, IProofSelection } from '@model'
import { IDecodedLNInvoice } from '@model/ln'
import { TQRScanPageProps } from '@model/nav'
import { CoinSelectionModal, CoinSelectionResume } from '@pages/Lightning/modal'
import { Picker } from '@react-native-picker/picker'
import { ThemeContext } from '@src/context/Theme'
import { addLnPaymentToHistory } from '@store/HistoryStore'
import { getDefaultMint } from '@store/mintStore'
import { globals, highlight as hi } from '@styles'
import { formatExpiry, formatInt, formatMintUrl, getSelectedAmount } from '@util'
import { payLnInvoice } from '@wallet'
import { useContext, useEffect, useState } from 'react'
import { StyleSheet, Switch, Text, View } from 'react-native'

interface IScannedQRProps {
	lnDecoded?: IDecodedLNInvoice
	closeDetails: () => void
	nav: TQRScanPageProps
}

export default function ScannedQRDetails({ lnDecoded, closeDetails, nav }: IScannedQRProps) {
	const { color, highlight } = useContext(ThemeContext)
	const { loading, startLoading, stopLoading } = useLoading()
	const { prompt, openPrompt, closePrompt } = usePrompt()
	// user mints
	const [mints, setMints] = useState<IMintUrl[]>([])
	const [selectedMint, setSelectedMint] = useState('')
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
		if (!lnDecoded) { return }
		startLoading()
		const selectedProofs = proofs.filter(p => p.selected)
		try {
			const res = await payLnInvoice(selectedMint, lnDecoded.paymentRequest, selectedProofs)
			stopLoading()
			if (!res.result?.isPaid) {
				openPrompt('Invoice could not be payed. Please try again later.')
				return
			}
			// payment success, add as history entry
			await addLnPaymentToHistory(
				res,
				[selectedMint],
				-invoiceAmount,
				lnDecoded.paymentRequest
			)
			nav.navigation.navigate('success', { amount: invoiceAmount + res.realFee, fee: res.realFee, mints: [selectedMint] })
		} catch (e) {
			l(e)
			openPrompt(e instanceof Error ? e.message : 'An error occured while paying the invoice.')
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
			const userMints = await getMintsUrls()
			setMints(userMints)
			if (!userMints.length) { return }
			// set first selected mint
			const defaultMint = await getDefaultMint()
			if (!defaultMint) {
				setSelectedMint(userMints[0].mint_url)
				return
			}
			for (const mint of userMints) {
				if (mint.mint_url === defaultMint) {
					setSelectedMint(mint.mint_url)
				}
			}
		})()

	}, [])
	// update mint balance after picking mint
	useEffect(() => {
		void (async () => {
			const mintsBals = await getMintsBalances()
			mintsBals.forEach(m => {
				if (m.mint_url === selectedMint) {
					setMintBal(m.amount)
				}
			})
			// proofs
			const proofsDB = (await getProofsByMintUrl(selectedMint)).map(p => ({ ...p, selected: false }))
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
								selectedValue={selectedMint}
								onValueChange={(value, _idx) => setSelectedMint(value)}
								dropdownIconColor={color.TEXT}
								style={styles.picker}
							>
								{mints.map(m => (
									<Picker.Item
										key={m.mint_url}
										label={formatMintUrl(m.mint_url)}
										value={m.mint_url}
										style={{ color: color.TEXT }}
									/>
								))}
							</Picker>
							<View style={[styles.mintOpts, { borderBottomColor: color.BORDER }]}>
								<Text style={globals(color).txt}>
									Balance
								</Text>
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
										<Text style={globals(color).txt}>
											Coin selection
										</Text>
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