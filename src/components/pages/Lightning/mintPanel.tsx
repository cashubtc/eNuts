import { ZapIcon } from '@comps/Icons'
import type { IMintUrl } from '@model'
import type { TLightningPageProps, TSendTokenPageProps } from '@model/nav'
import { Picker } from '@react-native-picker/picker'
import { ThemeContext } from '@src/context/Theme'
import { formatInt, formatMintUrl } from '@util'
import { useContext } from 'react'
import { StyleSheet, Text, View } from 'react-native'

interface IMintPanelProps {
	nav: TLightningPageProps | TSendTokenPageProps
	mints: IMintUrl[]
	selectedMint: string
	lnAmount?: number
	setSelectedMint: (url: string) => void
}

export default function MintPanel({ nav, mints, selectedMint, lnAmount, setSelectedMint }: IMintPanelProps) {
	const { color } = useContext(ThemeContext)
	return nav.route.params?.mint ?
		<View style={styles.minBalWrap}>
			<Text style={[styles.singleMint, { color: color.TEXT }]}>
				{formatMintUrl(nav.route.params.mint)}
			</Text>
			<View style={styles.mintBal}>
				<Text style={[
					styles.mintAmount,
					{ color: lnAmount && nav.route.params.balance && nav.route.params.balance < lnAmount ? color.ERROR : color.TEXT }
				]}>
					{formatInt(nav.route.params.balance || 0, 'en', 'standard')}
				</Text>
				<ZapIcon width={18} height={18} color={color.TEXT} />
			</View>
		</View>
		:
		mints.length > 0 ?
			<Picker
				selectedValue={selectedMint}
				onValueChange={(value, _idx) => setSelectedMint(value)}
				dropdownIconColor={color.TEXT}
				style={styles.picker}
			>
				{mints.map(m => (
					<Picker.Item
						key={m.mint_url}
						label={formatMintUrl(m.mint_url)}
						value={m.mint_url}
						style={{ color: color.TEXT }}
					/>
				))}
			</Picker>
			:
			null
}

const styles = StyleSheet.create({
	picker: {
		marginHorizontal: -15
	},
	minBalWrap: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginTop: 20,
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