import Button from '@comps/Button'
import CoinSelectionRow from '@comps/coinSelectionRow'
import { IInvoiceState } from '@comps/InvoiceAmount'
import QR from '@comps/QR'
import Success from '@comps/Success'
import { l } from '@log'
import MyModal from '@modal'
import { IMintUrl, IProofSelection } from '@model'
import { ThemeContext } from '@src/context/Theme'
import { addToHistory } from '@store/HistoryStore'
import { dark, globals, highlight as hi } from '@styles'
import { formatExpiry, formatMintUrl, getSelectedAmount, openUrl } from '@util'
import { _mintUrl, requestToken } from '@wallet'
import * as Clipboard from 'expo-clipboard'
import React, { useContext, useEffect, useState } from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'

interface IInvoiceAmountModalProps {
	visible: boolean
	children: React.ReactNode
}

export function InvoiceAmountModal({ visible, children }: IInvoiceAmountModalProps) {
	return (
		<MyModal type='invoiceAmount' animation='slide' visible={visible}>
			{children}
		</MyModal>
	)
}

interface IInvoiceModalProps {
	visible: boolean
	invoice: IInvoiceState
	mintUrl: string
	close: () => void
}

export function InvoiceModal({ visible, invoice, mintUrl, close }: IInvoiceModalProps) {
	const { color, highlight } = useContext(ThemeContext)
	const [expiry, setExpiry] = useState(invoice.decoded?.expiry || 600)
	const [expiryTime,] = useState(expiry * 1000 + Date.now())
	const [paid, setPaid] = useState('')
	const [copied, setCopied] = useState(false)
	const handlePayment = () => {
		// state "unpaid" is temporary to prevent btn press spam
		if (paid === 'unpaid') { return }
		void (async () => {
			try {
				const { success } = await requestToken(mintUrl, +invoice.amount, invoice.hash)
				if (success) {
					// add as history entry
					await addToHistory({
						amount: +invoice.amount,
						type: 2,
						value: invoice.decoded?.paymentRequest || '',
						mints: [mintUrl],
					})
				}
				setPaid(success ? 'paid' : 'unpaid')
			} catch (e) {
				l(e)
				if (e instanceof Error) {
					if (e.message === 'Tokens already issued for this invoice.') {
						setPaid('paid')
						return
					}
				}
				setPaid('unpaid')
				// reset state
				setTimeout(() => setPaid(''), 3000)
			}
		})()
	}
	useEffect(() => {
		const timeLeft = Math.ceil((expiryTime - Date.now()) / 1000)
		if (timeLeft < 0) {
			setExpiry(0)
			return
		}
		if (expiry && expiry > 0) {
			setTimeout(() => setExpiry(timeLeft - 1), 1000)
		}
	}, [expiry])
	return (
		<MyModal type='invoiceAmount' animation='fade' visible={visible} success={paid === 'paid' || mintUrl === _mintUrl}>
			{invoice.decoded && mintUrl !== _mintUrl && (!paid || paid === 'unpaid') ?
				<View style={styles.container}>
					<View style={styles.invoiceWrap}>
						<View style={color.BACKGROUND === dark.colors.background ? styles.qrCodeWrap : undefined}>
							<QR
								size={275}
								value={invoice.decoded.paymentRequest}
								onError={() => l('Error while generating the LN QR code')}
							/>
						</View>
						<Text style={[styles.lnAddress, { color: color.TEXT }]}>
							{invoice.decoded.paymentRequest.substring(0, 40) + '...' || 'Something went wrong'}
						</Text>
					</View>
					<View>
						<Text style={[styles.lnExpiry, { color: expiry < 1 ? color.ERROR : hi[highlight], fontSize: 28 }]}>
							{expiry > 0 ?
								formatExpiry(expiry)
								:
								<Text>Invoice expired!</Text>
							}
						</Text>
						{expiry > 0 && !paid &&
							<TouchableOpacity onPress={handlePayment}>
								<Text style={[styles.checkPaymentTxt, { color: hi[highlight] }]}>
									Check payment
								</Text>
							</TouchableOpacity>
						}
						{paid === 'unpaid' &&
							<Text style={styles.pendingTxt}>
								Payment pending...
							</Text>
						}
					</View>
					<View style={styles.lnBtnWrap}>
						<Button
							txt={copied ? 'Copied!' : 'Copy invoice'}
							outlined
							onPress={() => {
								void Clipboard.setStringAsync(invoice.decoded?.paymentRequest || '').then(() => {
									setCopied(true)
									const t = setTimeout(() => {
										setCopied(false)
										clearTimeout(t)
									}, 3000)
								})
							}}
						/>
						<View style={{ marginBottom: 20 }} />
						<Button
							txt='Pay with your LN wallet'
							onPress={() => {
								void (async () => {
									await openUrl(`lightning:${invoice.decoded?.paymentRequest || ''}`)
								})()
							}}
						/>
						<TouchableOpacity style={styles.closeBtn} onPress={close}>
							<Text style={globals(color, highlight).pressTxt}>
								Close
							</Text>
						</TouchableOpacity>
					</View>
				</View>
				:
				<Success amount={+invoice.amount} mint={mintUrl} hash={invoice.hash} />
			}
		</MyModal>
	)
}

interface ICoinSelectionProps {
	mint?: IMintUrl
	lnAmount: number
	disableCS: () => void
	proofs: IProofSelection[]
	setProof: (proofs: IProofSelection[]) => void
}

/**
 * This component is the main container of the pressable proofs-list aka coin selection list.
 */
export function CoinSelectionModal({ mint, lnAmount, disableCS, proofs, setProof }: ICoinSelectionProps) {
	const { color } = useContext(ThemeContext)
	const [visible, setVisible] = useState(true)
	return (
		<MyModal type='invoiceAmount' animation='slide' visible={visible}>
			<View style={styles.proofContainer}>
				<Text style={globals(color).header}>
					Coin selection
				</Text>
				<Text style={[styles.mintUrl, { color: color.TEXT_SECONDARY }]}>
					{formatMintUrl(mint?.customName || mint?.mintUrl || 'Not available')}
				</Text>
				<ProofListHeader margin={40} />
				<ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
					{lnAmount > 0 &&
						proofs.map(p => (
							<CoinSelectionRow
								proof={p}
								key={p.secret}
								setChecked={() => {
									const proofIdx = proofs.findIndex(proof => proof.secret === p.secret)
									const updated = proofs.map((p, i) => proofIdx === i ? { ...p, selected: !p.selected } : p)
									setProof(updated)
								}}
							/>
						))
					}
					<View style={{ marginVertical: 25, borderBottomColor: color.BORDER, borderBottomWidth: 1 }} />
					<CoinSelectionResume lnAmount={lnAmount} selectedAmount={getSelectedAmount(proofs)} />
					<View style={{ marginVertical: 10 }} />
					{getSelectedAmount(proofs) >= lnAmount &&
						<Button
							txt='Confirm'
							onPress={() => setVisible(false)}
						/>
					}
					<View style={{ marginVertical: 10 }} />
					<Button
						txt='Cancel'
						outlined
						onPress={() => {
							setVisible(false)
							disableCS()
						}}
					/>
					<View style={{ marginVertical: 10 }} />
				</ScrollView>
			</View>
		</MyModal>
	)
}

interface IResume {
	lnAmount: number
	selectedAmount: number
}

/**
 * This component shows the amount and the change of selected proofs in a pressable row of a proofs-list.
 */
export function CoinSelectionResume({ lnAmount, selectedAmount }: IResume) {
	const { color } = useContext(ThemeContext)
	return (
		<>
			<View style={styles.overview}>
				<Text style={globals(color).txt}>
					Selected
				</Text>
				<Text style={globals(color).txt}>
					{selectedAmount}/{lnAmount} Sat
				</Text>
			</View>
			{selectedAmount > lnAmount &&
				<View style={styles.overview}>
					<Text style={globals(color).txt}>
						Change
					</Text>
					<Text style={globals(color).txt}>
						{selectedAmount - lnAmount} Sat
					</Text>
				</View>
			}
		</>
	)
}

/**
 * A component that shows the header of the proofs-list.
 * Margin is used for the pressable coin-selection row.
 * If the row of the proofs-list is non-pressable, margin is not required.
 */
export function ProofListHeader({ margin }: { margin?: number }) {
	const { color } = useContext(ThemeContext)
	return (
		<>
			<View style={[styles.tableHeader, { borderBottomColor: color.BORDER }]}>
				<Text style={[styles.tableHead, { color: color.TEXT }]}>
					Amount
				</Text>
				<Text style={[styles.tableHead, { color: color.TEXT, marginRight: margin || 0 }]}>
					Keyset ID
				</Text>
			</View>
		</>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'space-between',
		width: '100%',
	},
	proofContainer: {
		width: '100%',
	},
	overview: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginBottom: 15,
	},
	mintUrl: {
		fontSize: 16,
		marginRight: 10,
		marginBottom: 15,
	},
	invoiceWrap: {
		alignItems: 'center',
	},
	lnAddress: {
		fontSize: 14,
		marginTop: 20,
	},
	lnExpiry: {
		fontSize: 36,
		fontWeight: '600',
		textAlign: 'center',
	},
	lnBtnWrap: {
		width: '100%'
	},
	checkPaymentTxt: {
		fontSize: 16,
		fontWeight: '500',
		marginTop: 10,
		textAlign: 'center',
	},
	pendingTxt: {
		fontSize: 16,
		fontWeight: '500',
		color: '#F1C232',
		marginTop: 10,
		textAlign: 'center',
	},
	closeBtn: {
		width: '100%',
		marginBottom: 10,
		marginVertical: 25,
	},
	scroll: {
		marginBottom: 140,
	},
	tableHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingTop: 10,
		paddingBottom: 20,
		marginHorizontal: -20,
		paddingHorizontal: 20,
		borderBottomWidth: 1,
	},
	tableHead: {
		fontSize: 16,
		fontWeight: '500',
	},
	qrCodeWrap: {
		borderWidth: 5,
		borderColor: '#FFF'
	},
})