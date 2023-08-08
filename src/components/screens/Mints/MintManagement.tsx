import Button from '@comps/Button'
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
import { _setMintName, getCustomMintNames, getDefaultMint, getMintName, setDefaultMint } from '@store/mintStore'
import { globals, highlight as hi, mainColors } from '@styles'
import { formatInt, formatMintUrl } from '@util'
import { checkProofsSpent } from '@wallet'
import * as Clipboard from 'expo-clipboard'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
	ScrollView, StyleSheet, Text
	, TouchableOpacity, View
} from 'react-native'

export default function MintManagement({ navigation, route }: TMintManagementPageProps) {
	const { t } = useTranslation(['common'])
	// prompt modal
	const { openPromptAutoClose } = usePromptContext()
	const { color, highlight } = useThemeContext()
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
	const [copied, setCopied] = useState(false)

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
		openPromptAutoClose({ msg: t('cutomNameAdded', { ns: 'mints' }), success: true })
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
			openPromptAutoClose({ msg: t('atLeast2Mints', { ns: 'mints' }) })
			return
		}
		// cant swap out from a test mint
		if (route.params.mint?.mintUrl === _testmintUrl) {
			openPromptAutoClose({ msg: t('swapNotAllowed', { ns: 'mints' }) })
			return
		}
		// balance must be higher than 0
		if (route.params.amount < 1) {
			// promt
			openPromptAutoClose({ msg: t('lowBal', { ns: 'mints' }) })
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
			openPromptAutoClose({ msg: t('lowBackupBal', { ns: 'mints' }) })
			return
		}
		try {
			const token = await getBackUpTokenForMint(route.params.mint?.mintUrl)
			navigation.navigate('mint backup', { token, mintUrl: route.params.mint?.mintUrl })
		} catch (e) {
			l(e)
			openPromptAutoClose({ msg: t('backupNotCreated', { ns: 'mints' }) })
		}
	}

	const handleDefaultMint = async () => {
		const mUrl = route.params.mint?.mintUrl
		const defaultM = await getDefaultMint()
		// set or remove default
		await setDefaultMint(defaultM === mUrl ? '' : mUrl)
		setIsDefault(defaultM !== mUrl)
		openPromptAutoClose({ msg: t('updatedDefault', { ns: 'mints' }), success: true })
	}

	const handleProofCheck = async () => {
		setCheckProofsOpen(false)
		const mintUrl = route.params.mint?.mintUrl
		const proofs = await getProofsByMintUrl(mintUrl)
		const res = await checkProofsSpent(mintUrl, proofs)
		l({ res })
		const proofsToDel = proofs.filter(p => res.map(x => x.secret).includes(p.secret))
		l({ proofsToDel })
		try {
			await deleteProofs(proofsToDel)
			openPromptAutoClose({ msg: t('deletedProofs', { ns: 'mints', proofsToDel: proofsToDel.length }), success: true })
		} catch (e) {
			l(e)
			openPromptAutoClose({ msg: t('errDelProofs', { ns: 'mints' }) })
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
				screenName={t('mintSettings', { ns: 'topNav' })}
				withBackBtn
				handlePress={() => navigation.goBack()}
			/>
			<ScrollView style={{ marginBottom: isIOS ? 30 : 0 }} showsVerticalScrollIndicator={false}>
				{/* General */}
				<Txt txt={t('general', { ns: 'mints' })} styles={[styles.sectionHeader]} />
				<View style={globals(color).wrapContainer}>
					{/* Mint url */}
					<MintOption
						txt={formatMintUrl(route.params.mint?.mintUrl)}
						hasSeparator
						noChevron
						onPress={() => {
							void Clipboard.setStringAsync(route.params.mint?.mintUrl).then(() => {
								setCopied(true)
								const t = setTimeout(() => {
									setCopied(false)
									clearTimeout(t)
								}, 3000)
							})
						}}
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
						txt={t('customName', { ns: 'mints' })}
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
						txt={isDefault ? t('removeDefault', { ns: 'mints' }) : t('setDefault', { ns: 'mints' })}
						onPress={() => void handleDefaultMint()}
						icon={<MintBoardIcon width={22} height={22} color={color.TEXT} />}
						noChevron
						hasSeparator
					/>
					{/* Mint info */}
					<MintOption
						txt={t('mintInfo', { ns: 'mints' })}
						onPress={() => navigation.navigate('mint info', { mintUrl: route.params.mint?.mintUrl })}
						icon={<AboutIcon width={22} height={22} color={color.TEXT} />}
					/>
				</View>
				{/* Fund management */}
				<Txt txt={t('funds', { ns: 'mints' })} styles={[styles.sectionHeader]} />
				<View style={globals(color).wrapContainer}>
					{/* Mint new tokens */}
					<MintOption
						txt={t('mintNewTokens', { ns: 'mints' })}
						hasSeparator
						onPress={() => navigation.navigate('selectAmount', { mint: route.params.mint, balance: route.params.amount })}
						icon={<PlusIcon color={color.TEXT} />}
					/>
					{/* Redeem to lightning */}
					<MintOption
						txt={t('meltToken', { ns: 'mints' })}
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
						txt={t('mintBackup', { ns: 'topNav' })}
						hasSeparator
						onPress={() => void handleMintBackup()}
						icon={<FlagIcon width={22} height={22} color={color.TEXT} />}
					/>
					{/* Proof list */}
					<MintOption
						txt='Proofs'
						onPress={() => {
							if (route.params.amount < 1) {
								openPromptAutoClose({ msg: t('noProofs', { ns: 'mints' }) })
								return
							}
							navigation.navigate('mint proofs', { mintUrl: route.params.mint.mintUrl })
						}}
						icon={<EyeIcon width={22} height={22} color={color.TEXT} />}
					/>
				</View>
				{/* Danger zone */}
				<Txt txt={t('dangerZone', { ns: 'mints' })} styles={[styles.sectionHeader]} />
				<View style={globals(color).wrapContainer}>
					{/* Check proofs */}
					<MintOption
						txt={t('checkProofs', { ns: 'mints' })}
						hasSeparator
						onPress={() => setCheckProofsOpen(true)}
						icon={<ValidateIcon width={22} height={22} color='#FF9900' />}
						rowColor='#FF9900'
						noChevron
					/>
					{/* Delete mint */}
					<MintOption
						txt={t('delMint', { ns: 'mints' })}
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
					header={t('delMintSure', { ns: 'mints' })}
					txt={route.params.amount > 0 ? t('delMintHint', { ns: 'mints' }) : undefined}
					visible={delMintModalOpen}
					confirmFn={() => handleMintDelete()}
					cancelFn={() => setDelMintModalOpen(false)}
				/>
			}
			{/* Check proofs modal */}
			{checkProofsOpen &&
				<QuestionModal
					header={t('checkProofsQ', { ns: 'mints' })}
					txt={t('checkProofsTxt', { ns: 'mints' })}
					visible={checkProofsOpen}
					confirmFn={() => void handleProofCheck()}
					cancelFn={() => setCheckProofsOpen(false)}
				/>
			}
			{/* Custom mint name */}
			{customNameOpen &&
				<MyModal type='bottom' animation='slide' visible close={() => setCustomNameOpen(false)}>
					<Text style={globals(color).modalHeader}>
						{edit ? t('editMintName', { ns: 'mints' }) : t('addCustomName', { ns: 'mints' })}
					</Text>
					<TxtInput
						placeholder={t('customName', { ns: 'mints' })}
						onChangeText={setMintName}
						onSubmitEditing={() => void handleMintName()}
					/>
					{(mintName.length > 0 || savedName.length > 0) &&
						<Button
							txt={t('save')}
							onPress={() => void handleMintName()}
						/>
					}
					<TouchableOpacity onPress={() => setCustomNameOpen(false)}>
						<Text style={[styles.cancel, { color: hi[highlight] }]}>
							{t('cancel')}
						</Text>
					</TouchableOpacity>
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
	cancel: {
		fontSize: 16,
		fontWeight: '500',
		marginTop: 25,
		marginBottom: 10,
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