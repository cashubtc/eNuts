import Button from '@comps/Button'
import Empty from '@comps/Empty'
import { MintBoardIcon, ZapIcon } from '@comps/Icons'
import Separator from '@comps/Separator'
import Txt from '@comps/Txt'
import type { IMintBalWithName } from '@model'
import type { TSelectMintPageProps } from '@model/nav'
import TopNav from '@nav/TopNav'
import { FlashList } from '@shopify/flash-list'
import { ThemeContext } from '@src/context/Theme'
import { getDefaultMint } from '@store/mintStore'
import { globals, highlight as hi } from '@styles'
import { formatInt, formatMintUrl } from '@util'
import { useContext, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

export default function SelectMintScreen({ navigation, route }: TSelectMintPageProps) {
	const { t } = useTranslation(['wallet'])
	const { color, highlight } = useContext(ThemeContext)
	// mint list
	const [userMints, setUserMints] = useState<IMintBalWithName[]>([])
	// the default mint url if user has set one
	const [defaultMint, setDefaultM] = useState('')
	// Show user mints with balances and default mint icon
	useEffect(() => {
		void (async () => {
			const { mints, mintsWithBal } = route.params
			if (!mints.length) { return }
			const mintsBalWithName = mints.map((m, i) => ({
				mintUrl: m.mintUrl,
				customName: m.customName || '',
				amount: mintsWithBal[i].amount,
			}))
			setUserMints(mintsBalWithName)
			setDefaultM(await getDefaultMint() ?? '')
		})()
	}, [route.params])
	return (
		<SafeAreaView style={[styles.container, { backgroundColor: color.BACKGROUND }]}>
			<TopNav screenName={t(route.params?.isMelt ? 'cashOut' : 'createInvoice', { ns: 'common' })} withBackBtn />
			{userMints.length > 0 && !route.params.allMintsEmpty &&
				<Txt
					styles={[styles.hint]}
					txt={t(route.params?.isMelt ? 'chooseMeltMintHint' : 'chooseMintHint', { ns: 'mints' })}
				/>
			}
			{userMints.length && !route.params.allMintsEmpty ?
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
								onPress={() => {
									navigation.navigate(route.params?.isMelt ? 'selectTarget' : 'selectAmount', {
										mint: data.item,
										balance: data.item.amount
									})
								}}
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
								{/* Add mint icon or show balance */}
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
				<Empty txt={t(route.params.allMintsEmpty ? 'noFunds' : 'noMint', { ns: 'common' }) + '...'} />
			}
			{(!userMints.length || route.params.allMintsEmpty) &&
				<View style={styles.addNewMintWrap}>
					<Button
						txt={t(route.params.allMintsEmpty ? 'mintNewTokens' : 'addNewMint', { ns: 'mints' })}
						onPress={() => {
							if (route.params.allMintsEmpty) {
								navigation.navigate('selectMint', {
									mints: route.params.mints,
									mintsWithBal: route.params.mintsWithBal
								})
								return
							}
							navigation.navigate('mints')
						}}
					/>
				</View>
			}
		</SafeAreaView>
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
		bottom: 20,
		left: 20,
	}
})