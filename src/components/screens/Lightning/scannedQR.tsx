import Button from '@comps/Button'
import useLoading from '@comps/hooks/Loading'
import usePrompt from '@comps/hooks/Prompt'
import { ZapIcon } from '@comps/Icons'
import Toaster from '@comps/Toaster'
import Txt from '@comps/Txt'
import { getMintsBalances, getMintsUrls, getProofsByMintUrl } from '@db'
import { l } from '@log'
import MyModal from '@modal'
import type { IMintUrl, IProofSelection } from '@model'
import type { IDecodedLNInvoice } from '@model/ln'
import type { TQRScanPageProps } from '@model/nav'
import { Picker } from '@react-native-picker/picker'
import { CoinSelectionModal, CoinSelectionResume } from '@screens/Lightning/modal'
import { ThemeContext } from '@src/context/Theme'
import { addLnPaymentToHistory } from '@store/HistoryStore'
import { getCustomMintNames, getDefaultMint, getMintName } from '@store/mintStore'
import { globals, highlight as hi } from '@styles'
import { formatInt, formatMintUrl, formatSeconds, getSelectedAmount, isErr } from '@util'
import { payLnInvoice } from '@wallet'
import { useContext, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Switch, Text, View } from 'react-native'

interface IScannedQRProps {
	lnDecoded?: IDecodedLNInvoice
	closeDetails: () => void
	nav: TQRScanPageProps
}

// TODO adapt style
export default function ScannedQRDetails({ lnDecoded, closeDetails, nav }: IScannedQRProps) {
	const { t } = useTranslation(['common'])
	const { color, highlight } = useContext(ThemeContext)
	const { loading, startLoading, stopLoading } = useLoading()
	const { prompt, openPromptAutoClose } = usePrompt()
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
				openPromptAutoClose({ msg: t('invoiceErr') })
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
			openPromptAutoClose({ msg: isErr(e) ? e.message : t('invoicePayErr') })
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
		<MyModal type='invoiceAmount' animation='slide' visible close={closeDetails}>
			<View style={styles.topContainer}>
				<Text style={globals(color, highlight).modalHeader}>
					{t('lnPaymentReq')}
				</Text>
				<Text style={[styles.amount, { color: hi[highlight] }]}>
					{formatInt(invoiceAmount)}
				</Text>
				<Text style={[styles.sat, { color: color.TEXT_SECONDARY }]}>
					Satoshi
				</Text>
				<Text style={[styles.expiry, { color: !timeLeft ? color.ERROR : color.TEXT }]}>
					{timeLeft > 0 ? formatSeconds(timeLeft) : t('invoiceExpired')}
				</Text>
				<View style={styles.pickerWrap}>
					{!mints.length &&
						<Txt txt={t('noMint')} styles={[styles.txt, globals(color).navTxt]} />
					}
					{mints.length > 0 && timeLeft > 0 &&
						<>
							<Txt txt={t('selectMint') + ':'} styles={[styles.txt, globals(color).navTxt]} />
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
								<Txt txt={t('balance')} />
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
										<Txt txt={t('coinSelection')} />
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
						txt={loading ? t('processingPayment') + '...' : t('pay')}
						loading={loading}
						onPress={() => {
							if (loading) { return }
							void handlePayment()
						}}
					/>
				}
				{mints.length > 0 && mintBal < invoiceAmount && timeLeft > 0 &&
					<Txt txt={t('noFunds') + '!'} styles={[globals(color).navTxt, styles.txt]} />
				}
				<View style={{ marginVertical: 10 }} />
				<Button
					txt={t('cancel')}
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
			{prompt.open && <Toaster txt={prompt.msg} /> }
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