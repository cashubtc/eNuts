import Button, { IconBtn } from '@comps/Button'
import usePrompt from '@comps/hooks/Prompt'
import { ChevronRightIcon, MintBoardIcon, PlusIcon, ZapIcon } from '@comps/Icons'
import Separator from '@comps/Separator'
import Toaster from '@comps/Toaster'
import Txt from '@comps/Txt'
import TxtInput from '@comps/TxtInput'
import { _testmintUrl, defaultMints, isIOS } from '@consts'
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
import { formatInt, formatMintUrl, isErr, isUrl } from '@util'
import { useContext, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const flashlistUntrustedHeight = isIOS ? 60 : 65
const flashlistTrustedHeight = isIOS ? 90 : 95

export default function Mints({ navigation, route }: TMintsPageProps) {
	const { t } = useTranslation(['common'])
	const { color, highlight } = useContext(ThemeContext)
	const { isKeyboardOpen } = useKeyboard()
	const insets = useSafeAreaInsets()
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
	const { prompt, closePrompt, openPromptAutoClose } = usePrompt()
	const isTrustedMint = (mintUrl: string) => usertMints.some(m => m.mintUrl === mintUrl)
	const allMints = [...defaultMints.filter(m => !isTrustedMint(m.mintUrl)), ...usertMints]
	const testMintRowHeight = isTrustedMint(_testmintUrl) ? 0 : flashlistUntrustedHeight

	// adds a mint via input
	const handleMintInput = async () => {
		if (!isUrl(input)) {
			openPromptAutoClose({ msg: t('invalidUrl', { ns: 'mints' }), ms: 1500 })
			return
		}
		try {
			// check if mint is already in db
			const mints = await getMintsUrls(true)
			if (mints.some(m => m.mintUrl === input)) {
				openPromptAutoClose({ msg: t('mntAlreadyAdded', { ns: 'mints' }), ms: 1500 })
				return
			}
			// add mint url to db
			await addMint(input)
		} catch (e) {
			openPromptAutoClose({ msg: isErr(e) ? e.message : t('mintConnectionFail', { ns: 'mints' }), ms: 2000 })
			return
		}
		openPromptAutoClose({ msg: t('newMintSuccess', { mintUrl: formatMintUrl(input), ns: 'mints' }), success: true })
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
			openPromptAutoClose({ msg: t('mintConnectionFail', { ns: 'mints' }), ms: 2000 })
			setTrustModalOpen(false)
			l(e)
			return
		}
		setTrustModalOpen(false)
		openPromptAutoClose({ msg: t('newMintSuccess', { mintUrl: formatMintUrl(selectedMint.mintUrl), ns: 'mints' }), success: true })
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
		<View style={[globals(color).container, styles.container]}>
			<TopNav
				screenName='Mints'
				handlePress={() => navigation.navigate('qr scan', { mint: undefined })}
			/>
			<View style={[styles.topSection, { marginBottom: 75 + insets.bottom }]}>
				{/* Mints list where test mint is always visible */}
				<View style={[
					globals(color).wrapContainer,
					{
						paddingHorizontal: 0,
						height: usertMints.length * flashlistTrustedHeight + testMintRowHeight
					}
				]}>
					<FlashList
						data={allMints}
						estimatedItemSize={300}
						contentContainerStyle={{ paddingHorizontal: 20 }}
						renderItem={data => (
							<TouchableOpacity
								key={data.item.mintUrl}
								style={styles.mintUrlWrap}
								onPress={() => handleMintEntry(data.item, data.item.amount)}
							>
								<View style={styles.mintNameWrap}>
									<View style={{ flexDirection: 'row', alignItems: 'center' }}>
										{defaultMint === data.item.mintUrl &&
											<MintBoardIcon width={18} height={18} color={hi[highlight]} />
										}
										<Txt
											txt={data.item.customName || formatMintUrl(data.item.mintUrl)}
											styles={[{ marginLeft: defaultMint === data.item.mintUrl ? 10 : 0, fontWeight: '500' }]}
										/>
									</View>
									{isTrustedMint(data.item.mintUrl) &&
										<View style={styles.mintBal}>
											<ZapIcon width={18} height={18} color={color.TEXT} />
											<Text style={[styles.mintAmount, { color: color.TEXT }]}>
												{formatInt(data.item.amount, 'compact', 'en') + ' Satoshi'}
											</Text>
										</View>
									}
								</View>
								{/* Add mint icon or show balance */}
								<View>
									{isTrustedMint(data.item.mintUrl) ?
										<ChevronRightIcon color={color.TEXT} />
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
					{t('addNewMint', { ns: 'mints' })}
				</Text>
				<TxtInput
					keyboardType='url'
					placeholder='Mint URL'
					onChangeText={setInput}
					onSubmitEditing={() => { void handleMintInput() }}
				/>
				<Button
					txt={t('addMintBtn', { ns: 'mints' })}
					icon={<PlusIcon color='#FAFAFA' />}
					onPress={() => void handleMintInput()}
				/>
				<TouchableOpacity style={styles.cancel} onPress={() => setNewMintModal(false)}>
					<Txt txt={t('cancel')} styles={[globals(color, highlight).pressTxt]} />
				</TouchableOpacity>
			</MyModal>
			<QuestionModal
				header={selectedMint?.mintUrl === _testmintUrl ?
					t('testMintHint', { ns: 'mints' })
					:
					t('trustMintSure', { ns: 'mints' })
				}
				visible={trustModalOpen}
				confirmFn={() => void handleTrustModal()}
				cancelFn={() => setTrustModalOpen(false)}
			/>
			{/* add new mint button */}
			<View style={[styles.newMint, { marginBottom: insets.bottom }]}>
				<IconBtn
					icon={<PlusIcon width={15} height={15} color='#FAFAFA' />}
					onPress={() => {
						closePrompt()
						setNewMintModal(true)
					}}
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
		paddingTop: 0,
		alignItems: 'center',
	},
	topSection: {
		flex: 1,
		width: '100%',
		marginTop: 110,
	},
	newMint: {
		position: 'absolute',
		right: 20,
		bottom: 80,
	},
	mintNameWrap: {
		flexDirection: 'column',
		alignItems: 'flex-start'
	},
	mintUrlWrap: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingVertical: 20,
	},
	mintBal: {
		flexDirection: 'row',
		alignItems: 'center',
		marginTop: 10,
	},
	mintAmount: {
		marginLeft: 10,
	},
	cancel: {
		alignItems: 'center',
		marginTop: 15,
		padding: 10,
		width: '100%',
	},
})