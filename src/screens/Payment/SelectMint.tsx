import Button from '@comps/Button'
import Empty from '@comps/Empty'
import { MintBoardIcon, ZapIcon } from '@comps/Icons'
import Screen from '@comps/Screen'
import Separator from '@comps/Separator'
import Txt from '@comps/Txt'
import { _testmintUrl } from '@consts'
import type { IMintBalWithName } from '@model'
import type { TSelectMintPageProps } from '@model/nav'
import { usePromptContext } from '@src/context/Prompt'
import { useThemeContext } from '@src/context/Theme'
import { NS } from '@src/i18n'
import { getDefaultMint } from '@store/mintStore'
import { globals, highlight as hi } from '@styles'
import { formatInt, formatMintUrl, isNum, sortMintsByDefault } from '@util'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default function SelectMintScreen({ navigation, route }: TSelectMintPageProps) {
	const {
		mints,
		mintsWithBal,
		allMintsEmpty,
		isMelt,
		isSendEcash,
		nostr,
		invoice,
		invoiceAmount,
		estFee,
		scanned
	} = route.params
	const { openPromptAutoClose } = usePromptContext()
	const insets = useSafeAreaInsets()
	const { t } = useTranslation([NS.wallet])
	const { color, highlight } = useThemeContext()
	// mint list
	const [userMints, setUserMints] = useState<IMintBalWithName[]>([])
	// the default mint url if user has set one
	const [defaultMint, setDefaultM] = useState('')
	// navigation screen name
	const getScreenName = () => {
		if (isMelt) { return 'cashOut' }
		if (isSendEcash) { return 'sendEcash' }
		return 'createInvoice'
	}
	// screen text hint (short explaination about feature)
	const getScreenHint = () => {
		if (isMelt) { return 'chooseMeltMintHint' }
		if (isSendEcash) { return 'sendEcashHint' }
		return 'chooseMintHint'
	}
	// press mint
	const handlePressMint = (mint: IMintBalWithName) => {
		// pay scanned invoice
		if (invoice && invoiceAmount && isNum(estFee)) {
			if (invoiceAmount + estFee > mint.amount) {
				openPromptAutoClose({ msg: t('noFundsForFee', { ns: NS.common, fee: estFee }), ms: 4000 })
				return
			}
			navigation.navigate('coinSelection', {
				mint,
				balance: mint.amount,
				amount: invoiceAmount,
				estFee,
				isMelt: true,
				recipient: invoice
			})
			return
		}
		// choose a target for a payment
		if (isMelt || isSendEcash) {
			// get remaining mints for a possible multimint swap
			const remainingMints = userMints
				.filter(m => m.mintUrl !== mint.mintUrl && m.mintUrl !== _testmintUrl)
				.map(m => ({ mintUrl: m.mintUrl, customName: m.customName }))
			// user has already selected a nostr target
			if (nostr) {
				// select ecash amount to send
				navigation.navigate('selectNostrAmount', {
					mint,
					nostr,
					balance: mint.amount,
				})
				return
			}
			// l('user wants to send payment, navigate to target selection')
			navigation.navigate('selectTarget', {
				mint,
				balance: mint.amount,
				remainingMints,
				isSendEcash,
				isMelt
			})
			return
		}
		navigation.navigate('selectAmount', {
			mint,
			nostr,
			balance: mint.amount,
			isSendEcash
		})
	}

	// Show user mints with balances and default mint icon
	useEffect(() => {
		void (async () => {
			if (!mints.length) { return }
			const mintsBalWithName = mints.map((m, i) => ({
				mintUrl: m.mintUrl,
				customName: m.customName || '',
				amount: mintsWithBal[i].amount,
			}))
			setUserMints(mintsBalWithName)
			setDefaultM(await getDefaultMint() ?? '')
		})()
	}, [mints, mintsWithBal])

	return (
		<Screen
			screenName={t(getScreenName(), { ns: NS.common })}
			withBackBtn
			handlePress={() => {
				if (scanned) { return navigation.navigate('qr scan', {}) }
				navigation.goBack()
			}}
		>
			{userMints.length > 0 && !allMintsEmpty &&
				<Txt
					styles={[styles.hint]}
					txt={t(getScreenHint(), { ns: NS.mints })}
				/>
			}
			{userMints.length > 0 && !allMintsEmpty ?
				<ScrollView>
					<View style={globals(color).wrapContainer}>
						{sortMintsByDefault(userMints, defaultMint).map((m, i) => (
							<View key={m.mintUrl}>
								<TouchableOpacity
									style={globals().wrapRow}
									onPress={() => handlePressMint(m)}
								>
									<View style={styles.mintNameWrap}>
										{defaultMint === m.mintUrl &&
											<MintBoardIcon width={18} height={18} color={hi[highlight]} />
										}
										<Txt
											txt={m.customName || formatMintUrl(m.mintUrl)}
											styles={[{ marginLeft: defaultMint === m.mintUrl ? 10 : 0 }]}
										/>
									</View>
									<View style={styles.mintBal}>
										<Text style={[styles.mintAmount, { color: color.TEXT, paddingBottom: 3 }]}>
											{formatInt(m.amount, 'compact', 'en')}
										</Text>
										<ZapIcon color={m.amount > 0 ? hi[highlight] : color.TEXT} />
									</View>
								</TouchableOpacity>
								{i < userMints.length - 1 && <Separator />}
							</View>
						))}
					</View>
				</ScrollView>
				:
				<Empty txt={t(allMintsEmpty ? 'noFunds' : 'noMint', { ns: NS.common }) + '...'} />
			}
			{(!userMints.length || allMintsEmpty) &&
				<View style={[styles.addNewMintWrap, { bottom: 20 + insets.bottom }]}>
					<Button
						txt={t(allMintsEmpty ? 'mintNewTokens' : 'addNewMint', { ns: NS.mints })}
						onPress={() => {
							if (allMintsEmpty && userMints.length === 1) {
								navigation.navigate('selectAmount', {
									mint: userMints[0],
									balance: userMints[0].amount,
								})
								return
							}
							if (allMintsEmpty && userMints.length > 1) {
								navigation.navigate('selectMint', {
									mints,
									mintsWithBal
								})
								return
							}
							navigation.navigate('mints')
						}}
					/>
				</View>
			}
		</Screen>
	)
}

const styles = StyleSheet.create({
	hint: {
		paddingHorizontal: 20,
		marginBottom: 20,
		fontWeight: '500'
	},
	mintNameWrap: {
		flexDirection: 'row',
		alignItems: 'center'
	},
	mintBal: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
	},
	mintAmount: {
		marginRight: 5,
	},
	addNewMintWrap: {
		position: 'absolute',
		right: 20,
		left: 20,
	}
})