import { useShakeAnimation } from '@comps/animation/Shake'
import Button from '@comps/Button'
import Loading from '@comps/Loading'
import Screen from '@comps/Screen'
import Separator from '@comps/Separator'
import Txt from '@comps/Txt'
import { isIOS } from '@consts'
import { l } from '@log'
import type { TSelectAmountPageProps } from '@model/nav'
import { usePromptContext } from '@src/context/Prompt'
import { useThemeContext } from '@src/context/Theme'
import { NS } from '@src/i18n'
import { globals, highlight as hi, mainColors } from '@styles'
import { cleanUpNumericStr, formatInt, formatSatStr, getInvoiceFromLnurl, vib } from '@util'
import { checkFees, requestMint } from '@wallet'
import { createRef, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Animated, KeyboardAvoidingView, StyleSheet, TextInput, View } from 'react-native'

export default function SelectAmountScreen({ navigation, route }: TSelectAmountPageProps) {
	const { mint, balance, lnurl, isMelt, isSendEcash, nostr, isSwap, targetMint } = route.params
	const { openPromptAutoClose } = usePromptContext()
	const { t } = useTranslation([NS.wallet])
	const { color, highlight } = useThemeContext()
	const { anim, shake } = useShakeAnimation()
	const inputRef = createRef<TextInput>()
	const [amount, setAmount] = useState('')
	// invoice amount too low
	const [err, setErr] = useState(false)
	const [shouldEstimate, setShouldEstimate] = useState(false)
	const [fee, setFee] = useState({ estimation: 0, isCalculating: false })

	const balTooLow = (isMelt || isSwap) && +amount + fee.estimation > balance

	const isSendingWholeMintBal = () => {
		// includes fee
		if (isMelt && +amount + fee.estimation === balance) { return true }
		// without fee
		if (isSendEcash && +amount === balance) { return true }
		return false
	}

	// navigation screen name
	const getScreenName = () => {
		if (isMelt) { return 'cashOut' }
		if (isSwap) { return 'multimintSwap' }
		if (isSendEcash) { return 'sendEcash' }
		return 'createInvoice'
	}

	const handleFeeEstimation = async (lnurl: string) => {
		setFee(prev => ({ ...prev, isCalculating: true }))
		try {
			// check fee for payment to lnurl
			if (lnurl.length) {
				const lnurlInvoice = await getInvoiceFromLnurl(lnurl, +amount)
				if (!lnurlInvoice?.length) {
					openPromptAutoClose({ msg: t('feeErr', { ns: NS.common, input: lnurl }) })
					setFee(prev => ({ ...prev, isCalculating: false }))
					return
				}
				const estFee = await checkFees(mint.mintUrl, lnurlInvoice)
				setFee({ estimation: estFee, isCalculating: false })
				setShouldEstimate(false)
				return
			}
			// check fee for multimint swap
			if (isSwap && targetMint?.mintUrl.length) {
				const { pr } = await requestMint(targetMint.mintUrl, +amount)
				// const invoice = await getInvoice(hash)
				const estFee = await checkFees(mint.mintUrl, pr)
				setFee({ estimation: estFee, isCalculating: false })
				setShouldEstimate(false)
			}
		} catch (e) {
			l(e)
			openPromptAutoClose({ msg: t('requestMintErr', { ns: NS.error }) })
			setFee(prev => ({ ...prev, isCalculating: false }))
		}
	}

	const getActionBtnTxt = () => {
		if (!isMelt && !isSwap && !isSendEcash) { return t('continue', { ns: NS.common }) }
		if (fee.isCalculating) { return t('calculateFeeEst', { ns: NS.common }) }
		if (balTooLow) { return t('balTooLow', { ns: NS.common }) }
		return t(shouldEstimate ? 'estimateFee' : 'continue', { ns: NS.common })
	}

	const handleAmountSubmit = async () => {
		if (fee.isCalculating || balTooLow) { return }
		const isSendingTX = isSendEcash || isMelt || isSwap
		// error & shake animation if amount === 0 or greater than mint balance
		if (!amount || +amount < 1 || (isSendingTX && +amount > balance)) {
			vib(400)
			setErr(true)
			shake()
			const t = setTimeout(() => {
				setErr(false)
				clearTimeout(t)
			}, 500)
			return
		}
		// estimate melting/swap fee
		if (!isSendEcash && shouldEstimate && (lnurl?.length || isSwap)) {
			await handleFeeEstimation(lnurl || '')
			return
		}
		// send ecash / melt / swap
		if (isSendingTX) {
			// Check if user melts/swaps his whole mint balance, so there is no need for coin selection and that can be skipped here
			if (!isSendEcash && isSendingWholeMintBal()) {
				navigation.navigate('processing', {
					mint,
					amount: +amount,
					estFee: fee.estimation,
					isMelt,
					isSendEcash,
					isSwap,
					targetMint,
					recipient: lnurl
				})
				return
			}
			// optional memo
			if (isSendEcash) {
				navigation.navigate('memoScreen', {
					mint,
					balance,
					amount: +amount,
					nostr,
					isSendingWholeMintBal: !nostr && isSendingWholeMintBal()
				})
				return
			}
			navigation.navigate('coinSelection', {
				mint,
				balance,
				amount: +amount,
				estFee: fee.estimation,
				isMelt,
				isSendEcash,
				isSwap,
				targetMint,
				recipient: lnurl
			})
			return
		}
		// request new token from mint
		navigation.navigate('processing', { mint, amount: +amount })
	}

	// auto-focus numeric keyboard
	useEffect(() => {
		const t = setTimeout(() => {
			inputRef.current?.focus()
			clearTimeout(t)
		}, 200)
	}, [inputRef])

	// check if is melting process
	useEffect(() => setShouldEstimate(!isSendEcash), [isSendEcash])

	// estimate fee each time the melt or swap amount changes
	useEffect(() => {
		if (isSendEcash) { return }
		setFee({ estimation: 0, isCalculating: false })
		setShouldEstimate(true)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [amount])

	return (
		<Screen
			screenName={t(getScreenName(), { ns: NS.common })}
			withBackBtn
			handlePress={() => navigation.goBack()}
			mintBalance={formatInt(balance)}
			disableMintBalance={isMelt || isSwap}
			handleMintBalancePress={() => {
				if (isSendEcash) { setAmount(`${balance}`) }
			}}
		>
			{!isMelt && !isSwap &&
				<Txt
					txt={t(isSendEcash ? 'ecashAmountHint' : 'invoiceAmountHint', { ns: NS.mints })}
					styles={[styles.headerHint]}
				/>
			}
			<View style={[styles.overviewWrap, { marginTop: isMelt || isSwap ? 0 : 20 }]}>
				<Animated.View style={[styles.amountWrap, { transform: [{ translateX: anim.current }] }]}>
					<TextInput
						keyboardType='numeric'
						ref={inputRef}
						placeholder='0'
						placeholderTextColor={err ? mainColors.ERROR : hi[highlight]}
						style={[globals().selectAmount, { color: err ? mainColors.ERROR : hi[highlight] }]}
						caretHidden
						onChangeText={amount => setAmount(cleanUpNumericStr(amount))}
						onSubmitEditing={() => void handleAmountSubmit()}
						value={amount}
						maxLength={8}
					/>
				</Animated.View>
				<Txt
					txt={formatSatStr(+amount, 'standard', false)}
					styles={[{ color: color.TEXT_SECONDARY, fontSize: 14, textAlign: 'center', marginLeft: -4 }]}
				/>
				{(isMelt || isSwap) &&
					<>
						<Separator style={[{ marginVertical: 20 }]} />
						<MeltOverview
							amount={+amount}
							shouldEstimate={shouldEstimate}
							balTooLow={balTooLow}
							fee={fee.estimation}
						/>
						<Txt
							txt={'* ' + t('cashOutAmountHint', { ns: NS.mints })}
							styles={[styles.feeHint, { color: color.TEXT_SECONDARY }]}
						/>
					</>
				}
			</View>
			<KeyboardAvoidingView
				behavior={isIOS ? 'padding' : undefined}
				style={styles.continue}
			>
				<Button
					txt={getActionBtnTxt()}
					outlined={shouldEstimate}
					onPress={() => void handleAmountSubmit()}
					disabled={balTooLow}
					icon={fee.isCalculating ? <Loading color={hi[highlight]} /> : undefined}
				/>
			</KeyboardAvoidingView>
		</Screen>
	)
}

interface IMeltOverviewProps {
	amount: number
	shouldEstimate?: boolean
	balTooLow?: boolean
	isInvoice?: boolean
	fee: number
}

export function MeltOverview({ amount, shouldEstimate, balTooLow, isInvoice, fee }: IMeltOverviewProps) {
	const { t } = useTranslation([NS.common])
	const { color } = useThemeContext()
	return (
		<View style={styles.overview}>
			<Txt
				txt={t(isInvoice ? 'invoiceInclFee' : 'totalInclFee', { ns: NS.common }) + '*'}
				styles={[styles.bold]}
			/>
			<Txt
				txt={formatSatStr(shouldEstimate ? 0 : amount + fee)}
				styles={[{ color: !shouldEstimate && balTooLow ? mainColors.ERROR : shouldEstimate ? color.TEXT : mainColors.VALID }]}
			/>
		</View>
	)
}

const styles = StyleSheet.create({
	headerHint: {
		paddingHorizontal: 20,
		marginBottom: 20,
		fontWeight: '500'
	},
	amountWrap: {
		width: '100%',
		alignItems: 'center',
	},
	amount: {
		fontSize: 46,
		width: '100%',
		textAlign: 'center',
		marginBottom: 5,
	},
	continue: {
		flex: 1,
		position: 'absolute',
		right: 20,
		left: 20,
		bottom: 20,
		alignItems: 'center'
	},
	overviewWrap: {
		width: '100%',
		paddingHorizontal: 20,
	},
	overview: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	feeHint: {
		fontSize: 12,
		marginTop: 10,
	},
	/* actionBtn: {
		padding: 20,
		flexDirection: 'row',
		alignItems: 'center',
	}, */
	bold: {
		fontWeight: '500'
	}
})