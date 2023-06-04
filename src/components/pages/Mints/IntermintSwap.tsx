import Button from '@comps/Button'
import useLoading from '@comps/hooks/Loading'
import usePrompt from '@comps/hooks/Prompt'
import { ArrowDownIcon } from '@comps/Icons'
import { l } from '@log'
import { PromptModal } from '@modal/Prompt'
import { TIntermintSwapPageProps } from '@model/nav'
import TopNav from '@nav/TopNav'
import { Picker } from '@react-native-picker/picker'
import { useKeyboard } from '@src/context/Keyboard'
import { ThemeContext } from '@src/context/Theme'
import { highlight as hi } from '@styles/colors'
import { globals } from '@styles/globals'
import { formatInt, formatMintUrl } from '@util'
import { autoMintSwap } from '@wallet'
import { useContext, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { TextInput } from 'react-native-gesture-handler'

export default function IntermintSwap({ navigation, route }: TIntermintSwapPageProps) {
	const { color, highlight } = useContext(ThemeContext)
	const { isKeyboardOpen } = useKeyboard()
	const [selectedMint, setSelectedMint] = useState(route.params.mints[0].mint_url)
	const [amount, setAmount] = useState('')
	const { loading, startLoading, stopLoading } = useLoading()
	const { prompt, openPrompt, closePrompt } = usePrompt()
	// const [fee, setFee] = useState(0)
	const handleSwap = async () => {
		l('swap')
		startLoading()
		// simple way
		try {
			const result = await autoMintSwap(route.params.mint_url, selectedMint, +amount)
			l({ result })
			openPrompt(`Successfully swaped ${amount} Sat from ${route.params.mint_url} to ${selectedMint}`)
		} catch (e) {
			l({ e })
			if (e instanceof Error) {
				openPrompt(e.message)
				stopLoading()
				return
			}
			openPrompt('Could not perform an inter-mint swap')
		}
		stopLoading()
	}
	return (
		<View style={[styles.container, { backgroundColor: color.BACKGROUND }]}>
			<TopNav withBackBtn />
			{/* Header */}
			<Text style={[globals(color).header, styles.header]}>
				Inter-Mint Swap
			</Text>
			{/* sub header */}
			<Text style={[styles.subHeader, { color: color.TEXT_SECONDARY }]}>
				Swap tokens from one mint for tokens from another mint.
				For a brief moment, you will be trusting two mints at the same time.
				There is things that can go wrong. Use at own risk.
			</Text>
			<View style={styles.amountWrap}>
				<TextInput
					keyboardType='numeric' // Platform.OS === 'android' ? 'number-pad' : 'numeric'
					placeholder='0'
					placeholderTextColor={hi[highlight]}
					style={[styles.amount, { color: hi[highlight] }]}
					autoFocus
					caretHidden
					onChangeText={setAmount}
					maxLength={8}
				/>
				<Text style={[globals(color).modalTxt, { color: color.TEXT_SECONDARY }]}>
					Mint balance: {formatInt(route.params.balance, 'en', 'standard')} Sat
				</Text>
			</View>
			{/* Swap-Out Mint: */}
			{!isKeyboardOpen && +amount > 0 &&
				<View>
					<Text style={[globals(color).txt, styles.mintUrl]}>
						{formatMintUrl(route.params.mint_url)}
					</Text>
					<View style={styles.iconWrap}>
						<ArrowDownIcon width={50} height={50} color={hi[highlight]} />
					</View>
					{/* Swap-In Mint: */}
					<Picker
						selectedValue={selectedMint}
						onValueChange={(value, _idx) => setSelectedMint(value)}
						dropdownIconColor={color.TEXT}
						style={styles.picker}
					>
						{route.params.mints.map(m => (
							<Picker.Item
								key={m.mint_url}
								label={formatMintUrl(m.mint_url)}
								value={m.mint_url}
								style={{ color: color.TEXT }}
							/>
						))}
					</Picker>
				</View>
			}
			<PromptModal
				header={prompt.msg.includes('Successfully') ? 'Inter-mint swap success!' : 'Something went wrong'}
				txt={prompt.msg}
				hideIcon
				visible={prompt.open}
				close={() => {
					closePrompt()
					if (prompt.msg.includes('Successfully')) {
						navigation.navigate('mints')
					}
				}}
			/>
			{!isKeyboardOpen && +amount > 0 && !prompt.open &&
				<View style={styles.actions}>
					<Button
						txt={loading ? 'Performing swap...' : 'Swap now'}
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
	header: {
		marginBottom: 0,
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