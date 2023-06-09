/* eslint-disable @typescript-eslint/no-misused-promises */
import { getMintsBalances, getMintsUrls } from '@db'
import type { IMintUrl } from '@model'
import type { TLightningPageProps } from '@model/nav'
import BottomNav from '@nav/BottomNav'
import TopNav from '@nav/TopNav'
import { useKeyboard } from '@src/context/Keyboard'
import { ThemeContext } from '@src/context/Theme'
import { getCustomMintNames, getDefaultMint } from '@store/mintStore'
import { useCallback, useContext, useEffect, useState } from 'react'
import { StyleSheet, View } from 'react-native'

import LNPageContent from './pageContent'

export default function Lightning({ navigation, route }: TLightningPageProps) {
	const { color } = useContext(ThemeContext)
	const { isKeyboardOpen } = useKeyboard()
	// user mints
	const [mints, setMints] = useState<IMintUrl[]>([])
	// mint selection
	const [selectedMint, setSelectedMint] = useState<IMintUrl>()
	const setSelectedMintCB = useCallback((url: IMintUrl) => setSelectedMint(url), [selectedMint])
	// selected mint balance
	const [mintBal, setMintBal] = useState(0)
	const handleMintPicker = async () => {
		const userMints = await getMintsUrls(true)
		if (!userMints.length) { return }
		// get mints with custom names
		const mintsWithName = await getCustomMintNames(userMints)
		setMints(mintsWithName)
		if (!userMints.length) { return }
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
	}
	// initiate user mints
	useEffect(() => void handleMintPicker(), [])
	// update mint balance after picking mint
	useEffect(() => {
		void (async () => {
			const mintsBals = await getMintsBalances()
			mintsBals.forEach(m => {
				if (m.mintUrl === selectedMint?.mintUrl) {
					setMintBal(m.amount)
				}
			})
		})()
	}, [selectedMint])
	// get mints after navigating to this page
	useEffect(() => {
		const listener = navigation.addListener('focus', handleMintPicker)
		return listener
	}, [navigation])
	return (
		<View style={[styles.container, { backgroundColor: color.BACKGROUND }]}>
			<TopNav withBackBtn />
			<LNPageContent
				nav={{ navigation, route }}
				mints={mints}
				selectedMint={selectedMint}
				mintBal={mintBal}
				setSelectedMint={setSelectedMintCB}
			/>
			{!isKeyboardOpen && <BottomNav navigation={navigation} route={route} />}
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