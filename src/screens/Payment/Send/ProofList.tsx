import { Proof } from '@cashu/cashu-ts'
import Button from '@comps/Button'
import useLoading from '@comps/hooks/Loading'
import RadioBtn from '@comps/RadioBtn'
import Separator from '@comps/Separator'
import Txt from '@comps/Txt'
import { isIOS } from '@consts'
import MyModal from '@modal'
import type { IMintUrl, IProofSelection } from '@model'
import { FlashList } from '@shopify/flash-list'
import { usePromptContext } from '@src/context/Prompt'
import { useThemeContext } from '@src/context/Theme'
import { NS } from '@src/i18n'
import { globals } from '@styles'
import { formatInt, getSelectedAmount } from '@util'
import { getMintCurrentKeySetId, } from '@wallet'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

interface ICoinSelectionProps {
	mint?: IMintUrl
	lnAmount: number
	disableCS: () => void
	proofs: IProofSelection[]
	setProof: (proofs: IProofSelection[]) => void
}

/**
 * This component is the main container of the pressable proofs-list aka coin selection list.
 */
export function CoinSelectionModal({ mint, lnAmount, disableCS, proofs, setProof }: ICoinSelectionProps) {
	const { t } = useTranslation([NS.common])
	const { openPromptAutoClose } = usePromptContext()
	const { color, highlight } = useThemeContext()
	const [visible, setVisible] = useState(true)
	const [mintKeysetId, setMintKeysetId] = useState('')
	const { loading, startLoading, stopLoading } = useLoading()

	const cancelCoinSelection = () => {
		setVisible(false)
		disableCS()
	}

	const handleKeySetId = useCallback(async () => {
		if (!mint?.mintUrl) { return }
		startLoading()
		try {
			setMintKeysetId(await getMintCurrentKeySetId(mint.mintUrl))
		} catch (e) {
			openPromptAutoClose({ msg: 'Can not highlight the latest keyset IDs. Bad mint response.' })
		}
		stopLoading()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [mint?.mintUrl])

	// get the active keysetid of a mint once on initial render to compare with the proof keysets in the list
	useEffect(() => {
		void handleKeySetId()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [mint?.mintUrl])

	return (
		<MyModal type='invoiceAmount' animation='slide' visible={visible} close={cancelCoinSelection} hasNoPadding>
			<SafeAreaView style={{ flex: 1, width: '100%' }}>
				<View style={styles.proofContainer}>
					<View style={styles.header}>
						<Text style={globals(color).navTxt}>
							{t('coinSelection')}
						</Text>
						<TouchableOpacity
							onPress={cancelCoinSelection}
						>
							<Text style={globals(color, highlight).pressTxt}>
								{t('cancel')}
							</Text>
						</TouchableOpacity>
					</View>
					<CoinSelectionResume lnAmount={lnAmount} selectedAmount={getSelectedAmount(proofs)} padding />
					<View style={{ paddingHorizontal: 20 }}>
						<ProofListHeader />
					</View>
					{!loading &&
						<View
							style={[
								globals(color).scrollContainer,
								{
									height: Math.floor(proofs.length * (isIOS ? 62 : 70)),
									// adds a margin bottom if the "confirm" button is visible
									marginBottom: getSelectedAmount(proofs) >= lnAmount ? 80 : 0
								},
							]}
						>
							<FlashList
								data={proofs}
								estimatedItemSize={80}
								keyExtractor={item => item.secret}
								renderItem={data => (
									<CoinSelectionRow
										proof={data.item}
										isLatestKeysetId={mintKeysetId === data.item.id}
										setChecked={() => {
											const proofIdx = proofs.findIndex(proof => proof.secret === data.item.secret)
											const updated = proofs.map((p, i) => proofIdx === i ? { ...p, selected: !p.selected } : p)
											setProof(updated)
										}}
									/>
								)}
								ItemSeparatorComponent={() => <Separator noMargin />}
							/>
						</View>
					}
				</View>
				{/* Confirm button */}
				{getSelectedAmount(proofs) >= lnAmount &&
					<View style={[styles.confirmWrap, { backgroundColor: color.BACKGROUND }]}>
						<Button
							txt={t('confirm')}
							onPress={() => setVisible(false)}
						/>
					</View>
				}
			</SafeAreaView>
		</MyModal>
	)
}

interface IResume {
	lnAmount: number
	selectedAmount: number
	padding?: boolean
	estFee?: number
	withSeparator?: boolean
}

/**
 * This component shows the amount and the change of selected proofs in a pressable row of a proofs-list.
 */
export function CoinSelectionResume({ lnAmount, selectedAmount, padding, estFee, withSeparator }: IResume) {
	const { t } = useTranslation([NS.common])
	const getChangeStr = () => {
		const change = selectedAmount - lnAmount
		return estFee ? `${change} ${t('to')} ${change + estFee} Satoshi` : `${change} Satoshi`
	}
	if (withSeparator) {
		return (
			<>
				<View style={globals().wrapRow}>
					<Txt txt={t('selected')} bold />
					<Txt
						txt={`${selectedAmount}/${lnAmount} Satoshi`}
						error={selectedAmount < lnAmount}
					/>
				</View>
				{selectedAmount > lnAmount &&
					<>
						<Separator />
						<View style={globals().wrapRow}>
							<Txt txt={t('change')} bold />
							<Txt txt={getChangeStr()} />
						</View>

					</>
				}
			</>
		)
	}
	return (
		<>
			<View style={[styles.overview, { paddingHorizontal: padding ? 20 : 0 }]}>
				<Txt txt={t('selected')} />
				<Txt
					txt={`${selectedAmount}/${lnAmount} Satoshi`}
					error={selectedAmount < lnAmount}
				/>
			</View>
			{selectedAmount > lnAmount &&
				<View style={[styles.overview, { paddingHorizontal: padding ? 20 : 0 }]}>
					<Txt txt={t('change')} />
					<Txt txt={getChangeStr()} />
				</View>
			}
		</>
	)
}

/**
 * A component that shows the header of the proofs-list.
 * Margin is used for the pressable coin-selection row.
 * If the row of the proofs-list is non-pressable, margin is not required.
 */
export function ProofListHeader() {
	const { t } = useTranslation([NS.common])
	return (
		<View style={styles.tableHeader}>
			<Txt txt={t('amount')} bold />
			<Txt txt={t('keysetID')} bold />
		</View>
	)
}

interface IOverviewRowProps { txt1: string, txt2: string }

export function OverviewRow({ txt1, txt2 }: IOverviewRowProps) {
	return (
		<>
			<View style={globals().wrapRow}>
				<Txt txt={txt1} bold />
				<Txt txt={txt2} />
			</View>
			<Separator />
		</>
	)
}

/**
 * A non-pressable list entry component that only shows the proofs
 */
export function ProofRow({ proof, isLatestKeysetId }: IProofRowProps) {
	return (
		<View style={globals().scrollRow}>
			<ProofRowContent proof={proof} isLatestKeysetId={isLatestKeysetId} />
		</View>
	)
}

interface IProofRowProps {
	proof: Proof | IProofSelection
	isLatestKeysetId: boolean
}
interface ICoinSelectionRowProps extends IProofRowProps {
	setChecked: () => void
}

/**
 * A pressable list entry component that handles coin selection
 */
function CoinSelectionRow({ proof, isLatestKeysetId, setChecked }: ICoinSelectionRowProps) {
	return (
		<TouchableOpacity style={globals().scrollRow} onPress={setChecked}>
			<ProofRowContent proof={proof} isLatestKeysetId={isLatestKeysetId} />
		</TouchableOpacity>
	)
}

function ProofRowContent({ proof, isLatestKeysetId }: IProofRowProps) {
	return (
		<>
			<Txt txt={`${formatInt(proof.amount)} Satoshi`} />
			<View style={styles.keyWrap}>
				<Txt
					txt={proof.id}
					success={isLatestKeysetId}
					styles={[styles.keysetID, { marginRight: 'selected' in proof ? 20 : 0 }]}
				/>
				{'selected' in proof && <RadioBtn selected={proof.selected} />}
			</View>
		</>
	)
}

const styles = StyleSheet.create({
	proofContainer: {
		flex: 1,
		width: '100%',
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: 20,
		marginBottom: 20,
	},
	overview: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginBottom: 20,
	},
	tableHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingTop: 10,
		paddingBottom: 20,
		marginHorizontal: -20,
		paddingHorizontal: 20,
	},
	confirmWrap: {
		position: 'absolute',
		bottom: 0,
		right: 0,
		left: 0,
		padding: 20,
		paddingBottom: isIOS ? 20 : 0
	},
	keyWrap: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	keysetID: {
		fontSize: 14,
	},
})