import { useShakeAnimation } from '@comps/animation/Shake'
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
import { cleanUpNumericStr, getInvoiceFromLnurl, isNum, vib } from '@util'
import { checkFees } from '@wallet'
import { createRef, useContext, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Animated, KeyboardAvoidingView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default function SelectAmountScreen({ navigation, route }: TSelectAmountPageProps) {
	const mint = route.params.mint
	const { t } = useTranslation(['wallet'])
	const insets = useSafeAreaInsets()
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
	const balTooLow = route.params.isMelt && isNum(route.params.balance) && +amount + fee.estimation > route.params.balance
	const handleFeeEstimation = async (lnurl: string) => {
		setFee(prev => ({ ...prev, isCalculating: true }))
		const invoice = await getInvoiceFromLnurl(lnurl, +amount)
		if (!invoice?.length) {
			openPromptAutoClose({ msg: t('feeErr', { ns: 'common', input: lnurl }) })
			setFee(prev => ({ ...prev, isCalculating: false }))
			return
		}
		const estFee = await checkFees(route.params.mint.mintUrl, invoice)
		setFee({ estimation: estFee, isCalculating: false })
		setShouldEstimate(false)
	}
	const getActionBtnTxt = () => {
		if (fee.isCalculating) { return t('calculateFeeEst', { ns: 'common' }) }
		if (balTooLow) { return t('balTooLow', { ns: 'common' }) }
		return t(shouldEstimate ? 'estimateFee' : 'continue', { ns: 'common' })
	}
	const handleAmountSubmit = async () => {
		if (fee.isCalculating || balTooLow) { return }
		const { isMelt, balance, lnurl } = route.params
		// error & shake animation if amount === 0 or greater than mint balance
		if (!amount || +amount < 1 || (isMelt && balance && +amount > balance)) {
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
		if (shouldEstimate && lnurl?.length) {
			await handleFeeEstimation(lnurl)
			return
		}
		// melt token
		if (isMelt) {
			// Check if user sends his whole mint balance, so there is no need for coin selection and that can be skipped here
			if (+amount + fee.estimation === route.params.balance) {
				// TODO nav to processing page and request mint payment - navigation.navigate('processing', { mint, amount: +amount, isMelt: true, recipient })
				return
			}
			navigation.navigate('coinSelection', {
				mint,
				amount: +amount,
				estFee: fee.estimation,
				isMelt: true,
				recipient: lnurl || ''
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
	useEffect(() => {
		setShouldEstimate(!!route.params.isMelt)
	}, [route.params.isMelt])
	// estimate fee each time the melt amount changes
	useEffect(() => {
		if (!route.params.isMelt) { return }
		setFee({ estimation: 0, isCalculating: false })
		setShouldEstimate(true)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [amount])
	return (
		<View style={[styles.container, { backgroundColor: color.BACKGROUND }]}>
			<TopNav
				screenName={route.params.isMelt ? t('cashOut', { ns: 'common' }) : t('createInvoice')}
				withBackBtn
			/>
			<Txt
				txt={t(route.params.isMelt ? 'cashOutAmountHint' : 'invoiceAmountHint', { ns: 'mints' })}
				styles={[styles.hint]}
			/>
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
			{route.params.isMelt && route.params.balance &&
				<MeltOverview
					amount={+amount}
					balance={route.params.balance}
					shouldEstimate={shouldEstimate}
					balTooLow={balTooLow}
					fee={fee.estimation}
				/>
			}
			<KeyboardAvoidingView
				behavior={isIOS ? 'height' : undefined}
				style={[styles.continue, { bottom: 20 + insets.bottom }]}
			>
				<TouchableOpacity
					style={styles.actionBtn}
					onPress={() => void handleAmountSubmit()}
					disabled={balTooLow}
				>
					<View style={styles.actionBtnTxtWrap}>
						<Txt
							txt={getActionBtnTxt()}
							styles={[
								globals(color, highlight).pressTxt,
								{ color: balTooLow ? mainColors.ERROR : fee.isCalculating ? mainColors.WARN : hi[highlight], marginRight: 10 }
							]}
						/>
						{fee.isCalculating && <Loading color={mainColors.WARN} />}
					</View>
				</TouchableOpacity>
			</KeyboardAvoidingView>
			{prompt.open && <Toaster txt={prompt.msg} />}
		</View>
	)
}

interface IMeltOverviewProps {
	amount: number
	balance: number
	shouldEstimate?: boolean
	balTooLow?: boolean
	fee: number
}

export function MeltOverview({ amount, balance, shouldEstimate, balTooLow, fee }: IMeltOverviewProps) {
	const { t } = useTranslation(['common'])
	const { color } = useContext(ThemeContext)
	return (
		<View style={[globals(color).wrapContainer, styles.overviewWrap]}>
			<View style={styles.overview}>
				<Txt
					txt={t('balance') + ':'}
					styles={[{ color: color.TEXT_SECONDARY, fontWeight: '500' }]}

				/>
				<Txt
					txt={`${balance} Satoshi`}
					styles={[{ color: color.TEXT_SECONDARY }]}
				/>
			</View>
			<Separator style={[{ marginVertical: 10 }]} />
			<View style={styles.overview}>
				<Txt
					txt={t('totalInclFee', { ns: 'common' })}
					styles={[{ color: color.TEXT_SECONDARY, fontWeight: '500' }]}
				/>
				<Txt
					txt={`${shouldEstimate ? 0 : amount + fee} Satoshi`}
					styles={[{ color: !shouldEstimate && balTooLow ? mainColors.ERROR : shouldEstimate ? color.TEXT_SECONDARY : mainColors.VALID }]}
				/>
			</View>
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		paddingTop: 110,
	},
	hint: {
		paddingHorizontal: 20,
	},
	amountWrap: {
		width: '100%',
		alignItems: 'center',
		marginTop: 10,
	},
	amount: {
		fontSize: 40,
		width: '100%',
		textAlign: 'center',
		marginBottom: 5,
	},
	continue: {
		position: 'absolute',
		right: 20,
		left: 20,
		alignItems: 'center'
	},
	overviewWrap: {
		width: '100%',
		marginTop: 10,
		paddingVertical: 10
	},
	overview: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	actionBtnTxtWrap: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	actionBtn: {
		padding: 10,
		alignItems: 'center',
		width: 250,
	}
})