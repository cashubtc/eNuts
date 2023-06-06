import Button from '@comps/Button'
import usePrompt from '@comps/hooks/Prompt'
import { BackupIcon, CheckmarkIcon, CopyIcon, InfoIcon, MintBoardIcon, PenIcon, PlusIcon, SwapIcon, TrashbinIcon, ValidateIcon, ZapIcon } from '@comps/Icons'
import LNInvoiceAmountModal from '@comps/InvoiceAmount'
import { deleteMint, deleteProofs, getMintsUrls, getProofsByMintUrl } from '@db'
import { getBackUpTokenForMint } from '@db/backup'
import { l } from '@log'
import MyModal from '@modal'
import { PromptModal } from '@modal/Prompt'
import { QuestionModal } from '@modal/Question'
import { TMintManagementPageProps } from '@model/nav'
import BottomNav from '@nav/BottomNav'
import TopNav from '@nav/TopNav'
import { useKeyboard } from '@src/context/Keyboard'
import { ThemeContext } from '@src/context/Theme'
import { _setMintName, getDefaultMint, getMintName, setDefaultMint } from '@store/mintStore'
import { globals, highlight as hi, mainColors } from '@styles'
import { formatInt, formatMintUrl } from '@util'
import { checkProofsSpent } from '@wallet'
import * as Clipboard from 'expo-clipboard'
import React, { useCallback, useContext, useEffect, useState } from 'react'
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'

export default function MintManagement({ navigation, route }: TMintManagementPageProps) {
	const { color, highlight } = useContext(ThemeContext)
	const { isKeyboardOpen } = useKeyboard()
	// invoice amount modal
	const [lnAmountModal, setLNAmountModal] = useState(false)
	const setLnAmountModalCB = useCallback((val: boolean) => setLNAmountModal(val), [])
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
	// prompt modal
	const { prompt, openPrompt, closePrompt } = usePrompt()

	// check if it is a default mint
	useEffect(() => {
		void (async () => {
			const defaultM = await getDefaultMint()
			setIsDefault(defaultM === route.params.mint_url)
		})()
	}, [])

	const handleMintName = async () => {
		await _setMintName(route.params.mint_url, mintName)
		setCustomNameOpen(false)
		openPrompt('Added a custom name')
	}

	const hasMintName = async () => {
		const hasName = await getMintName(route.params.mint_url)
		setSavedName(hasName || '')
		setEdit(!!hasName)
	}

	const handleMintSwap = async () => {
		const mints = (await getMintsUrls()).filter(m => m.mint_url !== route.params.mint_url)
		// needs at least 1 mint after filtering out the current swap-out mint
		if (!mints.length) {
			// promt
			openPrompt('You need at least 2 mints to perform an inter-mint swap.')
			return
		}
		// balance must be higher than 0
		if (route.params.amount < 1) {
			// promt
			openPrompt('Mint balance too low!')
			return
		}
		navigation.navigate('inter-mint swap', { mint_url: route.params.mint_url, mints, balance: route.params.amount })
	}

	const handleMintBackup = async () => {
		if (route.params.amount < 1) {
			openPrompt('The mint has no balance for a backup!')
			return
		}
		try {
			const token = await getBackUpTokenForMint(route.params.mint_url)
			navigation.navigate('mint backup', { token, mint_url: route.params.mint_url })
		} catch (e) {
			l(e)
			openPrompt('Backup token could not be created.')
		}
	}

	const handleDefaultMint = async () => {
		const mUrl = route.params.mint_url
		const defaultM = await getDefaultMint()
		// set or remove default
		await setDefaultMint(defaultM === mUrl ? '' : mUrl)
		setIsDefault(defaultM !== mUrl)
		openPrompt('Updated the default mint')
	}

	const handleProofCheck = async () => {
		setCheckProofsOpen(false)
		const mintUrl = route.params.mint_url
		const proofs = await getProofsByMintUrl(mintUrl)
		const res = await checkProofsSpent(mintUrl, proofs)
		l({ res })
		const proofsToDel = proofs.filter(p => res.map(x => x.secret).includes(p.secret))
		l({ proofsToDel })
		try {
			await deleteProofs(proofsToDel)
			openPrompt(`Deleted ${proofsToDel.length} proofs.`)
		} catch (e) {
			l(e)
			openPrompt('Something went wrong while deleting proofs.')
		}
	}

	const handleMintDelete = () => {
		void (async () => {
			try {
				const currentDefault = await getDefaultMint()
				if (currentDefault === route.params.mint_url) {
					await setDefaultMint('')
				}
				await deleteMint(route.params.mint_url)
				navigation.goBack()
			} catch (e) {
				l(e)
			}
		})()
	}

	return (
		<View style={[styles.container, { backgroundColor: color.BACKGROUND }]}>
			<TopNav withBackBtn />
			<View style={styles.content}>
				{/* Header */}
				<Text style={[globals(color).header, styles.header]}>
					Manage mint
				</Text>
				{/* Mint url */}
				<View style={styles.subHeader}>
					<Text style={[styles.mintUrl, { color: color.TEXT_SECONDARY }]}>
						{formatMintUrl(route.params?.mint_url)}
					</Text>
					{/* Copy mint url */}
					<TouchableOpacity
						style={{ padding: 5 }}
						onPress={() => {
							void Clipboard.setStringAsync(route.params?.mint_url).then(() => {
								setCopied(true)
								const t = setTimeout(() => {
									setCopied(false)
									clearTimeout(t)
								}, 3000)
							})
						}}
					>
						{copied ?
							<CheckmarkIcon width={20} height={20} color={mainColors.VALID} />
							:
							<CopyIcon color={color.TEXT_SECONDARY} />
						}
					</TouchableOpacity>
				</View>
				<ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
					{/* Balance */}
					<View style={styles.mintOpts}>
						<Text style={globals(color).txt}>
							Balance
						</Text>
						<Text style={{ color: color.TEXT }}>
							{formatInt(route.params?.amount)}{' Sat'}
						</Text>
					</View>
					<View style={[styles.line, { borderBottomColor: color.BORDER }]} />
					{/* Mint info */}
					<MintOption
						txt='Mint info'
						onPress={() => navigation.navigate('mint info', { mint_url: route.params.mint_url })}
						icon={<InfoIcon width={18} height={18} color={color.TEXT} />}
					/>
					{/* Add custom name */}
					<MintOption
						txt='Custom name'
						onPress={() => {
							void (async () => {
								await hasMintName()
								setCustomNameOpen(true)
							})()
						}}
						icon={<PenIcon width={15} height={15} color={color.TEXT} />}
					/>
					{/* Mint new tokens */}
					<MintOption
						txt='Mint new tokens'
						onPress={() => setLNAmountModal(true)}
						icon={<PlusIcon color={color.TEXT} />}
					/>
					{/* Redeem to lightning */}
					<MintOption
						txt='Melt tokens'
						onPress={() => navigation.navigate('lightning', { mint: route.params.mint_url, balance: route.params.amount, send: true })}
						icon={<ZapIcon width={18} height={18} color={color.TEXT} />}
					/>
					{/* Refresh mint-key */}
					{/* <TouchableOpacity style={styles.mintOpts}>
					<Text style={globals(color).txt}>
						Refresh mint key
					</Text>
					<RefreshIcon width={20} height={20} color={color.TEXT} />
				</TouchableOpacity>
				<View style={[styles.line, { borderBottomColor: color.BORDER }]} /> */}
					{/* Inter-mint swap */}
					<MintOption
						txt='Inter-mint swap'
						onPress={() => void handleMintSwap()}
						icon={<SwapIcon width={20} height={20} color={color.TEXT} />}
					/>
					{/* Backup mint */}
					<MintOption
						txt='Backup mint'
						onPress={() => void handleMintBackup()}
						icon={<BackupIcon width={20} height={20} color={color.TEXT} />}
					/>
					{/* Remove from default */}
					<MintOption
						txt={isDefault ? 'Remove from default' : 'Set as default mint'}
						onPress={() => void handleDefaultMint()}
						icon={<MintBoardIcon width={19} height={19} color={color.TEXT} />}
					/>
					{/* Check proofs */}
					<MintOption
						txt='Check proofs'
						onPress={() => setCheckProofsOpen(true)}
						icon={<ValidateIcon width={22} height={22} color='#FF9900' />}
						rowColor='#FF9900'
					/>
					{/* Delete mint */}
					<MintOption
						txt='Delete mint'
						onPress={() => setDelMintModalOpen(true)}
						icon={<TrashbinIcon width={16} height={16} color={color.ERROR} />}
						rowColor={color.ERROR}
					/>
				</ScrollView>
			</View>
			{/* Choose amount for LN invoice (minting) */}
			<LNInvoiceAmountModal
				lnAmountModal={lnAmountModal}
				mintUrl={route.params.mint_url}
				setLNAmountModal={setLnAmountModalCB}
			/>
			{/* LN invoice modal (minting) */}
			{/* {showInvoice &&
				<InvoiceModal
					visible={showInvoice}
					ln={LN}
					mintUrl={route.params?.mint_url}
					amount={+val}
					hash={hash}
					close={() => setShowInvoice(false)}
				/>
			} */}
			{/* modal for deleting a mint */}
			{delMintModalOpen &&
				<QuestionModal
					header='Are you sure that you want to remove this mint?'
					txt={route.params.amount > 0 ? 'Deleting a mint with balance can result in an unexpected total balance. You will keep the tokens associated with the mint, but you will not be able to redeem them until you re-add the mint.' : undefined}
					visible={delMintModalOpen}
					confirmFn={() => handleMintDelete()}
					cancelFn={() => setDelMintModalOpen(false)}
				/>
			}
			{/* Check proofs modal */}
			{checkProofsOpen &&
				<QuestionModal
					header='Are you sure that you want to check all the proofs?'
					txt='This will check if your tokens are spendable and will otherwise delete them.'
					visible={checkProofsOpen}
					confirmFn={() => {
						void handleProofCheck()
					}}
					cancelFn={() => setCheckProofsOpen(false)}
				/>
			}
			{/* Custom mint name */}
			{customNameOpen &&
				<MyModal type='bottom' animation='slide' visible={true}>
					<Text style={globals(color).modalHeader}>
						{edit ? 'Edit mint name' : 'Add a custom name'}
					</Text>
					<TextInput
						style={globals(color).input}
						placeholder="Custom mint name"
						placeholderTextColor={color.INPUT_PH}
						selectionColor={hi[highlight]}
						onChangeText={setMintName}
					/>
					{(mintName.length > 0 || savedName.length > 0) &&
						<Button
							txt='Save'
							onPress={() => {
								void handleMintName()
							}}
						/>
					}
					<TouchableOpacity onPress={() => setCustomNameOpen(false)}>
						<Text style={[styles.cancel, { color: hi[highlight] }]}>
							Cancel
						</Text>
					</TouchableOpacity>
				</MyModal>}
			{/* Prompt modal */}
			<PromptModal
				header={prompt.msg}
				visible={prompt.open}
				close={closePrompt}
				hideIcon={prompt.msg.includes('Added a custom name') || prompt.msg.includes('Updated the default mint')}
			/>
			{!isKeyboardOpen && !delMintModalOpen && !checkProofsOpen && !prompt.open &&
				<BottomNav navigation={navigation} route={route} />
			}
		</View>
	)
}

interface IMintOption {
	txt: string
	onPress: () => void
	icon: React.ReactNode
	rowColor?: string
}

function MintOption({ txt, onPress, icon, rowColor }: IMintOption) {
	const { color } = useContext(ThemeContext)
	return (
		<>
			<TouchableOpacity onPress={onPress} style={styles.mintOpts}>
				<Text style={[globals(color).txt, { color: rowColor || color.TEXT }]}>
					{txt}
				</Text>
				{icon}
			</TouchableOpacity>
			<View style={[styles.line, { borderBottomColor: color.BORDER }]} />
		</>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	scrollContainer: {
		marginBottom: 175,
	},
	content: {
		marginTop: 130,
		paddingHorizontal: 20,
	},
	header: {
		marginBottom: 0,
	},
	subHeader: {
		flexDirection: 'row',
		justifyContent: 'flex-start',
		alignItems: 'center',
		marginBottom: 20
	},
	mintUrl: {
		fontSize: 16,
		marginRight: 10,
	},
	mintOpts: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingTop: 15,
		paddingBottom: 15,
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
	cancelDelWrap: {
		width: '25%',
		alignItems: 'center',
		paddingTop: 10,
	},
	cancelDel: {
		fontSize: 16,
		fontWeight: '500',
	},
})