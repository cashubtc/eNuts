import Button, { TxtButton } from '@comps/Button'
import useCopy from '@comps/hooks/Copy'
import { AboutIcon, BitcoinIcon, CheckmarkIcon, ChevronRightIcon, CopyIcon, EyeIcon, MintBoardIcon, PenIcon, PlusIcon, QRIcon, SwapIcon, TrashbinIcon, ValidateIcon, ZapIcon } from '@comps/Icons'
import QRModal from '@comps/QRModal'
import Separator from '@comps/Separator'
import Txt from '@comps/Txt'
import TxtInput from '@comps/TxtInput'
import { _testmintUrl, isIOS } from '@consts'
import { deleteMint, deleteProofs, getMintsUrls, getProofsByMintUrl } from '@db'
import { l } from '@log'
import MyModal from '@modal'
import { BottomModal } from '@modal/Question'
import type { TMintManagementPageProps } from '@model/nav'
import TopNav from '@nav/TopNav'
import { usePromptContext } from '@src/context/Prompt'
import { useThemeContext } from '@src/context/Theme'
import { NS } from '@src/i18n'
import { _setMintName, getCustomMintNames, getDefaultMint, getMintName, setDefaultMint } from '@store/mintStore'
import { globals, mainColors } from '@styles'
import { formatMintUrl, formatSatStr } from '@util'
import { checkProofsSpent } from '@wallet'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { s, ScaledSheet, vs } from 'react-native-size-matters'

export default function MintManagement({ navigation, route }: TMintManagementPageProps) {
	const { t } = useTranslation([NS.common])
	// prompt modal
	const { openPromptAutoClose } = usePromptContext()
	const { color } = useThemeContext()
	// custom name modal
	const [customNameOpen, setCustomNameOpen] = useState(false)
	const [mintName, setMintName] = useState('')
	const [edit, setEdit] = useState(false)
	const [savedName, setSavedName] = useState('')
	// is default mint
	const [isDefault, setIsDefault] = useState(false)
	// check proofs confirmation
	const [checkProofsOpen, setCheckProofsOpen] = useState(false)
	// delete mint prompt
	const [delMintModalOpen, setDelMintModalOpen] = useState(false)
	const { copied, copy } = useCopy()
	const [qr, setQr] = useState({ open: false, error: false })

	// check if it is a default mint
	useEffect(() => {
		void (async () => {
			const defaultM = await getDefaultMint()
			setIsDefault(defaultM === route.params.mint.mintUrl)
		})()
	}, [route.params.mint.mintUrl])

	const handleMintName = async () => {
		await _setMintName(route.params.mint?.mintUrl, mintName)
		setCustomNameOpen(false)
		openPromptAutoClose({ msg: t('cutomNameAdded', { ns: NS.mints }), success: true })
	}

	const hasMintName = async () => {
		const hasName = await getMintName(route.params.mint?.mintUrl)
		setSavedName(hasName || '')
		setEdit(!!hasName)
	}

	const handleMintSwap = async () => {
		const mints = (await getMintsUrls(true))
			.filter(m => m.mintUrl !== route.params.mint?.mintUrl && m.mintUrl !== _testmintUrl)
		const remainingMints = await getCustomMintNames(mints)
		// needs at least 1 mint after filtering out the current swap-out mint and test mint
		if (!mints.length) {
			// promt
			openPromptAutoClose({ msg: t('atLeast2Mints', { ns: NS.mints }) })
			return
		}
		// cant swap out from a test mint
		if (route.params.mint?.mintUrl === _testmintUrl) {
			openPromptAutoClose({ msg: t('swapNotAllowed', { ns: NS.mints }) })
			return
		}
		// balance must be higher than 0
		if (route.params.amount < 1) {
			// promt
			openPromptAutoClose({ msg: t('lowBal', { ns: NS.mints }) })
			return
		}
		navigation.navigate('selectMintToSwapTo', {
			mint: route.params.mint,
			balance: route.params.amount,
			remainingMints
		})
	}

	const handleDefaultMint = async () => {
		const mUrl = route.params.mint?.mintUrl
		const defaultM = await getDefaultMint()
		// set or remove default
		await setDefaultMint(defaultM === mUrl ? '' : mUrl)
		setIsDefault(defaultM !== mUrl)
		openPromptAutoClose({ msg: t('updatedDefault', { ns: NS.mints }), success: true })
	}

	const handleProofCheck = async () => {
		setCheckProofsOpen(false)
		const mintUrl = route.params.mint?.mintUrl
		const proofs = await getProofsByMintUrl(mintUrl)
		const res = await checkProofsSpent(mintUrl, proofs)
		const proofsToDel = proofs.filter(p => res.map(x => x.secret).includes(p.secret))
		try {
			await deleteProofs(proofsToDel)
			openPromptAutoClose({ msg: t('deletedProofs', { ns: NS.mints, proofsToDel: proofsToDel.length }), success: true })
		} catch (e) {
			l(e)
			openPromptAutoClose({ msg: t('errDelProofs', { ns: NS.mints }) })
		}
	}

	const handleMintDelete = () => {
		void (async () => {
			try {
				const currentDefault = await getDefaultMint()
				if (currentDefault === route.params.mint?.mintUrl) {
					await setDefaultMint('')
				}
				await deleteMint(route.params.mint?.mintUrl)
				navigation.goBack()
			} catch (e) {
				l(e)
			}
		})()
	}

	return (
		<View style={{ flex: 1, backgroundColor: color.BACKGROUND }}>
			<TopNav
				screenName={t('mintSettings', { ns: NS.topNav })}
				withBackBtn
				handlePress={() => navigation.goBack()}
			/>
			<ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
				<View>
					{/* General */}
					<Txt txt={t('general', { ns: NS.mints })} styles={[styles.sectionHeader]} />
					<View style={globals(color).wrapContainer}>
						{/* Balance */}
						<View style={[globals().wrapRow, { paddingBottom: vs(15) }]}>
							<View style={styles.mintOption}>
								<View style={{ minWidth: 30 }}>
									<BitcoinIcon color={color.TEXT} />
								</View>
								<Txt txt={t('balance')} />
							</View>
							<Txt txt={formatSatStr(route.params.amount)} />
						</View>
						<Separator style={[styles.separator]} />
						{/* Mint url */}
						<MintOption
							txt={formatMintUrl(route.params.mint?.mintUrl)}
							hasSeparator
							noChevron
							onPress={() => void copy(route.params.mint?.mintUrl)}
							icon={copied ?
								<CheckmarkIcon width={s(20)} height={s(20)} color={mainColors.VALID} />
								:
								<CopyIcon color={color.TEXT} />
							}
						/>
						{/* scan url */}
						<MintOption
							txt={t('showQr', { ns: NS.history })}
							hasSeparator
							noChevron
							onPress={() => setQr({ open: true, error: false })}
							icon={<QRIcon width={s(16)} height={s(16)} color={color.TEXT} />}
						/>
						{/* Add custom name */}
						<MintOption
							txt={t('customName', { ns: NS.mints })}
							onPress={() => {
								void (async () => {
									await hasMintName()
									setCustomNameOpen(true)
								})()
							}}
							icon={<PenIcon width={s(22)} height={s(22)} color={color.TEXT} />}
							noChevron
							hasSeparator
						/>
						{/* Default */}
						<MintOption
							txt={isDefault ? t('removeDefault', { ns: NS.mints }) : t('setDefault', { ns: NS.mints })}
							onPress={() => void handleDefaultMint()}
							icon={<MintBoardIcon width={s(22)} height={s(22)} color={color.TEXT} />}
							noChevron
							hasSeparator
						/>
						{/* Mint info */}
						<MintOption
							txt={t('mintInfo', { ns: NS.mints })}
							onPress={() => navigation.navigate('mint info', { mintUrl: route.params.mint?.mintUrl })}
							icon={<AboutIcon width={s(22)} height={s(22)} color={color.TEXT} />}
						/>
					</View>
					{/* Fund management */}
					<Txt txt={t('funds', { ns: NS.mints })} styles={[styles.sectionHeader]} />
					<View style={globals(color).wrapContainer}>
						{/* Mint new tokens */}
						<MintOption
							txt={t('mintNewTokens', { ns: NS.mints })}
							hasSeparator
							onPress={() => navigation.navigate('selectAmount', { mint: route.params.mint, balance: route.params.amount })}
							icon={<PlusIcon color={color.TEXT} />}
						/>
						{/* Redeem to lightning */}
						<MintOption
							txt={t('meltToken', { ns: NS.mints })}
							hasSeparator
							onPress={() => {
								if (route.params.amount < 1) {
									openPromptAutoClose({ msg: t('noFunds') })
									return
								}
								navigation.navigate('selectTarget', {
									mint: route.params.mint,
									balance: route.params.amount,
									remainingMints: route.params.remainingMints
								})
							}}
							icon={<ZapIcon color={color.TEXT} />}
						/>
						{/* Inter-mint swap */}
						<MintOption
							txt={t('multimintSwap')}
							hasSeparator
							onPress={() => void handleMintSwap()}
							icon={<SwapIcon width={s(22)} height={s(22)} color={color.TEXT} />}
						/>
						{/* Proof list */}
						<MintOption
							txt={t('proofs', { ns: NS.wallet })}
							onPress={() => {
								if (route.params.amount < 1) {
									openPromptAutoClose({ msg: t('noProofs', { ns: NS.mints }) })
									return
								}
								navigation.navigate('mint proofs', { mintUrl: route.params.mint.mintUrl })
							}}
							icon={<EyeIcon width={s(22)} height={s(22)} color={color.TEXT} />}
						/>
					</View>
					{/* Danger zone */}
					<Txt txt={t('dangerZone', { ns: NS.mints })} styles={[styles.sectionHeader]} />
					<View style={globals(color).wrapContainer}>
						{/* Check proofs */}
						<MintOption
							txt={t('checkProofs', { ns: NS.mints })}
							hasSeparator
							onPress={() => setCheckProofsOpen(true)}
							icon={<ValidateIcon width={s(22)} height={s(22)} color={mainColors.WARN} />}
							rowColor={mainColors.WARN}
							noChevron
						/>
						{/* Delete mint */}
						<MintOption
							txt={t('delMint', { ns: NS.mints })}
							onPress={() => {
								if (route.params.amount > 0) {
									openPromptAutoClose({ msg: t('mintDelErr') })
									return
								}
								setDelMintModalOpen(true)
							}}
							icon={<TrashbinIcon width={s(22)} height={s(22)} color={mainColors.ERROR} />}
							rowColor={mainColors.ERROR}
							noChevron
						/>
					</View>
				</View>
			</ScrollView>
			{/* modal for deleting a mint */}
			{delMintModalOpen &&
				<BottomModal
					header={t('delMintSure', { ns: NS.mints })}
					txt={route.params.mint.mintUrl}
					visible={delMintModalOpen}
					confirmFn={() => handleMintDelete()}
					cancelFn={() => setDelMintModalOpen(false)}
				/>
			}
			{/* Check proofs modal */}
			{checkProofsOpen &&
				<BottomModal
					header={t('checkProofsQ', { ns: NS.mints })}
					txt={t('checkProofsTxt', { ns: NS.mints })}
					visible={checkProofsOpen}
					confirmFn={() => void handleProofCheck()}
					cancelFn={() => setCheckProofsOpen(false)}
				/>
			}
			{/* Custom mint name */}
			{customNameOpen &&
				<MyModal type='bottom' animation='slide' visible close={() => setCustomNameOpen(false)}>
					<Text style={globals(color).modalHeader}>
						{edit ? t('editMintName', { ns: NS.mints }) : t('addCustomName', { ns: NS.mints })}
					</Text>
					<TxtInput
						placeholder={t('customName', { ns: NS.mints })}
						onChangeText={setMintName}
						onSubmitEditing={() => void handleMintName()}
					/>
					{(mintName.length > 0 || savedName.length > 0) &&
						<Button
							txt={t('save')}
							onPress={() => void handleMintName()}
						/>
					}
					<TxtButton
						txt={t('cancel')}
						onPress={() => setCustomNameOpen(false)}
						style={[{ paddingTop: vs(30), paddingBottom: vs(15) }]}
					/>
				</MyModal>
			}
			<QRModal
				visible={qr.open}
				value={route.params.mint?.mintUrl}
				error={qr.error}
				close={() => setQr({ open: false, error: false })}
				onError={() => setQr({ open: true, error: true })}
				truncateNum={30}
			/>
		</View>
	)
}

interface IMintOption {
	txt: string
	onPress: () => void
	icon: React.ReactNode
	rowColor?: string
	hasSeparator?: boolean
	noChevron?: boolean
}

function MintOption({ txt, onPress, icon, rowColor, hasSeparator, noChevron }: IMintOption) {
	const { color } = useThemeContext()
	return (
		<>
			<TouchableOpacity onPress={onPress} style={[globals().wrapRow, { paddingBottom: vs(15) }]}>
				<View style={styles.mintOption}>
					<View style={{ minWidth: s(30) }}>
						{icon}
					</View>
					<Txt txt={txt} styles={[{ color: rowColor || color.TEXT }]} />
				</View>
				{!noChevron ? <ChevronRightIcon color={color.TEXT} /> : <View />}
			</TouchableOpacity>
			{hasSeparator && <Separator style={[styles.separator]} />}
		</>
	)
}

const styles = ScaledSheet.create({
	scrollContainer: {
		marginTop: '90@vs',
		marginBottom: isIOS ? '20@vs' : '0@vs',
	},
	mintUrl: {
		fontSize: '14@vs',
		marginRight: '10@s',
		fontWeight: '500',
	},
	sectionHeader: {
		fontWeight: '500',
		paddingHorizontal: '20@s',
		marginTop: '10@vs',
		marginBottom: '10@vs',
	},
	mintOption: {
		flexDirection: 'row',
		alignItems: 'center'
	},
	separator: {
		marginBottom: '15@vs'
	}
})