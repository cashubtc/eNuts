import { useShakeAnimation } from '@comps/animation/Shake'
import Button from '@comps/Button'
import { LeftArrow } from '@comps/Icons'
import Txt from '@comps/Txt'
import { isIOS } from '@consts'
import type { TSelectNostrAmountPageProps } from '@model/nav'
import MintBalanceBtn from '@nav/MintBalanceBtn'
import ProfileBanner from '@screens/Addressbook/Contact/Banner'
import ProfilePic from '@screens/Addressbook/ProfilePic'
import { useThemeContext } from '@src/context/Theme'
import { NS } from '@src/i18n'
import { getNostrUsername, truncateNpub } from '@src/nostr/util'
import { globals, highlight as hi, mainColors } from '@styles'
import { cleanUpNumericStr, formatSatStr, vib } from '@util'
import { nip19 } from 'nostr-tools'
import { createRef, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Animated, KeyboardAvoidingView, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { s, ScaledSheet, vs } from 'react-native-size-matters'

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
						size={80}
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
					txt={formatSatStr(+amount, 'standard', false)}
					styles={[{ color: color.TEXT_SECONDARY, fontSize: vs(12), textAlign: 'center' }]}
				/>
			</View>
			<KeyboardAvoidingView
				behavior={isIOS ? 'padding' : undefined}
				style={{
					position: 'absolute',
					bottom: vs(20),
					left: s(20),
					right: s(20),
					marginBottom: isIOS ? vs(20) : 0,
				}}
			>
				<Button
					txt={t('continue', { ns: NS.common })}
					onPress={() => void handleAmountSubmit()}
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
		width: '80@s',
		height: '80@s',
		borderRadius: '40@s',
		overflow: 'hidden',
		marginBottom: '10@vs',
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
		marginTop: '30@vs',
	},
	overview: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	bold: {
		fontWeight: '500'
	},
})