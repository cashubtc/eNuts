import type { Proof } from '@cashu/cashu-ts'
import type { IProofSelection } from '@model'
import { ThemeContext } from '@src/context/Theme'
import { globals, highlight as hi, mainColors } from '@styles'
import { useContext } from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

import Txt from './Txt'

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
export default function CoinSelectionRow({ proof, isLatestKeysetId, setChecked }: ICoinSelectionRowProps) {
	return (
		<TouchableOpacity style={styles.overview} onPress={setChecked}>
			<ProofRowContent proof={proof} isLatestKeysetId={isLatestKeysetId} />
		</TouchableOpacity>
	)
}

/**
 * A non-pressable list entry component that only shows the proofs
 */
export function ProofRow({ proof, isLatestKeysetId }: IProofRowProps) {
	return (
		<View style={styles.overview}>
			<ProofRowContent proof={proof} isLatestKeysetId={isLatestKeysetId} />
		</View>
	)
}

export function ProofRowContent({ proof, isLatestKeysetId }: IProofRowProps) {
	const { color, highlight } = useContext(ThemeContext)
	return (
		<>
			<Txt txt={`${proof.amount} Sat`} />
			<View style={styles.keyWrap}>
				<Text
					style={[
						styles.keysetID,
						{
							color: isLatestKeysetId ? mainColors.VALID : color.TEXT_SECONDARY,
							marginRight: 'selected' in proof ? 20 : 0,
						},
					]}
				>
					{proof.id}
				</Text>
				{'selected' in proof && (
					<View
						style={[
							globals(color, highlight).radioBtn,
							{ backgroundColor: proof.selected ? hi[highlight] : 'transparent' },
						]}
					/>
				)}
			</View>
		</>
	)
}

const styles = StyleSheet.create({
	overview: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingVertical: 15,
	},
	keyWrap: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	keysetID: {
		fontSize: 14,
	},
})
