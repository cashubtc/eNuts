import Button from '@comps/Button'
import usePrompt from '@comps/hooks/Prompt'
import { MintBoardIcon, PlusIcon, ZapIcon } from '@comps/Icons'
import Toaster from '@comps/Toaster'
import { _mintUrl, defaultMints } from '@consts'
import { addMint, getMintsBalances, getMintsUrls } from '@db'
import { l } from '@log'
import MyModal from '@modal'
import { QuestionModal } from '@modal/Question'
import { IMintBalWithName, IMintUrl } from '@model'
import { TMintsPageProps } from '@model/nav'
import BottomNav from '@nav/BottomNav'
import TopNav from '@nav/TopNav'
import { useKeyboard } from '@src/context/Keyboard'
import { ThemeContext } from '@src/context/Theme'
import { getCustomMintNames, getDefaultMint } from '@store/mintStore'
import { globals, highlight as hi } from '@styles'
import { formatInt, formatMintUrl, isUrl } from '@util'
import { useContext, useEffect, useState } from 'react'
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'

export default function Mints({ navigation, route }: TMintsPageProps) {

	const { color, highlight } = useContext(ThemeContext)
	const { isKeyboardOpen } = useKeyboard()
	// mint list
	const [usertMints, setUserMints] = useState<IMintBalWithName[]>([])
	// this state is used to determine which mint has been pressed
	const [selectedMint, setSelectedMint] = useState<IMintUrl>()
	// the default mint url if user has set one
	const [defaultMint, setDefaultM] = useState('')
	// modal visibility state for adding a new mint
	const [newMintModal, setNewMintModal] = useState(false)
	// the text input for adding a new mint
	const [input, setInput] = useState('')
	// visibility state for trusting a new mint that us not in the user mint list
	const [trustModalOpen, setTrustModalOpen] = useState(false)
	const { prompt, openPromptAutoClose } = usePrompt()

	const isTrustedMint = (mintUrl: string) => usertMints.some(m => m.mintUrl === mintUrl)

	// adds a mint via input
	const handleMintInput = async () => {
		if (!isUrl(input)) {
			openPromptAutoClose(false, 'Invalid URL')
			return
		}
		try {
			// check if mint is already in db
			const mints = await getMintsUrls(true)
			if (mints.some(m => m.mintUrl === input)) {
				openPromptAutoClose(false, 'Mint already added')
				return
			}
			// add mint url to db
			await addMint(input)
		} catch (e) {
			openPromptAutoClose(false, 'Connection to mint failed')
			l(e)
			return
		}
		openPromptAutoClose(true, `${formatMintUrl(input)} added successfully`)
		setNewMintModal(false)
		const mints = await getMintsBalances()
		setUserMints(await getCustomMintNames(mints))
	}

	// navigates to mint-management page if mint available in db or shows the trust modal
	const handleMintEntry = (selectedMintEntry: IMintUrl, amount: number) => {
		// navigate to mint management page
		if (isTrustedMint(selectedMintEntry.mintUrl)) {
			navigation.navigate('mintmanagement', {
				mint: selectedMintEntry,
				amount
			})
			return
		}
		// else: add default mint to users mints
		setSelectedMint(selectedMintEntry)
		setTrustModalOpen(true)
	}

	// trust modal asks user for confirmation on adding a default mint to its trusted list
	const handleTrustModal = async () => {
		if (!selectedMint) { return }
		try {
			await addMint(selectedMint.mintUrl)
		} catch (e) {
			// prompt error
			openPromptAutoClose(false, 'Connection to mint failed')
			setTrustModalOpen(false)
			l(e)
			return
		}
		setTrustModalOpen(false)
		openPromptAutoClose(true, `${formatMintUrl(selectedMint.mintUrl)} added successfully`)
		// update mints list state
		const mints = await getMintsBalances()
		setUserMints(await getCustomMintNames(mints))
	}

	const handleMintsState = async () => {
		const mintsBal = await getMintsBalances()
		setUserMints(await getCustomMintNames(mintsBal))
	}

	// Show user mints with balances and default mint icon
	useEffect(() => {
		void (async () => {
			await handleMintsState()
			setDefaultM(await getDefaultMint() ?? '')
		})()
	}, [])

	// get mints balances and default mint after navigating to this page
	useEffect(() => {
		// eslint-disable-next-line @typescript-eslint/no-misused-promises
		const focusHandler = navigation.addListener('focus', async () => {
			await handleMintsState()
			const defaultt = await getDefaultMint()
			setDefaultM(defaultt ?? '')
		})
		return focusHandler
	}, [navigation])

	return (
		<View style={[styles.container, { backgroundColor: color.BACKGROUND }]}>
			<View style={styles.topSection}>
				<TopNav nav={{ navigation, route }} />
				<View style={styles.topContent}>
					{/* Header */}
					<View style={[styles.headerWrap, { marginBottom: 20 }]}>
						<Text style={[globals(color).header, { marginBottom: 0 }]}>
							My mints
						</Text>
						<TouchableOpacity
							style={{ paddingVertical: 10 }}
							onPress={() => setNewMintModal(true)}
						>
							<PlusIcon width={22} height={22} color={color.TEXT} />
						</TouchableOpacity>
					</View>
					{/* Mints list where test mint is always visible */}
					<ScrollView showsVerticalScrollIndicator={false}>
						{[...defaultMints.filter(m => !isTrustedMint(m.mintUrl)), ...usertMints]
							.map(m => (
								<View key={m.mintUrl} style={styles.mintContainer}>
									<TouchableOpacity
										style={styles.mintUrlWrap}
										onPress={() => handleMintEntry(m, m.amount)}
									>
										<View style={styles.mintNameWrap}>
											{defaultMint === m.mintUrl &&
												<MintBoardIcon width={18} height={18} color={hi[highlight]} />
											}
											<Text
												style={[
													styles.mintUrl,
													{
														color: color.TEXT,
														marginLeft: defaultMint === m.mintUrl ? 10 : 0
													}
												]}
											>
												{/* custom name given by user or show mint URL */}
												{m.customName || formatMintUrl(m.mintUrl)}
											</Text>
										</View>
										{/* Add mint icon or show balance */}
										<View>
											{isTrustedMint(m.mintUrl) ?
												<View style={styles.mintBal}>
													<Text style={[styles.mintAmount, { color: color.TEXT }]}>
														{formatInt(m.amount, 'compact', 'en')}
													</Text>
													<ZapIcon width={18} height={18} color={color.TEXT} />
												</View>
												:
												<PlusIcon color={color.TEXT} />
											}
										</View>
									</TouchableOpacity>
									<View style={{ borderBottomWidth: 1, borderBottomColor: color.BORDER }} />
								</View>
							))}
					</ScrollView>
				</View>
			</View>
			{/* Submit new mint URL modal */}
			{newMintModal &&
				<MyModal type='bottom' animation='slide' visible={newMintModal}>
					<Text style={globals(color).modalHeader}>
						Add a new mint
					</Text>
					<TextInput
						style={[globals(color).input, { marginBottom: 20 }]}
						placeholder="Mint URL"
						placeholderTextColor={color.BORDER}
						selectionColor={hi[highlight]}
						onChangeText={setInput}
					/>
					<Button txt='Add mint' onPress={() => { void handleMintInput() }} />
					<TouchableOpacity style={styles.cancel} onPress={() => setNewMintModal(false)}>
						<Text style={[styles.cancelTxt, { color: hi[highlight] }]}>Cancel</Text>
					</TouchableOpacity>
				</MyModal>
			}
			{trustModalOpen &&
				<QuestionModal
					header={selectedMint?.mintUrl === _mintUrl ?
						'This is a test mint to play around with. Add it anyway?'
						:
						'Are you sure that you want to trust this mint?'
					}
					visible={trustModalOpen}
					// eslint-disable-next-line @typescript-eslint/no-misused-promises
					confirmFn={() => handleTrustModal()}
					cancelFn={() => setTrustModalOpen(false)}
				/>
			}
			{/* mint added successfully modal */}
			{prompt.open && <Toaster success={prompt.success} txt={prompt.msg} /> }
			{!isKeyboardOpen && !prompt.open && !trustModalOpen && !newMintModal &&
				<BottomNav navigation={navigation} route={route} />
			}
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: 'center',
	},
	topSection: {
		width: '100%',
		paddingHorizontal: 20,
		paddingTop: 20,
		paddingBottom: 225,
	},
	topContent: {
		marginTop: 110,
	},
	headerWrap: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	mintNameWrap: {
		flexDirection: 'row',
		alignItems: 'center'
	},
	loading: {
		fontSize: 16,
		fontWeight: '500',
		textAlign: 'center',
	},
	mintsWrap: {
		width: '100%',
	},
	mintContainer: {
		height: 60,
	},
	mintUrlWrap: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingTop: 15,
		paddingBottom: 15,
	},
	mintUrl: {
		fontSize: 16,
	},
	actionWrap: {
		position: 'absolute',
		left: 0,
		right: 0,
		paddingTop: 20,
		paddingRight: 20,
		paddingLeft: 20,
	},
	modalImg: {
		width: '100%',
		height: 200,
		borderTopLeftRadius: 20,
		borderTopRightRadius: 20,
	},
	successBody: {
		width: '100%',
		padding: 20,
	},
	mintBal: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
	},
	mintAmount: {
		marginRight: 5,
	},
	mintHint: {
		fontSize: 16,
		marginTop: 20,
	},
	cancel: {
		alignItems: 'center',
		marginTop: 15,
		padding: 10,
		width: '100%',
	},
	cancelTxt: {
		fontSize: 16,
		fontWeight: '500',
	},
	howToLink: {
		textDecorationLine: 'underline',
		fontSize: 16,
	},
})