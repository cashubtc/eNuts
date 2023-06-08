import type { Proof } from '@cashu/cashu-ts'
import type { IProofSelection } from '@model'
import { ThemeContext } from '@src/context/Theme'
import { globals, highlight as hi } from '@styles'
import { useContext } from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

interface IProofRowProps {
	proof: Proof | IProofSelection
}
interface ICoinSelectionRowProps extends IProofRowProps {
	setChecked: () => void
}

/**
 * A pressable component that handles coin selection
 */
export default function CoinSelectionRow({ proof, setChecked }: ICoinSelectionRowProps) {
	return (
		<TouchableOpacity style={styles.overview} onPress={setChecked}>
			<ProofRowContent proof={proof} />
		</TouchableOpacity>
	)
}

/**
 * A non-pressable list component that only shows the proofs
 */
export function ProofRow({ proof }: IProofRowProps) {
	return (
		<View style={styles.overview}>
			<ProofRowContent proof={proof} />
		</View>
	)
}

export function ProofRowContent({ proof }: IProofRowProps) {
	const { color, highlight } = useContext(ThemeContext)
	return (
		<>
			<Text style={globals(color).txt}>
				{proof.amount} Sat
			</Text>
			<View style={styles.keyWrap}>
				<Text style={[
					styles.keysetID,
					{ color: color.TEXT_SECONDARY, marginRight: 'selected' in proof ? 20 : 0 }
				]}>
					{proof.id}
				</Text>
				{'selected' in proof &&
					<View
						style={[
							styles.radioBtn,
							{ borderColor: color.BORDER, backgroundColor: proof.selected ? hi[highlight] : 'transparent' }
						]}
					/>
				}
			</View>
		</>
	)
}

const styles = StyleSheet.create({
	overview: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingVertical: 10,
	},
	radioBtn: {
		borderWidth: 1,
		borderRadius: 50,
		padding: 10,
	},
	keyWrap: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	keysetID: {
		fontSize: 14,
	},
})