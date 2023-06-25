import Button from '@comps/Button'
import type { ITokenInfo } from '@model'
import { ThemeContext } from '@src/context/Theme'
import { globals } from '@styles'
import { formatInt, formatMintUrl } from '@util'
import { useContext } from 'react'
import { StyleSheet, Text, View } from 'react-native'

import MyModal from '.'

interface ITrustModalProps {
	loading: boolean
	tokenInfo?: ITokenInfo
	handleTrustModal: () => void
	closeModal: () => void
}

export default function TrustMintModal({ loading, tokenInfo, handleTrustModal, closeModal }: ITrustModalProps) {
	const { color, highlight } = useContext(ThemeContext)
	return (
		<MyModal type="question" animation="fade" visible close={closeModal}>
			<Text style={globals(color, highlight).modalHeader}>Do you want to trust this mint?</Text>
			{/* token amount */}
			<Text style={[styles.mintPrompt, { color: color.TEXT_SECONDARY }]}>
				{formatInt(tokenInfo?.value || 0)} Satoshi from:
			</Text>
			{/* Show in which mint(s) the tokens are */}
			<View style={styles.tokenMintsView}>
				{tokenInfo?.mints.map((m) => (
					<Text style={[styles.mintPrompt, { color: color.TEXT_SECONDARY }]} key={m}>
						{formatMintUrl(m)}
					</Text>
				))}
			</View>
			<Text style={globals(color, highlight).modalTxt}>
				If you choose &quot;No&quot;, the tokens will not be claimed.
			</Text>
			<Button txt={loading ? 'Claiming...' : 'Yes'} onPress={handleTrustModal} />
			<View style={{ marginVertical: 10 }} />
			<Button outlined txt="No" onPress={closeModal} />
		</MyModal>
	)
}

const styles = StyleSheet.create({
	mintPrompt: {
		fontSize: 12,
		marginBottom: 5,
	},
	tokenMintsView: {
		marginBottom: 20,
	},
})
