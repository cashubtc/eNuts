import { useShakeAnimation } from '@comps/animation/Shake'
import { IconBtn } from '@comps/Button'
import { ChevronRightIcon, LeftArrow } from '@comps/Icons'
import Txt from '@comps/Txt'
import { isIOS } from '@consts'
import type { TSelectNostrAmountPageProps } from '@model/nav'
import MintBalanceBtn from '@nav/MintBalanceBtn'
import { useFocusEffect } from '@react-navigation/native'
import ProfileBanner from '@screens/Addressbook/Contact/Banner'
import ProfilePic from '@screens/Addressbook/ProfilePic'
import { useThemeContext } from '@src/context/Theme'
import { NS } from '@src/i18n'
import { getNostrUsername, truncateNpub } from '@src/nostr/util'
import { getColor } from '@src/styles/colors'
import { globals, highlight as hi, mainColors } from '@styles'
import { cleanUpNumericStr, formatSatStr, vib } from '@util'
import { nip19 } from 'nostr-tools'
import { createRef, useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Animated, KeyboardAvoidingView, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { s, ScaledSheet, vs } from 'react-native-size-matters'

export default function SelectNostrAmountScreen({ navigation, route }: TSelectNostrAmountPageProps) {
	const { mint, balance, nostr } = route.params
	const { t } = useTranslation([NS.wallet])
	const { color, highlight } = useThemeContext()
	const { anim, shake } = useShakeAnimation()
	const numericInputRef = createRef<TextInput>()
	const txtInputRef = createRef<TextInput>()
	const [amount, setAmount] = useState('')
	const [memo, setMemo] = useState('')
	// invoice amount too low
	const [err, setErr] = useState(false)

	const handleAmountSubmit = () => {
		// error & shake animation if amount === 0 or greater than mint balance
		if (!amount || +amount < 1 || +amount > balance) {
			vib(400)
			setErr(true)
			shake()
			const t = setTimeout(() => {
				setErr(false)
				clearTimeout(t)
			}, 500)
			return
		}
		navigation.navigate('coinSelection', {
			mint,
			balance,
			amount: +amount,
			estFee: 0,
			isSendEcash: true,
			nostr,
			memo
		})
	}

	const onMemoChange = useCallback((text: string) => setMemo(text), [])

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

	return (
		<View style={[globals(color).container, styles.container]}>
			<View style={styles.navWrap}>
				<View style={styles.navTxtWrap}>
					<TouchableOpacity
						onPress={() => navigation.goBack()}
						style={styles.backiconWrap}
					>
						<LeftArrow color={hi[highlight]} />
					</TouchableOpacity>
					<View style={{ marginLeft: s(10) }}>
						<Text style={[globals(color).navTxt, styles.navTxt]}>
							{t('sendEcash', { ns: NS.common })}
						</Text>
					</View>
				</View>
				<MintBalanceBtn
					handleMintBalancePress={() => setAmount(`${balance}`)}
					mintBalance={balance}
				/>
			</View>
			{/* Contact pictures overview */}
			<ProfileBanner
				hex={nostr?.contact?.hex ?? ''}
				uri={nostr?.contact?.banner}
				isSending
				dimmed
			/>
			<View style={[styles.profilePicContainer, { marginTop: nostr?.contact?.banner ? vs(-40) : vs(-90) }]}>
				<View style={styles.picWrap}>
					<ProfilePic
						hex={nostr?.contact?.hex ?? ''}
						uri={nostr?.contact?.picture}
						size={s(60)}
					/>
				</View>
			</View>
			<Txt
				txt={getNostrUsername(nostr?.contact) ?? truncateNpub(nip19.npubEncode(nostr?.contact?.hex ?? ''))}
				styles={[styles.username]}
			/>
			<View style={styles.overviewWrap}>
				<Animated.View style={[styles.amountWrap, { transform: [{ translateX: anim.current }] }]}>
					<TextInput
						keyboardType='numeric'
						ref={numericInputRef}
						placeholder='0'
						placeholderTextColor={err ? mainColors.ERROR : hi[highlight]}
						style={[globals().selectAmount, { color: err ? mainColors.ERROR : hi[highlight] }]}
						cursorColor={hi[highlight]}
						onChangeText={amount => setAmount(cleanUpNumericStr(amount))}
						onSubmitEditing={() => void handleAmountSubmit()}
						value={amount}
						maxLength={8}
					/>
				</Animated.View>
				<Txt
					txt={formatSatStr(+amount, 'standard', false)}
					styles={[{ color: color.TEXT_SECONDARY, fontSize: vs(12), textAlign: 'center' }]}
				/>
			</View>
			<KeyboardAvoidingView
				behavior={isIOS ? 'padding' : undefined}
				style={styles.actionWrap}
			>
				<TextInput
					keyboardType='default'
					placeholder={t('optionalMemo', { ns: NS.common })}
					placeholderTextColor={color.INPUT_PH}
					selectionColor={hi[highlight]}
					cursorColor={hi[highlight]}
					onChangeText={onMemoChange}
					onSubmitEditing={() => handleAmountSubmit()}
					maxLength={21}
					style={[styles.memoInput, { color: color?.TEXT, backgroundColor: color?.INPUT_BG }]}
				/>
				<IconBtn
					onPress={() => handleAmountSubmit()}
					icon={<ChevronRightIcon width={s(12)} height={s(19)} color={getColor(highlight, color)} />}
					size={s(55)}
				/>
			</KeyboardAvoidingView>
		</View>
	)
}

const styles = ScaledSheet.create({
	container: {
		paddingTop: 0
	},
	backiconWrap: {
		paddingRight: '10@s',
		paddingLeft: '20@s',
		paddingVertical: '10@vs',
	},
	navTxtWrap: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	navTxt: {
		color: mainColors.WHITE,
	},
	navWrap: {
		position: 'absolute',
		top: 0,
		right: 0,
		left: 0,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		height: '90@vs',
		paddingRight: '20@s',
		paddingTop: '40@vs',
		zIndex: 1,
	},
	profilePicContainer: {
		flexDirection: 'row',
		alignItems: 'flex-end',
		justifyContent: 'space-between',
		paddingHorizontal: '20@s',
	},
	picWrap: {
		width: '60@s',
		height: '60@s',
		borderRadius: '30@s',
		overflow: 'hidden',
		marginBottom: '5@vs',
	},
	username: {
		fontSize: '17@vs',
		fontWeight: '500',
		marginHorizontal: '20@s',
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
		alignItems: 'center'
	},
	overviewWrap: {
		marginTop: '20@vs',
	},
	overview: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	bold: {
		fontWeight: '500'
	},
	actionWrap: {
		position: 'absolute',
		bottom: '20@vs',
		left: '20@s',
		right: '20@s',
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: isIOS ? '20@vs' : '0@vs',
		maxWidth: '100%',
	},
	memoInput: {
		flex: 1,
		marginRight: '20@s',
		paddingHorizontal: '18@s',
		paddingVertical: '18@vs',
		borderRadius: 50,
		fontSize: '14@vs',
	}
})