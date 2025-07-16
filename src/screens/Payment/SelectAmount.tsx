import { useShakeAnimation } from '@comps/animation/Shake'
import Button, { IconBtn } from '@comps/Button'
import { ChevronRightIcon } from '@comps/Icons'
import Loading from '@comps/Loading'
import Screen from '@comps/Screen'
import Separator from '@comps/Separator'
import Txt from '@comps/Txt'
import { isIOS } from '@consts'
import { l } from '@log'
import type { TSelectAmountPageProps } from '@model/nav'
import { useFocusEffect } from '@react-navigation/native'
import { usePrivacyContext } from '@src/context/Privacy'
import { usePromptContext } from '@src/context/Prompt'
import { useThemeContext } from '@src/context/Theme'
import { NS } from '@src/i18n'
import { globals, highlight as hi, mainColors } from '@styles'
import { cleanUpNumericStr, formatInt, formatSatStr, getInvoiceFromLnurl, vib } from '@util'
import { getLnurlIdentifierFromMetadata, isLightningAddress } from '@util/lnurl'
import { checkFees, requestMint } from '@wallet'
import { createRef, useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Animated, KeyboardAvoidingView, TextInput, View } from 'react-native'
import { s, ScaledSheet, vs } from 'react-native-size-matters'

export default function SelectAmountScreen({ navigation, route }: TSelectAmountPageProps) {
	const { mint, balance, lnurl, isMelt, isSendEcash, nostr, isSwap, targetMint, scanned } = route.params
	const { openPromptAutoClose } = usePromptContext()
	const { t } = useTranslation([NS.wallet])
	const { color, highlight } = useThemeContext()
	const { hidden } = usePrivacyContext()
	const { anim, shake } = useShakeAnimation()
	const numericInputRef = createRef<TextInput>()
	const txtInputRef = createRef<TextInput>()
	const [amount, setAmount] = useState('')
	const [memo, setMemo] = useState('')
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

	const handleFeeEstimation = async () => {
		setFee(prev => ({ ...prev, isCalculating: true }))
		try {
			// check fee for payment to lnurl
			if (lnurl) {
				const lnurlInvoice = await getInvoiceFromLnurl(lnurl.userInput, +amount)
				if (!lnurlInvoice?.length) {
					openPromptAutoClose({ msg: t('feeErr', { ns: NS.common, input: lnurl.url }) })
					return setFee(prev => ({ ...prev, isCalculating: false }))
				}
				const estFee = await checkFees(mint.mintUrl, lnurlInvoice)
				setFee({ estimation: estFee, isCalculating: false })
				return setShouldEstimate(false)
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

	const onMemoChange = useCallback((text: string) => setMemo(text), [])

	const handleAmountSubmit = () => {
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
		if (!isSendEcash && shouldEstimate && (lnurl || isSwap)) {
			return handleFeeEstimation()
		}
		// send ecash / melt / swap
		if (isSendingTX) {
			const recipient = isLightningAddress(lnurl?.userInput || '') ? lnurl?.userInput : lnurl?.data ? getLnurlIdentifierFromMetadata(lnurl.data?.metadata) : undefined
			// Check if user melts/swaps his whole mint balance, so there is no need for coin selection and that can be skipped here
			if (!isSendEcash && isSendingWholeMintBal()) {
				return navigation.navigate('processing', {
					mint,
					amount: +amount,
					estFee: fee.estimation,
					isMelt,
					isSendEcash,
					isSwap,
					targetMint,
					recipient
				})
			}
			return navigation.navigate('coinSelection', {
				mint,
				balance,
				amount: +amount,
				memo,
				nostr,
				estFee: fee.estimation,
				isMelt,
				isSendEcash,
				isSwap,
				targetMint,
				recipient
			})
		}
		// request new token from mint
		navigation.navigate('processing', { mint, amount: +amount })
	}

	// auto-focus numeric input when the screen gains focus
	useFocusEffect(
		useCallback(() => {
			const timeoutId = setTimeout(() => {
				if (!txtInputRef.current?.isFocused()) {
					numericInputRef.current?.focus()
				}
			}, 200)
			return () => clearTimeout(timeoutId)
		}, [txtInputRef, numericInputRef])
	)

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
			handlePress={() => scanned ? navigation.navigate('qr scan', {}) : navigation.goBack()}
			mintBalance={balance}
			disableMintBalance={isMelt || isSwap || hidden.balance}
			handleMintBalancePress={() => setAmount(`${balance}`)}
		>
			{!isMelt && !isSwap &&
				<Txt
					txt={t(isSendEcash ? 'ecashAmountHint' : 'invoiceAmountHint', { ns: NS.mints })}
					styles={[styles.headerHint]}
				/>
			}
			<View style={[styles.overviewWrap, { marginTop: isMelt || isSwap ? 0 : vs(20) }]}>
				{lnurl && (lnurl.data || lnurl.userInput) &&
					<Txt
						txt={
							isLightningAddress(lnurl.userInput) ?
								lnurl.userInput
								:
								lnurl.data ?
									`${getLnurlIdentifierFromMetadata(lnurl.data.metadata)} requests ${lnurl.data.minSendable / 1000} to ${formatInt(lnurl.data.maxSendable / 1000)} Sats.`
									:
									''
						}
						bold
						styles={[styles.sats, { marginBottom: vs(5), fontSize: s(10) }]}
					/>
				}
				<Animated.View style={[styles.amountWrap, { transform: [{ translateX: anim.current }] }]}>
					<TextInput
						keyboardType='numeric'
						ref={numericInputRef}
						placeholder='0'
						cursorColor={hi[highlight]}
						placeholderTextColor={err ? mainColors.ERROR : hi[highlight]}
						style={[globals().selectAmount, { color: err ? mainColors.ERROR : hi[highlight] }]}
						onChangeText={amountt => setAmount(cleanUpNumericStr(amountt))}
						onSubmitEditing={() => void handleAmountSubmit()}
						value={amount}
						maxLength={8}
						testID='mint-amount-input'
					/>
				</Animated.View>
				<Txt
					txt={formatSatStr(+amount, 'standard', false)}
					styles={[styles.sats, { color: color.TEXT_SECONDARY }]}
				/>
				{(isMelt || isSwap) &&
					<>
						<Separator style={[{ marginVertical: vs(20) }]} />
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
				style={isSendEcash ? styles.actionWrap : styles.continue}
			>
				{isSendEcash ?
					<>
						<TextInput
							keyboardType='default'
							ref={txtInputRef}
							placeholder={t('optionalMemo', { ns: NS.common })}
							placeholderTextColor={color.INPUT_PH}
							selectionColor={hi[highlight]}
							cursorColor={hi[highlight]}
							onChangeText={onMemoChange}
							onSubmitEditing={() => void handleAmountSubmit()}
							maxLength={21}
							style={[styles.memoInput, { color: color?.TEXT, backgroundColor: color?.INPUT_BG }]}
						/>
						<IconBtn
							onPress={() => void handleAmountSubmit()}
							icon={<ChevronRightIcon color={mainColors.WHITE} />}
							size={s(55)}
							testId='continue-send-ecash'
						/>
					</>
					:
					<Button
						txt={getActionBtnTxt()}
						outlined={shouldEstimate}
						onPress={() => void handleAmountSubmit()}
						disabled={balTooLow}
						icon={fee.isCalculating ? <Loading color={hi[highlight]} /> : undefined}
					/>
				}
				{isIOS && <View style={{ height: isSendEcash ? vs(100) : vs(20) }} />}
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
				bold
			/>
			<Txt
				txt={formatSatStr(shouldEstimate ? 0 : (amount + fee))}
				styles={[{ color: !shouldEstimate && balTooLow ? mainColors.ERROR : shouldEstimate ? color.TEXT : mainColors.VALID }]}
			/>
		</View>
	)
}

const styles = ScaledSheet.create({
	headerHint: {
		paddingHorizontal: '20@s',
		marginBottom: '20@vs',
		fontWeight: '500'
	},
	amountWrap: {
		width: '100%',
		alignItems: 'center',
	},
	continue: {
		flex: 1,
		position: 'absolute',
		right: '20@s',
		left: '20@s',
		bottom: '20@vs',
		alignItems: 'center'
	},
	overviewWrap: {
		width: '100%',
		paddingHorizontal: '20@s',
	},
	overview: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	sats: {
		fontSize: '12@vs',
		textAlign: 'center',
		marginLeft: '-4@s',
		marginTop: '-5@vs'
	},
	feeHint: {
		fontSize: '10@vs',
		marginTop: '10@vs',
	},
	actionWrap: {
		flex: 1,
		position: 'absolute',
		bottom: '20@vs',
		left: '20@s',
		right: '20@s',
		flexDirection: 'row',
		alignItems: 'center',
		maxWidth: '100%',
	},
	memoInput: {
		flex: 1,
		marginRight: '20@s',
		paddingHorizontal: '18@s',
		paddingVertical: '18@vs',
		borderRadius: 50,
		fontSize: '14@vs',
	},
})