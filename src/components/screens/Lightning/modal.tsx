import Button from '@comps/Button'
import CoinSelectionRow from '@comps/coinSelectionRow'
import useLoading from '@comps/hooks/Loading'
import usePrompt from '@comps/hooks/Prompt'
import QR from '@comps/QR'
import Separator from '@comps/Separator'
import Success from '@comps/Success'
import Toaster from '@comps/Toaster'
import Txt from '@comps/Txt'
import { _mintUrl } from '@consts'
import { l } from '@log'
import MyModal from '@modal'
import type { IMintUrl, IProofSelection } from '@model'
import type { IInvoiceState } from '@model/ln'
import { FlashList } from '@shopify/flash-list'
import { ThemeContext } from '@src/context/Theme'
import { addToHistory } from '@store/HistoryStore'
import { dark, globals, highlight as hi, mainColors } from '@styles'
import { formatSeconds, getSelectedAmount, isErr, openUrl } from '@util'
import { getMintCurrentKeySetId, requestToken } from '@wallet'
import * as Clipboard from 'expo-clipboard'
import { useContext, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

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
	const { t } = useTranslation(['common'])
	const { color, highlight } = useContext(ThemeContext)
	const [expiry, setExpiry] = useState(invoice.decoded?.expiry ?? 600)
	const [expiryTime,] = useState(expiry * 1000 + Date.now())
	const [paid, setPaid] = useState('')
	const [copied, setCopied] = useState(false)
	const { prompt, openPromptAutoClose } = usePrompt()
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
						value: invoice.decoded?.paymentRequest ?? '',
						mints: [mintUrl],
					})
				}
				setPaid(success ? 'paid' : 'unpaid')
			} catch (e) {
				l(e)
				if (isErr(e)) {
					// TODO update this check
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
	}, [expiry, expiryTime])
	return (
		<MyModal
			type='invoiceAmount'
			animation='fade'
			visible={visible}
			success={paid === 'paid' || mintUrl === _mintUrl}
			close={close}
		>
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
							{invoice.decoded.paymentRequest.substring(0, 40) + '...' || t('smthWrong')}
						</Text>
					</View>
					<View>
						<Text style={[styles.lnExpiry, { color: expiry < 1 ? mainColors.ERROR : hi[highlight], fontSize: 28 }]}>
							{expiry > 0 ?
								formatSeconds(expiry)
								:
								t('invoiceExpired') + '!'
							}
						</Text>
						{expiry > 0 && !paid &&
							<TouchableOpacity onPress={handlePayment}>
								<Text style={[styles.checkPaymentTxt, { color: hi[highlight] }]}>
									{t('checkPayment')}
								</Text>
							</TouchableOpacity>
						}
						{paid === 'unpaid' &&
							<Text style={styles.pendingTxt}>
								{t('paymentPending')}...
							</Text>
						}
					</View>
					<View style={styles.lnBtnWrap}>
						<Button
							txt={copied ? t('copied') + '!' : t('copyInvoice')}
							outlined
							onPress={() => {
								void Clipboard.setStringAsync(invoice.decoded?.paymentRequest ?? '').then(() => {
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
							txt={t('payWithLn')}
							onPress={() => {
								void (async () => {
									await openUrl(`lightning:${invoice.decoded?.paymentRequest ?? ''}`)?.catch((err: unknown) =>
										openPromptAutoClose({ msg: isErr(err) ? err.message : t('deepLinkErr') }))
								})()
							}}
						/>
						<TouchableOpacity style={styles.closeBtn} onPress={close}>
							<Text style={globals(color, highlight).pressTxt}>
								{t('close')}
							</Text>
						</TouchableOpacity>
						{prompt.open && <Toaster success={prompt.success} txt={prompt.msg} />}
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
	const { t } = useTranslation(['common'])
	const { color, highlight } = useContext(ThemeContext)
	const [visible, setVisible] = useState(true)
	const [mintKeysetId, setMintKeysetId] = useState('')
	const { loading, startLoading, stopLoading } = useLoading()
	const cancelCoinSelection = () => {
		setVisible(false)
		disableCS()
	}
	// get the active keysetid of a mint once on initial render to compare with the proof keysets in the list
	useEffect(() => {
		if (!mint?.mintUrl) { return }
		void (async () => {
			startLoading()
			setMintKeysetId(await getMintCurrentKeySetId(mint.mintUrl))
			stopLoading()
		})()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [mint?.mintUrl])
	return (
		<MyModal type='invoiceAmount' animation='slide' visible={visible} close={cancelCoinSelection} hasNoPadding>
			<View style={styles.proofContainer}>
				<View style={styles.header}>
					<Text style={globals(color).navTxt}>
						{t('coinSelection')}
					</Text>
					<TouchableOpacity
						onPress={cancelCoinSelection}
					>
						<Text style={globals(color, highlight).pressTxt}>
							{t('cancel')}
						</Text>
					</TouchableOpacity>
				</View>
				<CoinSelectionResume lnAmount={lnAmount} selectedAmount={getSelectedAmount(proofs)} padding />
				<View style={{ paddingHorizontal: 20 }}>
					<ProofListHeader />
				</View>
				{!loading &&
					<View
						style={[
							globals(color).wrapContainer,
							{
								flex: 1,
								paddingHorizontal: 0,
								height: Math.floor(proofs.length * 56),
								// adds a margin bottom if the "confirm" button is visible
								marginBottom: getSelectedAmount(proofs) >= lnAmount ? 90 : 0
							},
						]}
					>
						<FlashList
							data={proofs}
							estimatedItemSize={300}
							showsVerticalScrollIndicator={false}
							contentContainerStyle={{ paddingHorizontal: 20 }}
							ItemSeparatorComponent={() => <Separator />}
							renderItem={data => (
								<CoinSelectionRow
									key={data.item.secret}
									proof={data.item}
									isLatestKeysetId={mintKeysetId === data.item.id}
									setChecked={() => {
										const proofIdx = proofs.findIndex(proof => proof.secret === data.item.secret)
										const updated = proofs.map((p, i) => proofIdx === i ? { ...p, selected: !p.selected } : p)
										setProof(updated)
									}}
								/>
							)}
						/>
					</View>
				}
			</View>
			{/* Confirm button */}
			{getSelectedAmount(proofs) >= lnAmount &&
				<View style={[styles.confirmWrap, { backgroundColor: color.BACKGROUND }]}>
					<Button
						txt={t('confirm')}
						onPress={() => setVisible(false)}
					/>
				</View>
			}
		</MyModal>
	)
}

interface IResume {
	lnAmount: number
	selectedAmount: number
	padding?: boolean
	estFee?: number
}

/**
 * This component shows the amount and the change of selected proofs in a pressable row of a proofs-list.
 */
export function CoinSelectionResume({ lnAmount, selectedAmount, padding, estFee }: IResume) {
	const { t } = useTranslation(['common'])
	const { color } = useContext(ThemeContext)
	const getChangeStr = () => {
		const change = selectedAmount - lnAmount
		if (estFee && estFee > 0) {
			return `${change} ${t('to')} ${change + estFee} Satoshi`
		}
		return `${change} Satoshi`
	}
	return (
		<>
			<View style={[styles.overview, {paddingHorizontal: padding ? 20 : 0}]}>
				<Txt txt={t('selected')} />
				<Text style={globals(color).txt}>
					<Txt txt={`${selectedAmount}`} styles={[{ color: selectedAmount < lnAmount ? mainColors.ERROR : color.TEXT }]} />/{lnAmount} Satoshi
				</Text>
			</View>
			{selectedAmount > lnAmount &&
				<View style={[styles.overview, {paddingHorizontal: padding ? 20 : 0}]}>
					<Txt txt={t('change')} />
					<Txt txt={getChangeStr()} />
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
export function ProofListHeader() {
	const { t } = useTranslation(['common'])
	const { color } = useContext(ThemeContext)
	return (
		<>
			<View style={styles.tableHeader}>
				<Text style={[styles.tableHead, { color: color.TEXT }]}>
					{t('amount')}
				</Text>
				<Text style={[styles.tableHead, { color: color.TEXT }]}>
					{t('keysetID')}
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
		flex: 1,
		width: '100%',
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: 20,
		marginBottom: 20,
	},
	overview: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginBottom: 20,
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
	tableHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingTop: 10,
		paddingBottom: 20,
		marginHorizontal: -20,
		paddingHorizontal: 20,
	},
	tableHead: {
		fontSize: 16,
		fontWeight: '500',
	},
	qrCodeWrap: {
		borderWidth: 5,
		borderColor: '#FFF'
	},
	confirmWrap: {
		position: 'absolute',
		bottom: 0,
		right: 0,
		left: 0,
		padding: 20,
	}
})