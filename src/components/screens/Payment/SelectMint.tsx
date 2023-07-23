import Button from '@comps/Button'
import Empty from '@comps/Empty'
import usePrompt from '@comps/hooks/Prompt'
import { MintBoardIcon, ZapIcon } from '@comps/Icons'
import Separator from '@comps/Separator'
import Toaster from '@comps/Toaster'
import Txt from '@comps/Txt'
import type { IMintBalWithName } from '@model'
import type { TSelectMintPageProps } from '@model/nav'
import TopNav from '@nav/TopNav'
import { FlashList } from '@shopify/flash-list'
import { ThemeContext } from '@src/context/Theme'
import { getDefaultMint } from '@store/mintStore'
import { globals, highlight as hi } from '@styles'
import { formatInt, formatMintUrl } from '@util'
import { checkFees } from '@wallet'
import { useContext, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default function SelectMintScreen({ navigation, route }: TSelectMintPageProps) {
	const {
		mints,
		mintsWithBal,
		allMintsEmpty,
		isMelt,
		isSendEcash,
		invoice,
		invoiceAmount
	} = route.params
	const insets = useSafeAreaInsets()
	const { t } = useTranslation(['wallet'])
	const { color, highlight } = useContext(ThemeContext)
	// mint list
	const [userMints, setUserMints] = useState<IMintBalWithName[]>([])
	// the default mint url if user has set one
	const [defaultMint, setDefaultM] = useState('')
	const { prompt, openPromptAutoClose } = usePrompt()
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
		if (isMelt) {
			navigation.navigate('selectTarget', {
				mint,
				balance: mint.amount,
			})
			return
		}
		navigation.navigate('selectAmount', {
			mint,
			balance: mint.amount,
			isMelt,
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
		<View style={[styles.container, { backgroundColor: color.BACKGROUND }]}>
			<TopNav screenName={t(getScreenName(), { ns: 'common' })} withBackBtn />
			{userMints.length > 0 && !allMintsEmpty &&
				<Txt
					styles={[styles.hint]}
					txt={t(getScreenHint(), { ns: 'mints' })}
				/>
			}
			{userMints.length && !allMintsEmpty ?
				<View style={[
					globals(color).wrapContainer,
					{ height: !userMints.length ? 65 : userMints.length * 65 }
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
									<ZapIcon width={18} height={18} color={color.TEXT} />
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
				<View style={[styles.addNewMintWrap, {bottom: 20 + insets.bottom}]}>
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
			{prompt.open && <Toaster txt={prompt.msg} />}
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
		marginBottom: 20,
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