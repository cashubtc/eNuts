import type { Proof } from '@cashu/cashu-ts'
import { ProofRow } from '@comps/coinSelectionRow'
import { CheckmarkIcon, CopyIcon } from '@comps/Icons'
import { getProofsByMintUrl } from '@db'
import { TMintProofsPageProps } from '@model/nav'
import BottomNav from '@nav/BottomNav'
import TopNav from '@nav/TopNav'
import { ProofListHeader } from '@pages/Lightning/modal'
import { ThemeContext } from '@src/context/Theme'
import { getMintActiveKeysetId } from '@src/wallet'
import { globals, mainColors } from '@styles'
import { formatMintUrl } from '@util'
import * as Clipboard from 'expo-clipboard'
import { useContext, useEffect, useState } from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

export default function MintProofsPage({ navigation, route }: TMintProofsPageProps) {
	const { color } = useContext(ThemeContext)
	const [copied, setCopied] = useState(false)
	const [proofs, setProofs] = useState<Proof[]>([])
	const [mintKeysetId, setMintKeysetId] = useState('')
	// initiate proofs & get the active keysetid of a mint once on initial render to compare with the proof keysets in the list
	useEffect(() => {
		void (async () => {
			const [proofs, keysetId] = await Promise.all([
				getProofsByMintUrl(route.params.mintUrl),
				getMintActiveKeysetId(route.params.mintUrl)
			])
			setProofs(proofs)
			setMintKeysetId(keysetId)
		})()
	}, [])

	return (
		<View style={[styles.container, { backgroundColor: color.BACKGROUND }]}>
			<TopNav withBackBtn />
			<View style={styles.content}>
				{/* Header */}
				<Text style={[globals(color).header, styles.header]}>
					Proofs
				</Text>
				{/* Mint url */}
				<View style={styles.subHeader}>
					<Text style={[styles.mintUrl, { color: color.TEXT_SECONDARY }]}>
						{formatMintUrl(route.params.mintUrl)}
					</Text>
					{/* Copy mint url */}
					<TouchableOpacity
						style={{ padding: 5 }}
						onPress={() => {
							void Clipboard.setStringAsync(route.params.mintUrl).then(() => {
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
				{/* List header */}
				<ProofListHeader />
				{/* Proofs list */}
				{proofs.map(p => <ProofRow key={p.secret} proof={p} isLatestKeysetId={p.id === mintKeysetId} />)}
			</View>
			<BottomNav navigation={navigation} route={route} />
		</View>
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
})