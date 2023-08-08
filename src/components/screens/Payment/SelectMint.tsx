import Button from '@comps/Button'
import Empty from '@comps/Empty'
import { MintBoardIcon, ZapIcon } from '@comps/Icons'
import Screen from '@comps/Screen'
import Separator from '@comps/Separator'
import Txt from '@comps/Txt'
import { _testmintUrl } from '@consts'
import type { IMintBalWithName } from '@model'
import type { TSelectMintPageProps } from '@model/nav'
import { FlashList } from '@shopify/flash-list'
import { usePromptContext } from '@src/context/Prompt'
import { useThemeContext } from '@src/context/Theme'
import { getDefaultMint } from '@store/mintStore'
import { globals, highlight as hi } from '@styles'
import { formatInt, formatMintUrl } from '@util'
import { checkFees } from '@wallet'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const flashlistItemHeight = 66

export default function SelectMintScreen({ navigation, route }: TSelectMintPageProps) {
	const {
		mints,
		mintsWithBal,
		allMintsEmpty,
		isMelt,
		isSendEcash,
		nostr,
		invoice,
		invoiceAmount
	} = route.params
	const { openPromptAutoClose } = usePromptContext()
	const insets = useSafeAreaInsets()
	const { t } = useTranslation(['wallet'])
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
	const handlePressMint = async (mint: IMintBalWithName) => {
		// pay scanned invoice
		if (invoice && invoiceAmount) {
			const estFee = await checkFees(mint.mintUrl, invoice)
			if (invoiceAmount + estFee > mint.amount) {
				openPromptAutoClose({ msg: t('noFunds', { ns: 'common' }) })
				return
			}
			navigation.navigate('coinSelection', {
				mint,
				balance: mint.amount,
				amount: invoiceAmount,
				estFee,
				isMelt: true
			})
			return
		}
		// choose a target for a lightning payment
		if (isMelt) {
			// get remaining mints for a possible multimint swap
			const remainingMints = userMints
				.filter(m => m.mintUrl !== mint.mintUrl && m.mintUrl !== _testmintUrl)
				.map(m => ({ mintUrl: m.mintUrl, customName: m.customName }))
			navigation.navigate('selectTarget', {
				mint,
				balance: mint.amount,
				remainingMints
			})
			return
		}
		// select ecash amount to send
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
			screenName={t(getScreenName(), { ns: 'common' })}
			withBackBtn
			handlePress={() => navigation.goBack()}
		>
			{userMints.length > 0 && !allMintsEmpty &&
				<Txt
					styles={[styles.hint]}
					txt={t(getScreenHint(), { ns: 'mints' })}
				/>
			}
			{userMints.length && !allMintsEmpty ?
				<View style={[
					globals(color).wrapContainer,
					{ height: !userMints.length ? flashlistItemHeight : userMints.length * flashlistItemHeight }
				]}>
					<FlashList
						data={userMints}
						estimatedItemSize={300}
						renderItem={data => (
							<TouchableOpacity
								key={data.item.mintUrl}
								style={styles.mintUrlWrap}
								onPress={() => void handlePressMint(data.item)}
							>
								<View style={styles.mintNameWrap}>
									{defaultMint === data.item.mintUrl &&
										<MintBoardIcon width={18} height={18} color={hi[highlight]} />
									}
									<Txt
										txt={data.item.customName || formatMintUrl(data.item.mintUrl)}
										styles={[{ marginLeft: defaultMint === data.item.mintUrl ? 10 : 0 }]}
									/>
								</View>
								{/* mint balance */}
								<View style={styles.mintBal}>
									<Text style={[styles.mintAmount, { color: color.TEXT }]}>
										{formatInt(data.item.amount, 'compact', 'en')}
									</Text>
									<ZapIcon color={color.TEXT} />
								</View>
							</TouchableOpacity>
						)}
						ItemSeparatorComponent={() => <Separator />}
					/>
				</View>
				:
				<Empty txt={t(allMintsEmpty ? 'noFunds' : 'noMint', { ns: 'common' }) + '...'} />
			}
			{(!userMints.length || allMintsEmpty) &&
				<View style={[styles.addNewMintWrap, { bottom: 20 + insets.bottom }]}>
					<Button
						txt={t(allMintsEmpty ? 'mintNewTokens' : 'addNewMint', { ns: 'mints' })}
						onPress={() => {
							if (allMintsEmpty) {
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
	mintUrlWrap: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingVertical: 20,
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