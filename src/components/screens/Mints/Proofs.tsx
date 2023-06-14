import type { Proof } from '@cashu/cashu-ts'
import { ProofRow } from '@comps/coinSelectionRow'
import { getProofsByMintUrl } from '@db'
import { TMintProofsPageProps } from '@model/nav'
import BottomNav from '@nav/BottomNav'
import TopNav from '@nav/TopNav'
import { ProofListHeader } from '@screens/Lightning/modal'
import { FlashList } from '@shopify/flash-list'
import { ThemeContext } from '@src/context/Theme'
import { getMintCurrentKeySetId } from '@src/wallet'
import { useContext, useEffect, useState } from 'react'
import { StyleSheet, View } from 'react-native'

export default function MintProofsPage({ navigation, route }: TMintProofsPageProps) {
	const { color } = useContext(ThemeContext)
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
				{/* List header */}
				<View style={{ paddingHorizontal: 20, marginTop: 20 }}>
					<ProofListHeader />
				</View>
				{/* Proofs list */}
				<View style={[
					styles.listWrap,
					{
						borderColor: color.BORDER,
						backgroundColor: color.INPUT_BG
					}
				]}>
					<FlashList
						data={proofs}
						estimatedItemSize={300}
						contentContainerStyle={{ paddingHorizontal: 20 }}
						renderItem={data => (
							<ProofRow key={data.item.secret} proof={data.item} isLatestKeysetId={data.item.id === mintKeysetId} />
						)}
						ItemSeparatorComponent={() => <View style={{ borderBottomWidth: 1, borderColor: color.BORDER }} />}
					/>
				</View>
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
		marginBottom: 60,
	},
	listWrap: {
		flex: 1,
		borderWidth: 1,
		borderRadius: 20,
	},
	mintUrl: {
		fontSize: 16,
		marginHorizontal: 10,
	},
})