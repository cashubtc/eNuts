import { useShakeAnimation } from '@comps/animation/Shake'
import Button from '@comps/Button'
import Txt from '@comps/Txt'
import { isIOS } from '@consts'
import type { TSelectAmountPageProps } from '@model/nav'
import TopNav from '@nav/TopNav'
import { ThemeContext } from '@src/context/Theme'
import { highlight as hi, mainColors } from '@styles'
import { cleanUpNumericStr, vib } from '@util'
import { createRef, useContext, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Animated, KeyboardAvoidingView, StyleSheet, TextInput, View } from 'react-native'
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
	// request token
	const handleAmountSubmit = () => {
		// shake animation
		if (!amount || +amount < 1) {
			vib(400)
			setErr(true)
			shake()
			const t = setTimeout(() => {
				setErr(false)
				clearTimeout(t)
			}, 500)
			return
		}
		navigation.navigate('processing', { mint, amount: +amount })
	}
	// auto-focus numeric keyboard
	useEffect(() => {
		const t = setTimeout(() => {
			inputRef.current?.focus()
			clearTimeout(t)
		}, 200)
	}, [inputRef])
	return (
		<View style={[styles.container, { backgroundColor: color.BACKGROUND }]}>
			<TopNav screenName={t('createInvoice')} withBackBtn />
			<Txt txt={t('invoiceAmountHint', { ns: 'mints' })} />
			<Animated.View style={[styles.amountWrap, { transform: [{ translateX: anim.current }] }]}>
				<TextInput
					keyboardType='numeric'
					ref={inputRef}
					placeholder='0'
					placeholderTextColor={err ? mainColors.ERROR : hi[highlight]}
					style={[styles.amount, { color: hi[highlight] }]}
					cursorColor={hi[highlight]}
					onChangeText={amount => setAmount(cleanUpNumericStr(amount))}
					onSubmitEditing={handleAmountSubmit}
					value={amount}
					maxLength={8}
				/>
				<Txt txt='Satoshi' styles={[{ color: color.TEXT_SECONDARY }]} />
			</Animated.View>
			<KeyboardAvoidingView
				behavior={isIOS ? 'height' : undefined}
				style={[styles.continue, { bottom: 20 + insets.bottom }]}
			>
				<Button
					txt={t('continue', { ns: 'common' })}
					onPress={handleAmountSubmit}
				/>
			</KeyboardAvoidingView>
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		paddingHorizontal: 20,
		paddingTop: 110,
	},
	amountWrap: {
		width: '100%',
		alignItems: 'center',
		marginTop: 30,
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
		left: 20
	}
})