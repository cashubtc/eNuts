import { getMintsBalances, getMintsUrls } from '@db'
import type { IMintUrl } from '@model'
import type { TSendTokenPageProps } from '@model/nav'
import TopNav from '@nav/TopNav'
import { ThemeContext } from '@src/context/Theme'
import { getDefaultMint } from '@store/mintStore'
import React, { useCallback, useContext, useEffect, useState } from 'react'
import { StyleSheet, View } from 'react-native'

import LNPageContent from './Lightning/pageContent'

export default function SendTokenPage({ navigation, route }: TSendTokenPageProps) {
	const { color } = useContext(ThemeContext)
	// user mints
	const [mints, setMints] = useState<IMintUrl[]>([])
	// mint selection
	const [selectedMint, setSelectedMint] = useState('')
	const setSelectedMintCB = useCallback((url: string) => setSelectedMint(url), [])
	// selected mint balance
	const [mintBal, setMintBal] = useState(0)
	// initiate user mints
	useEffect(() => {
		void (async () => {
			const userMints = await getMintsUrls()
			setMints(userMints)
			if (!userMints.length) { return }
			// set first selected mint
			const defaultMint = await getDefaultMint()
			if (!defaultMint) {
				setSelectedMint(userMints[0].mint_url)
				return
			}
			for (const mint of userMints) {
				if (mint.mint_url === defaultMint) {
					setSelectedMint(mint.mint_url)
					break
				}
			}
		})()
	}, [])
	// update mint balance after picking mint
	useEffect(() => {
		void (async () => {
			const mintsBals = await getMintsBalances()
			for (const mint of mintsBals) {
				if (mint.mint_url === selectedMint) {
					setMintBal(mint.amount)
				}
			}
		})()
	}, [selectedMint])
	return (
		<View style={[styles.container, { backgroundColor: color.BACKGROUND }]}>
			<TopNav withBackBtn />
			<LNPageContent
				nav={{ navigation, route }}
				mints={mints}
				selectedMint={selectedMint}
				mintBal={mintBal}
				setSelectedMint={setSelectedMintCB}
				createSpendableToken
			/>
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: 20,
	},
})