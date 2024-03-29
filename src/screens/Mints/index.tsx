import ActionButtons from '@comps/ActionButtons'
import Button, { IconBtn, TxtButton } from '@comps/Button'
import Empty from '@comps/Empty'
import { CheckCircleIcon, ChevronRightIcon, MintBoardIcon, PlusIcon, QRIcon, ZapIcon } from '@comps/Icons'
import Separator from '@comps/Separator'
import Txt from '@comps/Txt'
import TxtInput from '@comps/TxtInput'
import { _testmintUrl } from '@consts'
import { addMint, getMintsBalances, getMintsUrls } from '@db'
import { l } from '@log'
import MyModal from '@modal'
import { BottomModal } from '@modal/Question'
import type { IMintBalWithName, IMintUrl } from '@model'
import type { TMintsPageProps } from '@model/nav'
import TopNav from '@nav/TopNav'
import { BITCOIN_MINTS_URL } from '@src/consts/urls'
import { usePromptContext } from '@src/context/Prompt'
import { useThemeContext } from '@src/context/Theme'
import { NS } from '@src/i18n'
import { getCustomMintNames, getDefaultMint } from '@store/mintStore'
import { globals, highlight as hi, mainColors } from '@styles'
import { getColor } from '@styles/colors'
import { formatMintUrl, formatSatStr, isErr, normalizeMintUrl, openUrl, sortMintsByDefault } from '@util'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { s, ScaledSheet, vs } from 'react-native-size-matters'

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
	const openTopUpModal = useCallback(() => {
		const to = setTimeout(() => {
			setTopUpModal(true)
			clearTimeout(to)
		}, 250)
	}, [])
	// the text input for adding a new mint
	const [input, setInput] = useState('')
	// visibility state for trusting a new mint that is not in the user mint list
	const [trustModalOpen, setTrustModalOpen] = useState(false)
	const isTrustedMint = (mintUrl: string) => usertMints.some(m => m.mintUrl === mintUrl)

	// adds a mint via input
	const handleMintInput = async () => {
		// Allow user to submit URL without "https://" and add it ourself if not available
		const submitted = normalizeMintUrl(input)
		if (!submitted?.length) {
			return openPromptAutoClose({ msg: t('invalidUrl', { ns: NS.mints }), ms: 1500 })
		}
		try {
			// check if mint is already in db
			const mints = await getMintsUrls(true)
			if (mints.some(m => m.mintUrl === submitted)) {
				return openPromptAutoClose({ msg: t('mntAlreadyAdded', { ns: NS.mints }), ms: 1500 })
			}
			// add mint url to db
			await addMint(submitted)
			setSelectedMint({ mintUrl: submitted })
		} catch (e) {
			return openPromptAutoClose({ msg: isErr(e) ? e.message : t('mintConnectionFail', { ns: NS.mints }), ms: 2000 })
		}
		setNewMintModal(false)
		openTopUpModal()
		const mints = await getMintsBalances()
		setUserMints(await getCustomMintNames(mints))
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
			return l(e)
		}
		setTrustModalOpen(false)
		openTopUpModal()
		// update mints list state
		const mints = await getMintsBalances()
		setUserMints(await getCustomMintNames(mints))
	}

	const handleMintsState = useCallback(async () => {
		const mintsBal = await getMintsBalances()
		setUserMints(await getCustomMintNames(mintsBal))
	}, [])

	const handleInitialRender = useCallback(async () => {
		await handleMintsState()
		const defaultt = await getDefaultMint()
		setDefaultM(defaultt ?? '')
	}, [handleMintsState])

	// Show user mints with balances and default mint icon
	useEffect(() => {
		void handleInitialRender()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	// get mints balances and default mint after navigating to this page
	useEffect(() => {
		// eslint-disable-next-line @typescript-eslint/no-misused-promises
		const focusHandler = navigation.addListener('focus', async () => {
			await handleInitialRender()
		})
		return focusHandler
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [navigation])

	return (
		<View style={[
			globals(color).container,
			styles.container
		]}>
			<TopNav
				screenName='Mints'
				withBackBtn
				handlePress={() => navigation.goBack()}
			/>
			{usertMints.length > 0 ?
				<View style={[styles.topSection, { marginBottom: 75 + insets.bottom }]}>
					{/* Mints list where test mint is always visible */}
					<ScrollView style={globals(color).wrapContainer} alwaysBounceVertical={false}>
						{sortMintsByDefault(usertMints, defaultMint).map((m, i) => (
							<View key={m.mintUrl}>
								<TouchableOpacity
									style={[globals().wrapRow, { paddingBottom: vs(15) }]}
									onPress={() => {
										const remainingMints = usertMints.filter(mint => mint.mintUrl !== m.mintUrl && mint.mintUrl !== _testmintUrl)
										navigation.navigate('mintmanagement', {
											mint: m,
											amount: m.amount,
											remainingMints
										})
									}}
								>
									<View style={styles.mintNameWrap}>
										<View style={{ flexDirection: 'row', alignItems: 'center' }}>
											{defaultMint === m.mintUrl &&
												<MintBoardIcon width={18} height={18} color={hi[highlight]} />
											}
											<Txt
												txt={m.customName || formatMintUrl(m.mintUrl)}
												bold
												styles={[{ marginLeft: defaultMint === m.mintUrl ? 10 : 0 }]}
											/>
										</View>
										{isTrustedMint(m.mintUrl) &&
											<View style={styles.mintBal}>
												{m.amount > 0 && <ZapIcon color={hi[highlight]} />}
												<Text
													style={{
														color: m.amount > 0 ? color.TEXT : color.TEXT_SECONDARY,
														marginLeft: m.amount > 0 ? 5 : 0,
														marginBottom: 5
													}}
												>
													{m.amount > 0 ? formatSatStr(m.amount, 'compact') : t('emptyMint')}
												</Text>
											</View>
										}
									</View>
									{/* Add mint icon or show balance */}
									<View>
										{isTrustedMint(m.mintUrl) ?
											<ChevronRightIcon color={color.TEXT} />
											:
											<PlusIcon color={color.TEXT} />
										}
									</View>
								</TouchableOpacity>
								{i < usertMints.length - 1 && <Separator style={[{ marginBottom: vs(15) }]} />}
							</View>
						))}
					</ScrollView>
				</View>
				:
				<Empty
					txt={t('addNewMint', { ns: NS.mints })}
					hintComponent={
						<TxtButton
							txt={t('findMint')}
							onPress={() => void openUrl(BITCOIN_MINTS_URL)?.catch(e =>
								openPromptAutoClose({ msg: isErr(e) ? e.message : t('deepLinkErr') }))
							}
						/>
					}
					pressable
					onPress={() => setNewMintModal(true)}
				/>
			}
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
				<View style={styles.wrap}>
					<TxtInput
						keyboardType='url'
						placeholder='Mint URL'
						value={input}
						onChangeText={setInput}
						onSubmitEditing={() => void handleMintInput()}
						style={[{ paddingRight: s(55) }]}
					/>
					{/* scan icon */}
					<TouchableOpacity
						style={styles.inputQR}
						onPress={() => {
							setNewMintModal(false)
							const t = setTimeout(() => {
								navigation.navigate('qr scan', {})
								clearTimeout(t)
							}, 200)
						}}
					>
						<QRIcon color={color.INPUT_PH} />
					</TouchableOpacity>
				</View>
				<Button
					txt={t('addMintBtn', { ns: NS.mints })}
					onPress={() => void handleMintInput()}
					disabled={!input.length}
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
						setTopUpModal(false)
						l({ selectedMint })
						navigation.navigate('selectAmount', {
							// either for initial default mint (selectedMint->undefined & userMints.length == 1 (user has only the 1 initial mint))
							// or mint via input (selectedMint->defined)
							mint: !selectedMint ? { mintUrl: usertMints[0].mintUrl, customName: usertMints[0].customName } : selectedMint,
							balance: 0,
						})
					}}
					bottomBtnTxt={t('willDoLater')}
					bottomBtnAction={() => {
						setTopUpModal(false)
						navigation.navigate('dashboard')
					}}
				/>
			</MyModal>
			<BottomModal
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
			{usertMints.length > 0 &&
				<View style={[styles.newMint, { marginBottom: insets.bottom }]}>
					<IconBtn
						icon={<PlusIcon width={s(30)} height={s(30)} color={getColor(highlight, color)} />}
						onPress={() => {
							closePrompt()
							setNewMintModal(true)
						}}
					/>
				</View>
			}
		</View>
	)
}

const styles = ScaledSheet.create({
	container: {
		alignItems: 'center',
		justifyContent: 'flex-start'
	},
	topSection: {
		width: '100%',
		// marginTop: 110,
	},
	wrap: {
		position: 'relative',
		width: '100%',
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
	},
	inputQR: {
		position: 'absolute',
		right: '13@s',
		height: '41@vs',
		paddingHorizontal: '10@s',
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
	mintBal: {
		flexDirection: 'row',
		alignItems: 'center',
		marginTop: 10,
	},
	cancel: {
		alignItems: 'center',
		marginTop: 15,
		padding: 10,
		width: '100%',
	},
})