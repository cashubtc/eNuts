import ActionButtons from '@comps/ActionButtons'
import Button, { IconBtn } from '@comps/Button'
import { CheckCircleIcon, ChevronRightIcon, MintBoardIcon, PlusIcon, ZapIcon } from '@comps/Icons'
import Separator from '@comps/Separator'
import Txt from '@comps/Txt'
import TxtInput from '@comps/TxtInput'
import { _testmintUrl, defaultMints, isIOS } from '@consts'
import { addMint, getMintsBalances, getMintsUrls } from '@db'
import { l } from '@log'
import MyModal from '@modal'
import { QuestionModal } from '@modal/Question'
import type { IMintBalWithName, IMintUrl } from '@model'
import type { TMintsPageProps } from '@model/nav'
import TopNav from '@nav/TopNav'
import { FlashList } from '@shopify/flash-list'
import { usePromptContext } from '@src/context/Prompt'
import { useThemeContext } from '@src/context/Theme'
import { NS } from '@src/i18n'
import { getCustomMintNames, getDefaultMint } from '@store/mintStore'
import { globals, highlight as hi, mainColors } from '@styles'
import { formatInt, formatMintUrl, isErr, isUrl } from '@util'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const flashlistUntrustedHeight = isIOS ? 65 : 68
const flashlistTrustedHeight = isIOS ? 94 : 100

export default function Mints({ navigation }: TMintsPageProps) {
	const { t } = useTranslation([NS.common])
	const { prompt, closePrompt, openPromptAutoClose } = usePromptContext()
	const { color, highlight } = useThemeContext()
	const insets = useSafeAreaInsets()
	// mint list
	const [usertMints, setUserMints] = useState<IMintBalWithName[]>([])
	// this state is used to determine which mint has been pressed
	const [selectedMint, setSelectedMint] = useState<IMintUrl>()
	// the default mint url if user has set one
	const [defaultMint, setDefaultM] = useState('')
	// modal visibility state for adding a new mint
	const [newMintModal, setNewMintModal] = useState(false)
	// modal visibility for top up a newly added mint
	const [topUpModal, setTopUpModal] = useState(false)
	// the text input for adding a new mint
	const [input, setInput] = useState('')
	// visibility state for trusting a new mint that us not in the user mint list
	const [trustModalOpen, setTrustModalOpen] = useState(false)
	const isTrustedMint = (mintUrl: string) => usertMints.some(m => m.mintUrl === mintUrl)
	const allMints = [...defaultMints.filter(m => !isTrustedMint(m.mintUrl)), ...usertMints]
	const testMintRowHeight = isTrustedMint(_testmintUrl) ? 0 : flashlistUntrustedHeight

	// adds a mint via input
	const handleMintInput = async () => {
		if (!isUrl(input)) {
			openPromptAutoClose({ msg: t('invalidUrl', { ns: NS.mints }), ms: 1500 })
			return
		}
		try {
			// check if mint is already in db
			const mints = await getMintsUrls(true)
			if (mints.some(m => m.mintUrl === input)) {
				openPromptAutoClose({ msg: t('mntAlreadyAdded', { ns: NS.mints }), ms: 1500 })
				return
			}
			// add mint url to db
			await addMint(input)
		} catch (e) {
			openPromptAutoClose({ msg: isErr(e) ? e.message : t('mintConnectionFail', { ns: NS.mints }), ms: 2000 })
			return
		}
		setNewMintModal(false)
		setTopUpModal(true)
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
			openPromptAutoClose({ msg: t('mintConnectionFail', { ns: NS.mints }), ms: 2000 })
			setTrustModalOpen(false)
			l(e)
			return
		}
		setTrustModalOpen(false)
		setTopUpModal(true)
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
				withBackBtn
				handlePress={() => navigation.goBack()}
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
						renderItem={({ item }) => (
							<TouchableOpacity
								key={item.mintUrl}
								style={styles.mintUrlWrap}
								onPress={() => handleMintEntry(item, item.amount)}
							>
								<View style={styles.mintNameWrap}>
									<View style={{ flexDirection: 'row', alignItems: 'center' }}>
										{defaultMint === item.mintUrl &&
											<MintBoardIcon width={18} height={18} color={hi[highlight]} />
										}
										<Txt
											txt={item.customName || formatMintUrl(item.mintUrl)}
											styles={[{ marginLeft: defaultMint === item.mintUrl ? 10 : 0, fontWeight: '500' }]}
										/>
									</View>
									{isTrustedMint(item.mintUrl) &&
										<View style={styles.mintBal}>
											<ZapIcon color={item.amount > 0 ? hi[highlight] : color.TEXT_SECONDARY} />
											<Text style={[styles.mintAmount, { color: item.amount > 0 ? color.TEXT : color.TEXT_SECONDARY, marginBottom: 5 }]}>
												{item.amount > 0 ?
													formatInt(item.amount, 'compact', 'en') + ' Satoshi'
													:
													t('emptyMint')
												}
											</Text>
										</View>
									}
								</View>
								{/* Add mint icon or show balance */}
								<View>
									{isTrustedMint(item.mintUrl) ?
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
					{t('addNewMint', { ns: NS.mints })}
				</Text>
				<TxtInput
					keyboardType='url'
					placeholder='Mint URL'
					onChangeText={setInput}
					onSubmitEditing={() => { void handleMintInput() }}
				/>
				<Button
					txt={t('addMintBtn', { ns: NS.mints })}
					onPress={() => void handleMintInput()}
				/>
				<TouchableOpacity style={styles.cancel} onPress={() => setNewMintModal(false)}>
					<Txt txt={t('cancel')} styles={[globals(color, highlight).pressTxt]} />
				</TouchableOpacity>
			</MyModal>
			{/* Top up newly added mint */}
			<MyModal
				type='bottom'
				animation='slide'
				visible={topUpModal}
				close={() => setTopUpModal(false)}
			>
				<View style={{ alignItems: 'center', justifyContent: 'center' }}>
					<CheckCircleIcon width={50} height={50} color={mainColors.VALID} />
					<Text style={globals(color).modalHeader}>
						{t('newMintAdded', { ns: NS.mints })}
					</Text>
					<Txt
						txt={t('newMintAddedQuestion', { ns: NS.mints })}
						styles={[{ marginTop: -20, marginBottom: 30 }]}
					/>
				</View>
				<ActionButtons
					topBtnTxt={t('yes')}
					topBtnAction={() => {
						navigation.navigate('selectAmount', {
							mint: selectedMint || { mintUrl: '', customName: '' },
							balance: 0,
						})
					}}
					bottomBtnTxt={t('willDoLater')}
					bottomBtnAction={() => setTopUpModal(false)}
				/>
			</MyModal>
			<QuestionModal
				header={selectedMint?.mintUrl === _testmintUrl ?
					t('testMintHint', { ns: NS.mints })
					:
					t('trustMintSure', { ns: NS.mints })
				}
				visible={trustModalOpen}
				confirmFn={() => void handleTrustModal()}
				cancelFn={() => setTrustModalOpen(false)}
			/>
			{/* add new mint button */}
			<View style={[styles.newMint, { marginBottom: insets.bottom }]}>
				<IconBtn
					icon={<PlusIcon width={28} height={28} color='#FAFAFA' />}
					onPress={() => {
						closePrompt()
						setNewMintModal(true)
					}}
				/>
			</View>
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
		bottom: 20,
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
		marginLeft: 5,
	},
	cancel: {
		alignItems: 'center',
		marginTop: 15,
		padding: 10,
		width: '100%',
	},
})