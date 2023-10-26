import type { Proof } from '@cashu/cashu-ts'
import Screen from '@comps/Screen'
import Separator from '@comps/Separator'
import { isIOS } from '@consts'
import { getProofsByMintUrl } from '@db'
import type { TMintProofsPageProps } from '@model/nav'
import { ProofListHeader, ProofRow } from '@screens/Payment/Send/ProofList'
import { FlashList } from '@shopify/flash-list'
import { useThemeContext } from '@src/context/Theme'
import { globals } from '@styles'
import { getMintCurrentKeySetId } from '@wallet'
import { useEffect, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default function MintProofsPage({ navigation, route }: TMintProofsPageProps) {
	const { color } = useThemeContext()
	const insets = useSafeAreaInsets()
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
		<Screen
			screenName='Proofs'
			withBackBtn
			handlePress={() => navigation.goBack()}
		>
			<View style={[styles.content, { marginBottom: isIOS ? insets.bottom : 0 }]}>
				{/* List header */}
				<View style={{ paddingHorizontal: 20, marginTop: 20 }}>
					<ProofListHeader />
				</View>
				{/* Proofs list */}
				{proofs.length > 0 &&
					<View
						style={[
							globals(color).scrollContainer,
							{ height: Math.floor(proofs.length * (isIOS ? 62 : 70)) }
						]}
					>
						<FlashList
							data={proofs}
							estimatedItemSize={80}
							keyExtractor={item => item.secret}
							renderItem={data => (
								<ProofRow
									proof={data.item}
									isLatestKeysetId={data.item.id === mintKeysetId}
								/>
							)}
							ItemSeparatorComponent={() => <Separator noMargin />}
						/>
					</View>
				}
			</View>
		</Screen>
	)
}

const styles = StyleSheet.create({
	content: {
		flex: 1,
		marginTop: -30,
	},
	mintUrl: {
		fontSize: 16,
		marginHorizontal: 10,
	},
})