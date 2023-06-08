import { getMintsBalances, getMintsUrls } from '@db'
import type { IMintUrl } from '@model'
import type { TSendTokenPageProps } from '@model/nav'
import TopNav from '@nav/TopNav'
import { ThemeContext } from '@src/context/Theme'
import { getCustomMintNames, getDefaultMint } from '@store/mintStore'
import React, { useCallback, useContext, useEffect, useState } from 'react'
import { StyleSheet, View } from 'react-native'

import LNPageContent from './Lightning/pageContent'

export default function SendTokenPage({ navigation, route }: TSendTokenPageProps) {
	const { color } = useContext(ThemeContext)
	// user mints
	const [mints, setMints] = useState<IMintUrl[]>([])
	// mint selection
	const [selectedMint, setSelectedMint] = useState<IMintUrl>()
	const setSelectedMintCB = useCallback((url: IMintUrl) => setSelectedMint(url), [])
	// selected mint balance
	const [mintBal, setMintBal] = useState(0)
	// initiate user mints
	useEffect(() => {
		void (async () => {
			const userMints = await getMintsUrls()
			if (!userMints.length) { return }
			// get mints with custom names
			const mintsWithName = await getCustomMintNames(userMints)
			setMints(mintsWithName)
			// set first selected mint
			const defaultMint = await getDefaultMint()
			if (!defaultMint) {
				setSelectedMint(mintsWithName[0])
				return
			}
			for (const mint of mintsWithName) {
				if (mint.mintUrl === defaultMint) {
					setSelectedMint(mint)
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
				if (mint.mintUrl === selectedMint?.mintUrl) {
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
				isSendingToken
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