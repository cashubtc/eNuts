import Button, { IconBtn } from '@comps/Button'
import usePrompt from '@comps/hooks/Prompt'
import { MintBoardIcon, PlusIcon, ZapIcon } from '@comps/Icons'
import Separator from '@comps/Separator'
import Toaster from '@comps/Toaster'
import Txt from '@comps/Txt'
import { _mintUrl, defaultMints } from '@consts'
import { addMint, getMintsBalances, getMintsUrls } from '@db'
import { l } from '@log'
import MyModal from '@modal'
import { QuestionModal } from '@modal/Question'
import type { IMintBalWithName, IMintUrl } from '@model'
import type { TMintsPageProps } from '@model/nav'
import BottomNav from '@nav/BottomNav'
import TopNav from '@nav/TopNav'
import { FlashList } from '@shopify/flash-list'
import { useKeyboard } from '@src/context/Keyboard'
import { ThemeContext } from '@src/context/Theme'
import { getCustomMintNames, getDefaultMint } from '@store/mintStore'
import { globals, highlight as hi } from '@styles'
import { formatInt, formatMintUrl, isUrl } from '@util'
import { getTranslationLangCode } from '@util/localization'
import { useContext, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'

export default function Mints({ navigation, route }: TMintsPageProps) {
	const { t } = useTranslation(getTranslationLangCode())
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
			openPromptAutoClose({ msg: t('mints.invalidUrl'), ms: 1500 })
			return
		}
		try {
			// check if mint is already in db
			const mints = await getMintsUrls(true)
			if (mints.some(m => m.mintUrl === input)) {
				openPromptAutoClose({ msg: t('mints.mntAlreadyAdded'), ms: 1500 })
				return
			}
			// add mint url to db
			await addMint(input)
		} catch (e) {
			openPromptAutoClose({ msg: t('mints.mintConnectionFail'), ms: 2000 })
			l(e)
			return
		}
		openPromptAutoClose({ msg: t('mints.newMintSuccess', { mintUrl: formatMintUrl(input) }), success: true })
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
			openPromptAutoClose({ msg: t('mints.mintConnectionFail'), ms: 2000 })
			setTrustModalOpen(false)
			l(e)
			return
		}
		setTrustModalOpen(false)
		openPromptAutoClose({ msg: t('mints.newMintSuccess', { mintUrl: formatMintUrl(selectedMint.mintUrl) }), success: true })
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
			<TopNav screenName='Mints' nav={{ navigation, route }} />
			<View style={styles.topSection}>
				{/* Mints list where test mint is always visible */}
				<View style={[
					globals(color).wrapContainer,
					{
						paddingHorizontal: 0,
						height: [...defaultMints.filter(m => !isTrustedMint(m.mintUrl)), ...usertMints].length * 65
					}
				]}>
					<FlashList
						data={[...defaultMints.filter(m => !isTrustedMint(m.mintUrl)), ...usertMints]}
						estimatedItemSize={300}
						contentContainerStyle={{ paddingHorizontal: 20 }}
						renderItem={data => (
							<TouchableOpacity
								key={data.item.mintUrl}
								style={styles.mintUrlWrap}
								onPress={() => handleMintEntry(data.item, data.item.amount)}
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
								<View>
									{isTrustedMint(data.item.mintUrl) ?
										<View style={styles.mintBal}>
											<Text style={[styles.mintAmount, { color: color.TEXT }]}>
												{formatInt(data.item.amount, 'compact', 'en')}
											</Text>
											<ZapIcon width={18} height={18} color={color.TEXT} />
										</View>
										:
										<PlusIcon color={color.TEXT} />
									}
								</View>
							</TouchableOpacity>
						)}
						ItemSeparatorComponent={() => <Separator />}
					/>
				</View>
			</View>
			{/* Submit new mint URL modal */}
			<MyModal
				type='bottom'
				animation='slide'
				visible={newMintModal && !prompt.open}
				close={() => setNewMintModal(false)}
			>
				<Text style={globals(color).modalHeader}>
					{t('mints.addNewMint')}
				</Text>
				<TextInput
					style={[globals(color).input, { marginBottom: 20 }]}
					placeholder="Mint URL"
					placeholderTextColor={color.INPUT_PH}
					selectionColor={hi[highlight]}
					onChangeText={setInput}
				/>
				<Button txt={t('mints.addMintBtn')} onPress={() => { void handleMintInput() }} />
				<TouchableOpacity style={styles.cancel} onPress={() => setNewMintModal(false)}>
					<Txt txt={t('common.cancel')} styles={[globals(color, highlight).pressTxt]} />
				</TouchableOpacity>
			</MyModal>
			<QuestionModal
				header={selectedMint?.mintUrl === _mintUrl ?
					t('mints.testMintHint')
					:
					t('mints.trustMintSure')
				}
				visible={trustModalOpen}
				confirmFn={() => void handleTrustModal()}
				cancelFn={() => setTrustModalOpen(false)}
			/>
			{/* add new mint button */}
			<View style={styles.newMint}>
				<IconBtn
					icon={<PlusIcon width={15} height={15} color='#FAFAFA' />}
					onPress={() => setNewMintModal(true)}
				/>
			</View>
			{prompt.open && <Toaster success={prompt.success} txt={prompt.msg} />}
			{!isKeyboardOpen && !trustModalOpen && !newMintModal &&
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
		flex: 1,
		width: '100%',
		marginTop: 110,
		marginBottom: 75,
	},
	newMint: {
		position: 'absolute',
		right: 20,
		bottom: 80,
	},
	mintNameWrap: {
		flexDirection: 'row',
		alignItems: 'center'
	},
	mintUrlWrap: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingVertical: 20,
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
	cancel: {
		alignItems: 'center',
		marginTop: 15,
		padding: 10,
		width: '100%',
	},
})