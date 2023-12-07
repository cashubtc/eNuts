import type { Proof } from '@cashu/cashu-ts'
import Screen from '@comps/Screen'
import Separator from '@comps/Separator'
import { getProofsByMintUrl } from '@db'
import type { TMintProofsPageProps } from '@model/nav'
import { ProofListHeader, ProofRow } from '@screens/Payment/Send/ProofList'
import { FlashList } from '@shopify/flash-list'
import { useThemeContext } from '@src/context/Theme'
import { NS } from '@src/i18n'
import { globals } from '@styles'
import { getMintCurrentKeySetId } from '@wallet'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'
import { s, ScaledSheet, vs } from 'react-native-size-matters'

export default function MintProofsPage({ navigation, route }: TMintProofsPageProps) {
	const { color } = useThemeContext()
	const { t } = useTranslation([NS.wallet])
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
			screenName={t('proofs')}
			withBackBtn
			handlePress={() => navigation.goBack()}
		>
			<View style={[styles.content, { marginBottom: vs(20) }]}>
				{/* List header */}
				<View style={{ paddingHorizontal: s(20), marginTop: vs(20) }}>
					<ProofListHeader />
				</View>
				{/* Proofs list */}
				{proofs.length > 0 &&
					<View
						style={[
							globals(color).scrollContainer,
							{ height: Math.floor(proofs.length * vs(65)) }
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

const styles = ScaledSheet.create({
	content: {
		flex: 1,
		marginTop: '-30@vs',
	},
	mintUrl: {
		fontSize: '14@vs',
		marginHorizontal: '10@s',
	},
})