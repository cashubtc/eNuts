import { ChevronRightIcon, MintBoardIcon } from '@comps/Icons'
import Screen from '@comps/Screen'
import Separator from '@comps/Separator'
import Txt from '@comps/Txt'
import { isIOS } from '@consts'
import type { IMintUrl } from '@model'
import type { TSelectMintToSwapToPageProps } from '@model/nav'
import { FlashList } from '@shopify/flash-list'
import { useThemeContext } from '@src/context/Theme'
import { NS } from '@src/i18n'
import { getDefaultMint } from '@store/mintStore'
import { globals, highlight as hi } from '@styles'
import { formatMintUrl } from '@util'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, TouchableOpacity, View } from 'react-native'

const flashlistItemHeight = isIOS ? 60 : 65

export default function SelectMintToSwapToScreen({ navigation, route }: TSelectMintToSwapToPageProps) {
	const { mint, balance, remainingMints } = route.params
	const { t } = useTranslation([NS.mints])
	const { color, highlight } = useThemeContext()
	// the default mint url if user has set one
	const [defaultMint, setDefaultM] = useState('')
	const handlePressMint = (targetMint: IMintUrl) => {
		navigation.navigate('selectAmount', { mint, balance, isSwap: true, targetMint })
	}
	// Show user mints with balances and default mint icon
	useEffect(() => {
		void (async () => {
			setDefaultM(await getDefaultMint() ?? '')
		})()
	}, [])
	return (
		<Screen
			screenName={t('multimintSwap', { ns: NS.common })}
			withBackBtn
			handlePress={() => navigation.goBack()}
		>
			<Txt txt='Select a mint as the payment receiver.' styles={[styles.hint]} />
			{remainingMints && remainingMints.length > 0 &&
				<View style={[
					globals(color).wrapContainer,
					{ height: remainingMints.length * flashlistItemHeight }
				]}>
					<FlashList
						data={remainingMints}
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
								<ChevronRightIcon color={color.TEXT} />
							</TouchableOpacity>
						)}
						ItemSeparatorComponent={() => <Separator />}
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
})