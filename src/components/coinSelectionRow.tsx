import { Proof } from '@cashu/cashu-ts'
import type { IProofSelection } from '@model'
import { ThemeContext } from '@src/context/Theme'
import { hasOwnProperty } from '@src/util/typeguards'
import { globals, highlight as hi } from '@styles'
import { useContext } from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

interface ProofRowProps {
	proof: Proof | IProofSelection
}
interface CoinSelectionRowProps extends ProofRowProps {
	setChecked: () => void
}

/**
 * A pressable component that handles coin selection
 */
export default function CoinSelectionRow({ proof, setChecked }: CoinSelectionRowProps) {
	return (
		<TouchableOpacity style={styles.overview} onPress={setChecked}>
			<ProofRowContent proof={proof} />
		</TouchableOpacity>
	)
}

/**
 * A non-pressable list component that only shows the proofs
 */
export function ProofRow({ proof }: ProofRowProps) {
	return (
		<View style={styles.overview}>
			<ProofRowContent proof={proof} />
		</View>
	)
}

export function ProofRowContent({ proof }: ProofRowProps) {
	const { color, highlight } = useContext(ThemeContext)
	return (
		<>
			<Text style={globals(color).txt}>
				{proof.amount} Sat
			</Text>
			<View style={styles.keyWrap}>
				<Text style={[
					styles.keysetID,
					{ color: color.TEXT_SECONDARY, marginRight: hasOwnProperty(proof, 'selected') ? 20 : 0 }
				]}>
					{proof.id}
				</Text>
				{hasOwnProperty(proof, 'selected') &&
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