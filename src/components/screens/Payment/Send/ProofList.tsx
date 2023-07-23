import Button from '@comps/Button'
import useLoading from '@comps/hooks/Loading'
import Separator from '@comps/Separator'
import Txt from '@comps/Txt'
import { isIOS } from '@consts'
import MyModal from '@modal'
import type { IMintUrl, IProofSelection } from '@model'
import { FlashList } from '@shopify/flash-list'
import { ThemeContext } from '@src/context/Theme'
import { globals, mainColors } from '@styles'
import { getSelectedAmount } from '@util'
import { getMintCurrentKeySetId, } from '@wallet'
import { useContext, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

import { CoinSelectionRow } from './CoinSelection'

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
	const { t } = useTranslation(['common'])
	const { color, highlight } = useContext(ThemeContext)
	const [visible, setVisible] = useState(true)
	const [mintKeysetId, setMintKeysetId] = useState('')
	const { loading, startLoading, stopLoading } = useLoading()
	const cancelCoinSelection = () => {
		setVisible(false)
		disableCS()
	}
	// get the active keysetid of a mint once on initial render to compare with the proof keysets in the list
	useEffect(() => {
		if (!mint?.mintUrl) { return }
		void (async () => {
			startLoading()
			setMintKeysetId(await getMintCurrentKeySetId(mint.mintUrl))
			stopLoading()
		})()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [mint?.mintUrl])
	return (
		<MyModal type='invoiceAmount' animation='slide' visible={visible} close={cancelCoinSelection} hasNoPadding>
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
							globals(color).wrapContainer,
							{
								flex: 1,
								paddingHorizontal: 0,
								height: Math.floor(proofs.length * (isIOS ? 51 : 56)),
								// adds a margin bottom if the "confirm" button is visible
								marginBottom: getSelectedAmount(proofs) >= lnAmount ? 90 : 0
							},
						]}
					>
						<FlashList
							data={proofs}
							estimatedItemSize={300}
							showsVerticalScrollIndicator={false}
							contentContainerStyle={{ paddingHorizontal: 20 }}
							ItemSeparatorComponent={() => <Separator />}
							renderItem={data => (
								<CoinSelectionRow
									key={data.item.secret}
									proof={data.item}
									isLatestKeysetId={mintKeysetId === data.item.id}
									setChecked={() => {
										const proofIdx = proofs.findIndex(proof => proof.secret === data.item.secret)
										const updated = proofs.map((p, i) => proofIdx === i ? { ...p, selected: !p.selected } : p)
										setProof(updated)
									}}
								/>
							)}
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
 * // TODO clean up this component
 */
export function CoinSelectionResume({ lnAmount, selectedAmount, padding, estFee, withSeparator }: IResume) {
	const { t } = useTranslation(['common'])
	const { color } = useContext(ThemeContext)
	const getChangeStr = () => {
		const change = selectedAmount - lnAmount
		if (estFee && estFee > 0) {
			return `${change} ${t('to')} ${change + estFee} Satoshi`
		}
		return `${change} Satoshi`
	}
	if (withSeparator) {
		return (
			<>
				<View style={styles.resumeRow}>
					<Txt txt={t('selected')} styles={[{ fontWeight: '500' }]} />
					<Text style={globals(color).txt}>
						<Txt txt={`${selectedAmount}`} styles={[{ color: selectedAmount < lnAmount ? mainColors.ERROR : color.TEXT }]} />/{lnAmount} Satoshi
					</Text>
				</View>
				{selectedAmount > lnAmount &&
					<>
						<Separator style={[styles.separator]} />
						<View style={styles.resumeRow}>
							<Txt txt={t('change')} styles={[{ fontWeight: '500' }]} />
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
				<Text style={globals(color).txt}>
					<Txt txt={`${selectedAmount}`} styles={[{ color: selectedAmount < lnAmount ? mainColors.ERROR : color.TEXT }]} />/{lnAmount} Satoshi
				</Text>
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
	const { t } = useTranslation(['common'])
	const { color } = useContext(ThemeContext)
	return (
		<>
			<View style={styles.tableHeader}>
				<Text style={[styles.tableHead, { color: color.TEXT }]}>
					{t('amount')}
				</Text>
				<Text style={[styles.tableHead, { color: color.TEXT }]}>
					{t('keysetID')}
				</Text>
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
	resumeRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
	},
	separator: {
		marginVertical: 20,
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
	tableHead: {
		fontSize: 16,
		fontWeight: '500',
	},
	confirmWrap: {
		position: 'absolute',
		bottom: 0,
		right: 0,
		left: 0,
		padding: 20,
	}
})