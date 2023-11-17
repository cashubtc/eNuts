import { ChevronRightIcon, MintBoardIcon } from '@comps/Icons'
import Screen from '@comps/Screen'
import Separator from '@comps/Separator'
import Txt from '@comps/Txt'
import type { IMintUrl } from '@model'
import type { TSelectMintToSwapToPageProps } from '@model/nav'
import { useThemeContext } from '@src/context/Theme'
import { NS } from '@src/i18n'
import { getDefaultMint } from '@store/mintStore'
import { globals, highlight as hi } from '@styles'
import { formatMintUrl } from '@util'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native'

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
			<Txt txt={t('selectSwapReceiver')} styles={[styles.hint]} />
			{remainingMints && remainingMints.length > 0 &&
				<ScrollView>
					<View style={globals(color).wrapContainer}>
						{remainingMints.map((m, i) => (
							<View key={m.mintUrl}>
								<TouchableOpacity
									key={m.mintUrl}
									style={styles.mintUrlWrap}
									onPress={() => void handlePressMint(m)}
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
									<ChevronRightIcon color={color.TEXT} />
								</TouchableOpacity>
								{i < remainingMints.length - 1 && <Separator />}
							</View>
						))}

					</View>
				</ScrollView>
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
		paddingBottom: 20,
	},
	mintNameWrap: {
		flexDirection: 'row',
		alignItems: 'center'
	},
})