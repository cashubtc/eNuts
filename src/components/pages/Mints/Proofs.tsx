import type { Proof } from '@cashu/cashu-ts'
import { ProofRow } from '@comps/coinSelectionRow'
import { CheckmarkIcon, CopyIcon, MintBoardIcon } from '@comps/Icons'
import KeysetHint from '@comps/KeysetHint'
import { getProofsByMintUrl } from '@db'
import { TMintProofsPageProps } from '@model/nav'
import BottomNav from '@nav/BottomNav'
import TopNav from '@nav/TopNav'
import { ProofListHeader } from '@pages/Lightning/modal'
import { FlashList } from '@shopify/flash-list'
import { ThemeContext } from '@src/context/Theme'
import { getMintCurrentKeySetId } from '@src/wallet'
import { mainColors } from '@styles'
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
				getMintCurrentKeySetId(route.params.mintUrl)
			])
			setProofs(proofs)
			setMintKeysetId(keysetId)
		})()
	}, [route.params.mintUrl])

	return (
		<View style={[styles.container, { backgroundColor: color.BACKGROUND }]}>
			<TopNav screenName='Proofs' withBackBtn />
			<View style={styles.content}>
				{/* Mint url */}
				<View style={styles.subHeader}>
					<MintBoardIcon width={19} height={19} color={color.TEXT_SECONDARY} />
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
				<View style={{ paddingHorizontal: 20 }}>
					{/* Info about latest keyset ids highlighted in green */}
					<KeysetHint />
					{/* List header */}
					<ProofListHeader />
				</View>
				{/* Proofs list */}
				<FlashList
					data={proofs}
					estimatedItemSize={300}
					contentContainerStyle={{ paddingHorizontal: 20 }}
					renderItem={data => (
						<ProofRow key={data.item.secret} proof={data.item} isLatestKeysetId={data.item.id === mintKeysetId} />
					)}
				/>
			</View>
			<BottomNav navigation={navigation} route={route} />
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	content: {
		flex: 1,
		marginTop: 100,
		marginBottom: 75,
	},
	subHeader: {
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
		marginBottom: 20,
		paddingHorizontal: 20,
	},
	mintUrl: {
		fontSize: 16,
		marginHorizontal: 10,
	},
})