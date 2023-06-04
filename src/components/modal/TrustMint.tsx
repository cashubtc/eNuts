import Button from '@comps/Button'
import type { ITokenInfo } from '@model'
import { ThemeContext } from '@src/context/Theme'
import { globals } from '@styles/globals'
import { formatInt, formatMintUrl } from '@util'
import React, { useContext } from 'react'
import { StyleSheet,Text, View } from 'react-native'
import { TouchableOpacity } from 'react-native-gesture-handler'

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
		<MyModal type='question' animation='fade' visible>
			<Text style={globals(color, highlight).modalHeader}>
				Do you want to trust this mint?
			</Text>
			{/* token amount */}
			<Text style={[styles.mintPrompt, { color: color.TEXT_SECONDARY, }]}>
				{formatInt(tokenInfo?.value || 0, 'en', 'standard')} Satoshi from:
			</Text>
			{/* Show in which mint(s) the tokens are */}
			<View style={styles.tokenMintsView}>
				{tokenInfo?.mints.map(m => <Text style={[styles.mintPrompt, { color: color.TEXT_SECONDARY, }]} key={m}>{formatMintUrl(m)}</Text>)}
			</View>
			<Text style={globals(color, highlight).modalTxt}>
				If you choose "No", the tokens will not be claimed.
			</Text>
			<Button txt={loading ? 'Claiming...' : 'Yes'} onPress={handleTrustModal} />
			<TouchableOpacity
				style={styles.no}
				onPress={closeModal}
			>
				<Text style={globals(color, highlight).pressTxt}>
					No
				</Text>
			</TouchableOpacity>
		</MyModal>
	)
}

const styles = StyleSheet.create({
	mintPrompt: {
		fontSize: 12,
		marginBottom: 5,
	},
	tokenMintsView: {
		marginBottom: 20
	},
	no: {
		marginTop: 15,
		marginBottom: -15,
		padding: 10,
	},
})