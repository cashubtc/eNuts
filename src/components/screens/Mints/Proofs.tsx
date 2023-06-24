import type { Proof } from '@cashu/cashu-ts'
import { ProofRow } from '@comps/coinSelectionRow'
import Separator from '@comps/Separator'
import { getProofsByMintUrl } from '@db'
import type { TMintProofsPageProps } from '@model/nav'
import BottomNav from '@nav/BottomNav'
import TopNav from '@nav/TopNav'
import { ProofListHeader } from '@screens/Lightning/modal'
import { FlashList } from '@shopify/flash-list'
import { ThemeContext } from '@src/context/Theme'
import { globals } from '@styles'
import { getMintCurrentKeySetId } from '@wallet'
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
				{proofs.length > 0 &&
					<View
						style={[
							globals(color).wrapContainer,
							{
								paddingHorizontal: 0,
								height: Math.floor(proofs.length * 56),
							}
						]}
					>
						<FlashList
							data={proofs}
							estimatedItemSize={300}
							contentContainerStyle={{ paddingHorizontal: 20 }}
							renderItem={data => (
								<ProofRow key={data.item.secret} proof={data.item} isLatestKeysetId={data.item.id === mintKeysetId} />
							)}
							ItemSeparatorComponent={() => <Separator />}
						/>
					</View>
				}
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
		marginTop: 80,
		marginBottom: 60,
	},
	mintUrl: {
		fontSize: 16,
		marginHorizontal: 10,
	},
})