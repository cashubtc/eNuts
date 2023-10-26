import { useShakeAnimation } from '@comps/animation/Shake'
import Button from '@comps/Button'
import { LeftArrow } from '@comps/Icons'
import Txt from '@comps/Txt'
import { isIOS } from '@consts'
import type { TSelectNostrAmountPageProps } from '@model/nav'
import ProfileBanner from '@screens/Addressbook/Contact/Banner'
import ProfilePic from '@screens/Addressbook/ProfilePic'
import { useThemeContext } from '@src/context/Theme'
import { NS } from '@src/i18n'
import { truncateNpub } from '@src/nostr/util'
import { globals, highlight as hi, mainColors } from '@styles'
import { cleanUpNumericStr, vib } from '@util'
import { nip19 } from 'nostr-tools'
import { createRef, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Animated, KeyboardAvoidingView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'

export default function SelectNostrAmountScreen({ navigation, route }: TSelectNostrAmountPageProps) {
	const { mint, balance, nostr } = route.params
	const { t } = useTranslation([NS.wallet])
	const { color, highlight } = useThemeContext()
	const { anim, shake } = useShakeAnimation()
	const inputRef = createRef<TextInput>()
	const [amount, setAmount] = useState('')
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
		navigation.navigate('memoScreen', {
			mint,
			balance,
			amount: +amount,
			nostr,
		})
	}

	// auto-focus numeric keyboard
	useEffect(() => {
		const t = setTimeout(() => {
			inputRef.current?.focus()
			clearTimeout(t)
		}, 200)
	}, [inputRef])

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
					<View style={{ marginLeft: 10 }}>
						<Text style={[globals(color).navTxt, styles.navTxt]}>
							{t('sendEcash', { ns: NS.common })}
						</Text>
						{/* <Txt
							txt={nostr?.receiverName || truncateNpub(nip19.npubEncode(nostr?.receiverHex ?? ''))}
							styles={[styles.username]}
						/> */}
					</View>
				</View>
				{/* <MintBalance balance={formatInt(balance)} txtColor={err ? mainColors.ERROR : mainColors.WHITE} /> */}
			</View>
			{/* Contact pictures overview */}
			<ProfileBanner
				hex={nostr?.receiverHex ?? ''}
				uri={nostr?.receiverBanner}
				dimmed
			/>
			<View style={[styles.profilePicContainer, { marginTop: nostr?.receiverBanner ? -50 : -90 }]}>
				<View style={styles.picWrap}>
					<ProfilePic
						hex={nostr?.receiverHex ?? ''}
						uri={nostr?.receiverPic}
						size={100}
					/>
				</View>
			</View>
			<Txt
				txt={nostr?.receiverName || truncateNpub(nip19.npubEncode(nostr?.receiverHex ?? ''))}
				styles={[styles.username]}
			/>
			<View style={styles.overviewWrap}>
				<Animated.View style={[styles.amountWrap, { transform: [{ translateX: anim.current }] }]}>
					<TextInput
						keyboardType='numeric'
						ref={inputRef}
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
					txt='Satoshi'
					styles={[{ color: color.TEXT_SECONDARY, fontSize: 14, textAlign: 'center' }]}
				/>
			</View>
			<KeyboardAvoidingView
				behavior={isIOS ? 'padding' : undefined}
				style={styles.actionWrap}
			>
				<Button
					txt={t('continue', { ns: NS.common })}
					onPress={() => void handleAmountSubmit()}
				/>
			</KeyboardAvoidingView>
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		paddingTop: 0
	},
	backiconWrap: {
		paddingRight: 10,
		paddingLeft: 20,
		paddingVertical: 10,
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
		height: 100,
		paddingRight: 20,
		paddingTop: 40,
		zIndex: 1,
	},
	profilePicContainer: {
		flexDirection: 'row',
		alignItems: 'flex-end',
		justifyContent: 'space-between',
		paddingHorizontal: 20,
	},
	picWrap: {
		width: 100,
		height: 100,
		borderRadius: 50,
		overflow: 'hidden',
	},
	username: {
		fontSize: 19,
		fontWeight: '500',
		marginHorizontal: 20,
		marginTop: 10
	},
	amountWrap: {
		width: '100%',
		alignItems: 'center',
	},
	continue: {
		flex: 1,
		position: 'absolute',
		right: 20,
		left: 20,
		alignItems: 'center'
	},
	overviewWrap: {
		marginTop: 30,
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
		bottom: 20,
		left: 20,
		right: 20,
		marginBottom: isIOS ? 20 : 0,
	},
})