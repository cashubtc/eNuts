import type { IProofSelection } from '@model'
import { ThemeContext } from '@src/context/Theme'
import { globals, highlight as hi } from '@styles'
import { useContext } from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

interface CoinSelectionRowProps {
	proof: IProofSelection
	setChecked: () => void
}

export default function CoinSelectionRow({ proof, setChecked }: CoinSelectionRowProps) {
	const { color, highlight } = useContext(ThemeContext)
	return (
		<TouchableOpacity style={styles.overview} onPress={setChecked}>
			<Text style={globals(color).txt}>
				{proof.amount} Sat
			</Text>
			<View style={styles.keyWrap}>
				<Text style={[styles.keysetID, { color: color.TEXT_SECONDARY }]}>
					{proof.id}
				</Text>
				<View
					style={[
						styles.radioBtn,
						{ borderColor: color.BORDER, backgroundColor: proof.selected ? hi[highlight] : 'transparent' }
					]}
				/>
			</View>
		</TouchableOpacity>
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
		marginRight: 20,
	}
})