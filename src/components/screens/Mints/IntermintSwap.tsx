import Button from '@comps/Button'
import useLoading from '@comps/hooks/Loading'
import usePrompt from '@comps/hooks/Prompt'
import { ArrowDownIcon } from '@comps/Icons'
import Txt from '@comps/Txt'
import { l } from '@log'
import type { TIntermintSwapPageProps } from '@model/nav'
import TopNav from '@nav/TopNav'
import { Picker } from '@react-native-picker/picker'
import { useKeyboard } from '@src/context/Keyboard'
import { ThemeContext } from '@src/context/Theme'
import { getTranslationLangCode } from '@src/util/localization'
import { getMintName } from '@store/mintStore'
import { globals, highlight as hi } from '@styles'
import { cleanUpNumericStr, formatInt, formatMintUrl, isErr } from '@util'
import { autoMintSwap } from '@wallet'
import { useContext, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { TextInput } from 'react-native-gesture-handler'

export default function IntermintSwap({ navigation, route }: TIntermintSwapPageProps) {
	const { t } = useTranslation(getTranslationLangCode())
	const { color, highlight } = useContext(ThemeContext)
	const { isKeyboardOpen } = useKeyboard()
	const [selectedMint, setSelectedMint] = useState(route.params.mints[0])
	const [amount, setAmount] = useState('')
	const { loading, startLoading, stopLoading } = useLoading()
	const { prompt, openPromptAutoClose } = usePrompt()
	// const [fee, setFee] = useState(0)
	const handleSwap = async () => {
		startLoading()
		// simple way
		try {
			const result = await autoMintSwap(route.params.swap_out_mint.mintUrl, selectedMint.mintUrl, +amount)
			l({ swapResult: result })
			openPromptAutoClose({
				msg: t('mints.swapSuccess', { amount, srcMint: route.params.swap_out_mint.mintUrl, targetMint: selectedMint.mintUrl }),
				success: true
			})
		} catch (e) {
			l(e)
			openPromptAutoClose({ msg: isErr(e) ? e.message : t('mints.swapFail') })
			stopLoading()
		}
		stopLoading()
		if (prompt.success) { navigation.navigate('mints') }
	}
	return (
		<View style={[styles.container, { backgroundColor: color.BACKGROUND }]}>
			<TopNav screenName={t('topNav.swap')} withBackBtn />
			{/* sub header */}
			<Text style={[styles.subHeader, { color: color.TEXT_SECONDARY }]}>
				{t('mints.swapRisk')}
			</Text>
			<View style={styles.amountWrap}>
				<TextInput
					keyboardType='numeric' // Platform.OS === 'android' ? 'number-pad' : 'numeric'
					placeholder='0'
					placeholderTextColor={hi[highlight]}
					style={[styles.amount, { color: hi[highlight] }]}
					autoFocus
					caretHidden
					onChangeText={amount => setAmount(cleanUpNumericStr(amount))}
					maxLength={8}
					value={amount}
				/>
				<Text style={[globals(color).modalTxt, { color: color.TEXT_SECONDARY }]}>
					{t('common.mintBalance')}: {formatInt(route.params.balance)} Satoshi
				</Text>
			</View>
			{/* Swap-Out Mint: */}
			{!isKeyboardOpen && +amount > 0 &&
				<View>
					<Txt
						txt={route.params.swap_out_mint.customName || formatMintUrl(route.params.swap_out_mint.mintUrl)}
						styles={[styles.mintUrl]}
					/>
					<View style={styles.iconWrap}>
						<ArrowDownIcon width={50} height={50} color={hi[highlight]} />
					</View>
					{/* Swap-In Mint: */}
					<Picker
						selectedValue={selectedMint.mintUrl}
						onValueChange={(value, _idx) => {
							void (async () => {
								const customName = await getMintName(value)
								setSelectedMint({ mintUrl: value, customName: customName || '' })
							})()
						}}
						dropdownIconColor={color.TEXT}
						style={styles.picker}
					>
						{route.params.mints.map(m => (
							<Picker.Item
								key={m.mintUrl}
								label={m.customName || formatMintUrl(m.mintUrl)}
								value={m.mintUrl}
								style={{ color: color.TEXT }}
							/>
						))}
					</Picker>
				</View>
			}
			{!isKeyboardOpen && +amount > 0 && !prompt.open &&
				<View style={styles.actions}>
					<Button
						txt={loading ? t('mints.performingSwap') + '...' : t('mints.swapNow')}
						loading={loading}
						onPress={() => {
							if (loading) { return }
							void handleSwap()
						}}
					/>
				</View>
			}
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		paddingTop: 130,
		paddingHorizontal: 20,
	},
	subHeader: {
		fontSize: 16,
		marginBottom: 40,
	},
	amountWrap: {
		width: '100%',
		alignItems: 'center',
		marginTop: -20
	},
	amount: {
		fontSize: 40,
		width: '100%',
		textAlign: 'center',
	},
	mintUrl: {
		fontWeight: '500',
		textAlign: 'center',
	},
	iconWrap: {
		alignItems: 'center',
		paddingVertical: 20,
	},
	picker: {
		marginHorizontal: -15
	},
	actions: {
		position: 'absolute',
		right: 0,
		bottom: 0,
		left: 0,
		padding: 20,
	}
})