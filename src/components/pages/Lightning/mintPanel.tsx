import { ZapIcon } from '@comps/Icons'
import type { IMintUrl } from '@model'
import type { TLightningPageProps, TSendTokenPageProps } from '@model/nav'
import { Picker } from '@react-native-picker/picker'
import { ThemeContext } from '@src/context/Theme'
import { getMintName } from '@store/mintStore'
import { formatInt, formatMintUrl } from '@util'
import { useContext } from 'react'
import { StyleSheet, Text, View } from 'react-native'

interface IMintPanelProps {
	nav: TLightningPageProps | TSendTokenPageProps
	mints: IMintUrl[]
	selectedMint?: IMintUrl
	lnAmount?: number
	setSelectedMint: (url: IMintUrl) => void
}

export default function MintPanel({ nav, mints, selectedMint, lnAmount, setSelectedMint }: IMintPanelProps) {
	const { color } = useContext(ThemeContext)
	return nav.route.params?.mint ?
		<View style={styles.minBalWrap}>
			<Text style={[styles.singleMint, { color: color.TEXT }]}>
				{nav.route.params.mint.customName || formatMintUrl(nav.route.params.mint.mintUrl)}
			</Text>
			<View style={styles.mintBal}>
				<Text style={[
					styles.mintAmount,
					{ color: lnAmount && nav.route.params.balance && nav.route.params.balance < lnAmount ? color.ERROR : color.TEXT }
				]}>
					{formatInt(nav.route.params.balance || 0)}
				</Text>
				<ZapIcon width={18} height={18} color={color.TEXT} />
			</View>
		</View>
		:
		mints.length > 0 ?
			<Picker
				selectedValue={selectedMint?.mintUrl}
				onValueChange={(value, _idx) => {
					void (async () => {
						const customName = await getMintName(value)
						setSelectedMint({ mintUrl: value, customName: customName || '' })
					})()
				}}
				dropdownIconColor={color.TEXT}
				style={styles.picker}
			>
				{mints.map(m => (
					<Picker.Item
						key={m.mintUrl}
						label={m.customName || formatMintUrl(m.mintUrl)}
						value={m.mintUrl}
						style={{ color: color.TEXT }}
					/>
				))}
			</Picker>
			:
			null
}

const styles = StyleSheet.create({
	picker: {
		marginHorizontal: -15,
	},
	minBalWrap: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginVertical: 20,
	},
	singleMint: {
		fontSize: 16,
	},
	mintBal: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'flex-end',
	},
	mintAmount: {
		marginRight: 5
	},
})