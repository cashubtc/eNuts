import Button from '@comps/Button'
import useLoading from '@comps/hooks/Loading'
import Loading from '@comps/Loading'
import Txt from '@comps/Txt'
import TxtInput from '@comps/TxtInput'
import { isIOS } from '@consts'
import type { TMeltInputfieldPageProps } from '@model/nav'
import TopNav from '@nav/TopNav'
import { usePromptContext } from '@src/context/Prompt'
import { useThemeContext } from '@src/context/Theme'
import { NS } from '@src/i18n'
import { globals } from '@styles'
import { decodeLnInvoice, getStrFromClipboard, isErr, isLnInvoice, isLnurl, openUrl } from '@util'
import { checkFees } from '@wallet'
import { createRef, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { KeyboardAvoidingView, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { ScaledSheet } from 'react-native-size-matters'

import { MeltOverview } from '../SelectAmount'

export default function InputfieldScreen({ navigation, route }: TMeltInputfieldPageProps) {
	const { mint, balance } = route.params
	const { t } = useTranslation([NS.common])
	const { openPromptAutoClose } = usePromptContext()
	const { color, highlight } = useThemeContext()
	const { loading, startLoading, stopLoading } = useLoading()
	const [input, setInput] = useState('')
	const inputRef = createRef<TextInput>()
	const [decodedAmount, setDecodedAmount] = useState(0)
	const [estFee, setEstFee] = useState(0)

	// Paste/Clear input for LNURL/LN invoice
	const handleInputLabelPress = async () => {
		// clear input
		if (input.length > 0) {
			setInput('')
			setDecodedAmount(0)
			return
		}
		// paste from clipboard
		const clipboard = await getStrFromClipboard()
		if (!clipboard) { return }
		setInput(clipboard)
		// pasted LNURL address which does not need decoding
		if (isLnurl(clipboard)) { return }
		// pasted LN invoice
		await handleInvoicePaste(clipboard)
	}

	const handleInvoicePaste = async (clipboard: string) => {
		try {
			startLoading()
			const { amount } = decodeLnInvoice(clipboard)
			setDecodedAmount(amount)
			const fee = await checkFees(mint.mintUrl, clipboard)
			setEstFee(fee)
			inputRef.current?.blur()
			stopLoading()
		} catch (e) {
			// invalid LN invoice
			stopLoading()
			openPromptAutoClose({ msg: t('invalidInvoice') })
			setInput('')
		}
	}

	const handleBtnPress = () => {
		if (loading) { return }
		// open user LN wallet
		if (!input.length) {
			return openUrl('lightning://')?.catch(e =>
				openPromptAutoClose({ msg: isErr(e) ? e.message : t('deepLinkErr') }))
		}
		// user pasted a LNURL, we need to get the amount by the user
		if (isLnurl(input)) {
			return navigation.navigate('selectAmount', { mint, balance, isMelt: true, lnurl: input })
		}
		// not enough funds
		if (decodedAmount + estFee > balance) {
			return openPromptAutoClose({ msg: t('noFunds') })
		}
		// user pasted a LN invoice before submitting
		try {
			// decode again in case the user changes the input after pasting it
			const { timeLeft } = decodeLnInvoice(input)
			// Invoice expired
			if (timeLeft <= 0) {
				setInput('')
				return openPromptAutoClose({ msg: t('expired') + '!' })
			}
			// navigate to coin selection screen
			navigation.navigate('coinSelection', {
				mint,
				balance,
				amount: decodedAmount,
				estFee,
				isMelt: true,
				recipient: input
			})
		} catch (e) {
			// invalid invoice
			openPromptAutoClose({ msg: t('invalidInvoice') })
		}
	}

	// auto-focus keyboard
	useEffect(() => {
		const t = setTimeout(() => {
			inputRef.current?.focus()
			clearTimeout(t)
		}, 200)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	return (
		<View style={[globals(color).container, styles.container]}>
			<TopNav
				screenName={t('cashOut')}
				withBackBtn
				handlePress={() => navigation.goBack()}
				mintBalance={balance}
				disableMintBalance
			/>
			<View>
				{!input.length &&
					<Txt styles={[styles.hint]} txt={t('meltInputHint', { ns: NS.mints })} />
				}
				{decodedAmount > 0 ?
					<>
						{loading ?
							<View style={styles.loadingWrap}>
								<Loading size={25} />
							</View>
							:
							<>
								<View style={[globals(color).wrapContainer, styles.overviewWrap]}>
									<MeltOverview
										amount={decodedAmount}
										balTooLow={decodedAmount + estFee > balance}
										fee={estFee}
										isInvoice
									/>
								</View>
								<Txt
									txt={'* ' + t('cashOutAmountHint', { ns: NS.mints })}
									styles={[styles.feeHint, { color: color.TEXT_SECONDARY }]}
								/>
							</>
						}
					</>
					:
					null
				}
			</View>
			<KeyboardAvoidingView
				behavior={isIOS ? 'padding' : undefined}
				style={styles.paddingHorizontal}
			>
				<View style={{ position: 'relative' }}>
					<TxtInput
						innerRef={inputRef}
						keyboardType='email-address'
						placeholder={t('invoiceOrLnurl')}
						value={input}
						onChangeText={text => {
							setInput(text)
							if (isLnInvoice(text)) {
								void handleInvoicePaste(text)
							}
						}}
						onSubmitEditing={() => void handleBtnPress()}
						autoFocus
						ms={200}
					/>
					{/* Paste / Clear Input */}
					<TouchableOpacity
						style={[styles.pasteInputTxtWrap, { backgroundColor: color.INPUT_BG }]}
						onPress={() => void handleInputLabelPress()}
					>
						<Text style={globals(color, highlight).pressTxt}>
							{!input.length ? t('paste') : t('clear')}
						</Text>
					</TouchableOpacity>
				</View>
				<Button
					outlined={!input.length}
					disabled={loading}
					txt={input.length ? t('continue') : t('createViaLn')}
					onPress={() => void handleBtnPress()}
					icon={loading ? <Loading size={20} /> : undefined}
				/>
			</KeyboardAvoidingView>
		</View>
	)
}

const styles = ScaledSheet.create({
	container: {
		flexDirection: 'column',
		justifyContent: 'space-between',
		paddingBottom: isIOS ? '50@vs' : '20@vs',
		paddingTop: '90@vs',
	},
	hint: {
		paddingHorizontal: '20@s',
		marginBottom: '20@vs',
		fontWeight: '500',
	},
	feeHint: {
		fontSize: '10@vs',
		paddingHorizontal: '20@s',
		marginTop: '10@vs',
	},
	pasteInputTxtWrap: {
		position: 'absolute',
		right: '10@s',
		top: '10@vs',
		padding: '10@s',
	},
	overviewWrap: {
		width: '100%',
		paddingVertical: '20@vs',
		paddingBottom: '20@vs',
		marginBottom: 0
	},
	paddingHorizontal: {
		paddingHorizontal: '20@s'
	},
	loadingWrap: {
		marginTop: '40@vs',
	}
})