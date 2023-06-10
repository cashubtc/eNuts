import { getDecodedLnInvoice } from '@cashu/cashu-ts'
import Button from '@comps/Button'
import useLoading from '@comps/hooks/Loading'
import type { IDecodedLNInvoice } from '@model/ln'
import { InvoiceAmountModal, InvoiceModal } from '@pages/Lightning/modal'
import { ThemeContext } from '@src/context/Theme'
import { globals, highlight as hi } from '@styles'
import { vib } from '@util'
import { requestMint } from '@wallet'
import { createRef, useContext, useEffect, useState } from 'react'
import { Animated, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'

import { useShakeAnimation } from './animation/Shake'

interface IInvoiceModalProps {
	lnAmountModal: boolean
	mintUrl: string
	setLNAmountModal: (val: boolean) => void
}

export interface IInvoiceState {
	amount: string
	decoded?: IDecodedLNInvoice
	hash: string
}

export default function LNInvoiceAmountModal({
	lnAmountModal,
	mintUrl,
	setLNAmountModal,
}: IInvoiceModalProps) {
	const { anim, shake } = useShakeAnimation()
	const { color, highlight } = useContext(ThemeContext)
	// workaround: amount input ref for auto-focus (input property "autoFocus" does not work here)
	const inputRef = createRef<TextInput>()
	// invoice modal
	const [showInvoice, setShowInvoice] = useState(false)
	// invoice state
	const [invoice, setInvoice] = useState<IInvoiceState>({
		amount: '',
		hash: ''
	})
	const { loading, startLoading, stopLoading } = useLoading()
	// invoice amount error
	const [err, setErr] = useState(false)
	// add tokens to the mint
	const handleAmountSubmit = () => {
		if (loading) { return }
		// shake animation
		if (!invoice.amount || +invoice.amount < 1) {
			vib(400)
			setErr(true)
			shake()
			const t = setTimeout(() => {
				setErr(false)
				clearTimeout(t)
			}, 500)
			return
		}
		void (async () => {
			startLoading()
			const resp = await requestMint(mintUrl, +invoice.amount)
			const decoded = getDecodedLnInvoice(resp.pr)
			setInvoice({ ...invoice, decoded, hash: resp.hash })
			setShowInvoice(true)
			setLNAmountModal(false)
			stopLoading()
		})()
	}
	// auto-focus numeric keyboard
	useEffect(() => {
		if (!lnAmountModal) { return }
		const t = setTimeout(() => {
			inputRef.current?.focus()
			clearTimeout(t)
		}, 100)
	}, [lnAmountModal])

	return (
		<>
			<InvoiceAmountModal visible={lnAmountModal} >
				<Animated.View style={[styles.invoiceAmountWrap, { transform: [{ translateX: anim.current }] }]}>
					<TextInput
						keyboardType='numeric' // Platform.OS === 'android' ? 'number-pad' : 'numeric'
						placeholder='0'
						placeholderTextColor={err ? color.ERROR : hi[highlight]}
						style={[styles.invoiceAmount, { color: hi[highlight] }]}
						caretHidden
						ref={inputRef}
						onChangeText={amount => setInvoice({ ...invoice, amount })}
						onSubmitEditing={handleAmountSubmit}
						maxLength={8}
					/>
					<Text style={[globals(color).modalTxt, { color: color.TEXT_SECONDARY }]}>
						Satoshi
					</Text>
				</Animated.View>
				<View style={styles.invoiceBtns}>
					<Button
						txt={loading ? 'Invoice incoming...' : 'Create invoice'}
						onPress={handleAmountSubmit}
					/>
					<TouchableOpacity onPress={() => setLNAmountModal(false)}>
						<Text style={[styles.cancel, { color: hi[highlight] }]}>
							Cancel
						</Text>
					</TouchableOpacity>
				</View>
			</InvoiceAmountModal>
			<InvoiceModal
				invoice={invoice}
				visible={showInvoice}
				mintUrl={mintUrl}
				close={() => setShowInvoice(false)}
			/>
		</>

	)
}

const styles = StyleSheet.create({
	invoiceAmountWrap: {
		width: '100%',
		alignItems: 'center',
		marginTop: 50,
	},
	invoiceAmount: {
		fontSize: 40,
		width: '100%',
		textAlign: 'center',
	},
	invoiceBtns: {
		width: '100%',
		alignItems: 'center',
	},
	cancel: {
		fontSize: 16,
		fontWeight: '500',
		marginTop: 25,
		marginBottom: 10,
	},
})