import Button, { TxtButton } from '@comps/Button'
import useCopy from '@comps/hooks/Copy'
import { AboutIcon, BitcoinIcon, CheckmarkIcon, ChevronRightIcon, CopyIcon, EyeIcon, FlagIcon, MintBoardIcon, PenIcon, PlusIcon, SwapIcon, TrashbinIcon, ValidateIcon, ZapIcon } from '@comps/Icons'
import Txt from '@comps/Txt'
import TxtInput from '@comps/TxtInput'
import { _testmintUrl, isIOS } from '@consts'
import { deleteMint, deleteProofs, getMintsUrls, getProofsByMintUrl } from '@db'
import { getBackUpTokenForMint } from '@db/backup'
import { l } from '@log'
import MyModal from '@modal'
import { QuestionModal } from '@modal/Question'
import type { TMintManagementPageProps } from '@model/nav'
import TopNav from '@nav/TopNav'
import { usePromptContext } from '@src/context/Prompt'
import { useThemeContext } from '@src/context/Theme'
import { NS } from '@src/i18n'
import { _setMintName, getCustomMintNames, getDefaultMint, getMintName, setDefaultMint } from '@store/mintStore'
import { globals, mainColors } from '@styles'
import { formatInt, formatMintUrl } from '@util'
import { checkProofsSpent } from '@wallet'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
	ScrollView, StyleSheet, Text
	, TouchableOpacity, View
} from 'react-native'

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

	const handleMintBackup = async () => {
		if (route.params.amount < 1) {
			openPromptAutoClose({ msg: t('lowBackupBal', { ns: NS.mints }) })
			return
		}
		try {
			const token = await getBackUpTokenForMint(route.params.mint?.mintUrl)
			navigation.navigate('mint backup', { token, mintUrl: route.params.mint?.mintUrl })
		} catch (e) {
			l(e)
			openPromptAutoClose({ msg: t('backupNotCreated', { ns: NS.mints }) })
		}
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
		<View style={[globals(color).container, styles.container]}>
			<TopNav
				screenName={t('mintSettings', { ns: NS.topNav })}
				withBackBtn
				handlePress={() => navigation.goBack()}
			/>
			<ScrollView style={{ marginBottom: isIOS ? 30 : 0 }} showsVerticalScrollIndicator={false}>
				{/* General */}
				<Txt txt={t('general', { ns: NS.mints })} styles={[styles.sectionHeader]} />
				<View style={globals(color).wrapContainer}>
					{/* Mint url */}
					<MintOption
						txt={formatMintUrl(route.params.mint?.mintUrl)}
						hasSeparator
						noChevron
						onPress={() => void copy(route.params.mint?.mintUrl)}
						icon={copied ?
							<CheckmarkIcon width={20} height={20} color={mainColors.VALID} />
							:
							<CopyIcon color={color.TEXT} />
						}
					/>
					{/* Balance */}
					<View style={styles.mintOpts}>
						<View style={styles.mintOption}>
							<View style={{ minWidth: 30 }}>
								<BitcoinIcon color={color.TEXT} />
							</View>
							<Txt txt={t('balance')} />
						</View>
						<Txt txt={formatInt(route.params?.amount) + ' Satoshi'} />
					</View>
					<View style={[styles.line, { borderBottomColor: color.BORDER }]} />
					{/* Add custom name */}
					<MintOption
						txt={t('customName', { ns: NS.mints })}
						onPress={() => {
							void (async () => {
								await hasMintName()
								setCustomNameOpen(true)
							})()
						}}
						icon={<PenIcon width={22} height={22} color={color.TEXT} />}
						noChevron
						hasSeparator
					/>
					{/* Default */}
					<MintOption
						txt={isDefault ? t('removeDefault', { ns: NS.mints }) : t('setDefault', { ns: NS.mints })}
						onPress={() => void handleDefaultMint()}
						icon={<MintBoardIcon width={22} height={22} color={color.TEXT} />}
						noChevron
						hasSeparator
					/>
					{/* Mint info */}
					<MintOption
						txt={t('mintInfo', { ns: NS.mints })}
						onPress={() => navigation.navigate('mint info', { mintUrl: route.params.mint?.mintUrl })}
						icon={<AboutIcon width={22} height={22} color={color.TEXT} />}
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
								balance: route.params.amount
							})
						}}
						icon={<ZapIcon color={color.TEXT} />}
					/>
					{/* Inter-mint swap */}
					<MintOption
						txt={t('multimintSwap')}
						hasSeparator
						onPress={() => void handleMintSwap()}
						icon={<SwapIcon width={22} height={22} color={color.TEXT} />}
					/>
					{/* Backup mint */}
					<MintOption
						txt={t('mintBackup', { ns: NS.topNav })}
						hasSeparator
						onPress={() => void handleMintBackup()}
						icon={<FlagIcon width={22} height={22} color={color.TEXT} />}
					/>
					{/* Proof list */}
					<MintOption
						txt='Proofs'
						onPress={() => {
							if (route.params.amount < 1) {
								openPromptAutoClose({ msg: t('noProofs', { ns: NS.mints }) })
								return
							}
							navigation.navigate('mint proofs', { mintUrl: route.params.mint.mintUrl })
						}}
						icon={<EyeIcon width={22} height={22} color={color.TEXT} />}
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
						icon={<ValidateIcon width={22} height={22} color='#FF9900' />}
						rowColor='#FF9900'
						noChevron
					/>
					{/* Delete mint */}
					<MintOption
						txt={t('delMint', { ns: NS.mints })}
						onPress={() => setDelMintModalOpen(true)}
						icon={<TrashbinIcon width={22} height={22} color={mainColors.ERROR} />}
						rowColor={mainColors.ERROR}
						noChevron
					/>
				</View>
			</ScrollView>
			{/* modal for deleting a mint */}
			{delMintModalOpen &&
				<QuestionModal
					header={t('delMintSure', { ns: NS.mints })}
					txt={route.params.amount > 0 ? t('delMintHint', { ns: NS.mints }) : undefined}
					visible={delMintModalOpen}
					confirmFn={() => handleMintDelete()}
					cancelFn={() => setDelMintModalOpen(false)}
				/>
			}
			{/* Check proofs modal */}
			{checkProofsOpen &&
				<QuestionModal
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
						style={[{ paddingTop: 15, paddingBottom: 15 }]}
					/>
				</MyModal>}
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
			<TouchableOpacity onPress={onPress} style={styles.mintOpts}>
				<View style={styles.mintOption}>
					<View style={{ minWidth: 30 }}>
						{icon}
					</View>
					<Txt txt={txt} styles={[{ color: rowColor || color.TEXT }]} />
				</View>
				{!noChevron ? <ChevronRightIcon color={color.TEXT} /> : <View />}
			</TouchableOpacity>
			{hasSeparator &&
				<View style={[styles.line, { borderBottomColor: color.BORDER }]} />
			}
		</>
	)
}

const styles = StyleSheet.create({
	container: {
		paddingTop: 100
	},
	mintUrl: {
		fontSize: 16,
		marginRight: 10,
		fontWeight: '500',
	},
	sectionHeader: {
		fontWeight: '500',
		paddingHorizontal: 20,
		marginTop: 20,
		marginBottom: 10
	},
	mintOpts: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingVertical: 20,
	},
	line: {
		borderBottomWidth: 1,
	},

	cancelDel: {
		fontSize: 16,
		fontWeight: '500',
	},
	mintOption: {
		flexDirection: 'row',
		alignItems: 'center'
	}
})