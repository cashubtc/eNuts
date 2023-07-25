import { useShakeAnimation } from '@comps/animation/Shake'
import Container from '@comps/Container'
import usePrompt from '@comps/hooks/Prompt'
import Loading from '@comps/Loading'
import Separator from '@comps/Separator'
import Toaster from '@comps/Toaster'
import Txt from '@comps/Txt'
import { isIOS } from '@consts'
import type { TSelectAmountPageProps } from '@model/nav'
import TopNav from '@nav/TopNav'
import { ThemeContext } from '@src/context/Theme'
import { globals, highlight as hi, mainColors } from '@styles'
import { cleanUpNumericStr, getInvoiceFromLnurl, vib } from '@util'
import { checkFees } from '@wallet'
import { createRef, useContext, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Animated, KeyboardAvoidingView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native'

export default function SelectAmountScreen({ navigation, route }: TSelectAmountPageProps) {
	const { mint, balance, lnurl, isMelt, isSendEcash, isSwap, targetMint } = route.params
	const { t } = useTranslation(['wallet'])
	const { color, highlight } = useContext(ThemeContext)
	const { anim, shake } = useShakeAnimation()
	const inputRef = createRef<TextInput>()
	const [amount, setAmount] = useState('')
	// invoice amount too low
	const [err, setErr] = useState(false)
	const [shouldEstimate, setShouldEstimate] = useState(false)
	const [fee, setFee] = useState({
		estimation: 0,
		isCalculating: false
	})
	const { prompt, openPromptAutoClose } = usePrompt()
	const balTooLow = isMelt && +amount + fee.estimation > balance
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
		const invoice = await getInvoiceFromLnurl(lnurl, +amount)
		if (!invoice?.length) {
			openPromptAutoClose({ msg: t('feeErr', { ns: 'common', input: lnurl }) })
			setFee(prev => ({ ...prev, isCalculating: false }))
			return
		}
		const estFee = await checkFees(targetMint?.mintUrl || mint.mintUrl, invoice)
		setFee({ estimation: estFee, isCalculating: false })
		setShouldEstimate(false)
	}
	const getActionBtnTxt = () => {
		if (!isMelt && !isSwap && !isSendEcash) { return t('continue', { ns: 'common' }) }
		if (fee.isCalculating) { return t('calculateFeeEst', { ns: 'common' }) }
		if (balTooLow) { return t('balTooLow', { ns: 'common' }) }
		return t(shouldEstimate ? 'estimateFee' : 'continue', { ns: 'common' })
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
		// estimate melting fee
		if (!isSendEcash && shouldEstimate && lnurl?.length) {
			await handleFeeEstimation(lnurl)
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
					isSendingWholeMintBal: isSendingWholeMintBal()
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
	// estimate fee each time the melt amount changes
	useEffect(() => {
		if (!isMelt || !isSwap) { return }
		setFee({ estimation: 0, isCalculating: false })
		setShouldEstimate(true)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [amount])
	return (
		<Container>
			<TopNav
				screenName={t(getScreenName(), { ns: 'common' })}
				withBackBtn
				handlePress={() => navigation.goBack()}
			/>
			{!isMelt && !isSwap &&
				<Txt txt={t(isSendEcash ? 'ecashAmountHint' : 'invoiceAmountHint', { ns: 'mints' })} styles={[styles.headerHint]} />
			}
			<View style={[globals(color).wrapContainer, styles.overviewWrap]}>
				<Animated.View style={[styles.amountWrap, { transform: [{ translateX: anim.current }] }]}>
					<TextInput
						keyboardType='numeric'
						ref={inputRef}
						placeholder='0'
						placeholderTextColor={err ? mainColors.ERROR : hi[highlight]}
						style={[styles.amount, { color: err ? mainColors.ERROR : hi[highlight] }]}
						cursorColor={hi[highlight]}
						onChangeText={amount => setAmount(cleanUpNumericStr(amount))}
						onSubmitEditing={() => void handleAmountSubmit()}
						value={amount}
						maxLength={8}
					/>
				</Animated.View>
				{(isMelt || isSwap || isSendEcash) &&
					<Separator style={[{ marginVertical: 20 }]} />
				}
				{isMelt || isSwap ?
					<MeltOverview
						amount={+amount}
						balance={balance}
						shouldEstimate={shouldEstimate}
						balTooLow={balTooLow}
						fee={fee.estimation}
					/>
					:
					isSendEcash ?
						<View style={styles.overview}>
							<Txt
								txt={t('balance', { ns: 'common' })}
								styles={[{ fontWeight: '500' }]}
							/>
							<Txt txt={`${balance} Satoshi`} />
						</View>
						:
						null
				}
			</View>
			{(isMelt || isSwap) &&
				<Txt txt={'* ' + t('cashOutAmountHint', { ns: 'mints' })} styles={[styles.feeHint, { color: color.TEXT_SECONDARY }]} />
			}
			<KeyboardAvoidingView
				behavior={isIOS ? 'padding' : undefined}
				style={[styles.continue, { bottom: isIOS ? 20 : 0 }]}
			>
				<TouchableOpacity
					style={styles.actionBtn}
					onPress={() => void handleAmountSubmit()}
					disabled={balTooLow}
				>
					<Txt
						txt={getActionBtnTxt()}
						styles={[
							globals(color, highlight).pressTxt,
							{
								color: balTooLow ? mainColors.ERROR : fee.isCalculating ? mainColors.WARN : hi[highlight],
								marginRight: fee.isCalculating ? 10 : 0
							}
						]}
					/>
					{fee.isCalculating && <Loading color={mainColors.WARN} />}
				</TouchableOpacity>
			</KeyboardAvoidingView>
			{prompt.open && <Toaster txt={prompt.msg} />}
		</Container>
	)
}

interface IMeltOverviewProps {
	amount: number
	balance: number
	shouldEstimate?: boolean
	balTooLow?: boolean
	isInvoice?: boolean
	fee: number
}

export function MeltOverview({ amount, balance, shouldEstimate, balTooLow, isInvoice, fee }: IMeltOverviewProps) {
	const { t } = useTranslation(['common'])
	const { color } = useContext(ThemeContext)
	return (
		<>
			<View style={styles.overview}>
				<Txt
					txt={t('balance')}
					styles={[{ fontWeight: '500' }]}

				/>
				<Txt
					txt={`${balance} Satoshi`}
				/>
			</View>
			<Separator style={[{ marginVertical: 20 }]} />
			<View style={styles.overview}>
				<Txt
					txt={t(isInvoice ? 'invoiceInclFee' : 'totalInclFee', { ns: 'common' }) + '*'}
					styles={[{ fontWeight: '500' }]}
				/>
				<Txt
					txt={`${shouldEstimate ? 0 : amount + fee} Satoshi`}
					styles={[{ color: !shouldEstimate && balTooLow ? mainColors.ERROR : shouldEstimate ? color.TEXT : mainColors.VALID }]}
				/>
			</View>
		</>
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
		fontSize: 32,
		width: '100%',
		textAlign: 'center',
		marginBottom: 5,
	},
	continue: {
		flex: 1,
		position: 'absolute',
		right: 20,
		left: 20,
		alignItems: 'center'
	},
	overviewWrap: {
		width: '100%',
		paddingVertical: 20
	},
	overview: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	feeHint: {
		fontSize: 12,
		paddingHorizontal: 20,
		marginTop: 10,
	},
	actionBtn: {
		padding: 20
	}
})