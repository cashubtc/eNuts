/* eslint-disable @typescript-eslint/no-misused-promises */
import Button from '@comps/Button'
import usePrompt from '@comps/hooks/Prompt'
import { MintBoardIcon, PlusIcon, ZapIcon } from '@comps/Icons'
import { addMint, getMintsBalances, getMintsUrls } from '@db'
import { l } from '@log'
import MyModal from '@modal'
import { PromptModal } from '@modal/Prompt'
import { QuestionModal } from '@modal/Question'
import { IMintBalWithName } from '@model'
import { TMintsPageProps } from '@model/nav'
import BottomNav from '@nav/BottomNav'
import TopNav from '@nav/TopNav'
import { defaultMints } from '@src/consts/mints'
import { useKeyboard } from '@src/context/Keyboard'
import { ThemeContext } from '@src/context/Theme'
import { getDefaultMint, getMintBalWithName } from '@store/mintStore'
import { highlight as hi } from '@styles/colors'
import { globals } from '@styles/globals'
import { formatInt, formatMintUrl, isUrl } from '@util'
import { _mintUrl } from '@wallet'
import React, { useContext, useEffect, useState } from 'react'
import { Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'

export default function Mints({ navigation, route }: TMintsPageProps) {

	const { color, highlight } = useContext(ThemeContext)
	const { isKeyboardOpen } = useKeyboard()
	const [usertMints, setUserMints] = useState<IMintBalWithName[]>([])
	const [mintUrl, setMintUrl] = useState('')
	const [defaultMint, setDefaultM] = useState('')
	const [input, setInput] = useState('')
	const [trustModalOpen, setTrustModalOpen] = useState(false)
	const [newMintModal, setNewMintModal] = useState(false)
	const [success, setSuccess] = useState(false)
	const { prompt, openPrompt, closePrompt } = usePrompt()

	const isTrustedMint = (mintUrl: string) => usertMints.some(m => m.mint_url === mintUrl)

	// adds a mint via input
	const handleMintInput = async () => {
		if (!isUrl(input)) {
			openPrompt('Invalid URL')
			return
		}
		try {
			// check if mint is already in db
			const mints = await getMintsUrls()
			if (mints.some(m => m.mint_url === input)) {
				openPrompt('Mint already added')
				return
			}
			// add mint url to db
			await addMint(input)
		} catch (e) {
			openPrompt('Connection to mint failed')
			l(e)
			return
		}
		setNewMintModal(false)
		setSuccess(true)
		const mints = await getMintsBalances()
		setUserMints(await getMintBalWithName(mints))
	}

	// navigates to mint-management page if mint available in db or shows the trust modal
	const handleMintEntry = (selectedMintUrl: string, amount: number) => {
		// navigate to mint management page
		if (isTrustedMint(selectedMintUrl)) {
			navigation.navigate('mintmanagement', {
				mint_url: selectedMintUrl,
				amount
			})
			return
		}
		// else: add default mint to users mints
		setMintUrl(selectedMintUrl)
		setTrustModalOpen(true)
	}

	// trust modal asks user for confirmation on adding a default mint to its trusted list
	const handleTrustModal = async () => {
		try {
			await addMint(mintUrl)
		} catch (e) {
			// prompt error
			openPrompt('Connection to mint failed')
			setTrustModalOpen(false)
			l(e)
			return
		}
		setTrustModalOpen(false)
		setSuccess(true)
		// update mints list state
		const mints = await getMintsBalances()
		setUserMints(await getMintBalWithName(mints))
	}

	const handleMintsState = async () => {
		const mintsBal = await getMintsBalances()
		setUserMints(await getMintBalWithName(mintsBal))
	}

	// Show user mints with balances and default mint icon
	useEffect(() => {
		void (async () => {
			await handleMintsState()
			setDefaultM(await getDefaultMint() || '')
		})()
	}, [])

	// get mints balances and default mint after navigating to this page
	useEffect(() => {
		const focusHandler = navigation.addListener('focus', async () => {
			await handleMintsState()
			const defaultt = await getDefaultMint() || ''
			l({ defaultt })
			setDefaultM(defaultt)
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
						{[...defaultMints.filter(m => !isTrustedMint(m.mint_url)), ...usertMints]
							.map(m => (
								<View key={m.mint_url} style={styles.mintContainer}>
									<TouchableOpacity
										style={styles.mintUrlWrap}
										onPress={() => handleMintEntry(m.mint_url, m.amount)}
									>
										<View style={styles.mintNameWrap}>
											{defaultMint === m.mint_url &&
												<MintBoardIcon width={18} height={18} color={hi[highlight]} />
											}
											<Text
												style={[
													styles.mintUrl,
													{
														color: color.TEXT,
														marginLeft: defaultMint === m.mint_url ? 10 : 0
													}
												]}
											>
												{/* custom name given by user or show mint URL */}
												{m.name?.length > 0 ?
													m.name
													:
													formatMintUrl(m.mint_url)
												}
											</Text>
										</View>
										{/* Add mint icon or show balance */}
										<Text>
											{isTrustedMint(m.mint_url) ?
												<View style={styles.mintBal}>
													<Text style={[styles.mintAmount, { color: color.TEXT }]}>
														{formatInt(m.amount, 'en', 'compact')}
													</Text>
													<ZapIcon width={18} height={18} color={color.TEXT} />
												</View>
												:
												<PlusIcon color={color.TEXT} />
											}
										</Text>
									</TouchableOpacity>
									<View style={{ borderBottomWidth: 1, borderBottomColor: color.BORDER }} />
								</View>
							))}
					</ScrollView>
				</View>
			</View>
			{/* Submit new mint URL modal */}
			{newMintModal && !prompt.open &&
				<MyModal type='question' animation='fade' visible={newMintModal}>
					<Text style={globals(color).modalHeader}>
						Add a new mint
					</Text>
					<TextInput
						style={globals(color).input}
						placeholder="Mint URL"
						placeholderTextColor={color.BORDER}
						selectionColor={hi[highlight]}
						onChangeText={setInput}
					/>
					<Button txt='Add mint' onPress={handleMintInput} />
					<TouchableOpacity style={styles.cancel} onPress={() => setNewMintModal(false)}>
						<Text style={[styles.cancelTxt, { color: hi[highlight] }]}>Cancel</Text>
					</TouchableOpacity>
				</MyModal>
			}
			{trustModalOpen &&
				<QuestionModal
					header={mintUrl === _mintUrl ?
						'This is a test mint to play around with. Add it anyway?'
						:
						'Are you sure that you want to trust this mint?'
					}
					visible={trustModalOpen}
					confirmFn={() => handleTrustModal()}
					cancelFn={() => setTrustModalOpen(false)}
				/>
			}
			{/* mint added successfully modal */}
			<MyModal type='success' animation='fade' visible={success}>
				<Image
					style={styles.modalImg}
					// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
					source={require('../../../../assets/splash.png')}
				/>
				<View style={styles.successBody}>
					<Text style={globals(color).modalHeader}>
						Mint added successfully!
					</Text>
					<Button txt='OK' onPress={() => setSuccess(false)} />
				</View>
			</MyModal>
			<PromptModal header={prompt.msg} visible={prompt.open} close={closePrompt} />
			{!isKeyboardOpen && !success && !prompt.open && !trustModalOpen && !newMintModal &&
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
		marginTop: 25,
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