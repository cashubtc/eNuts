import Button from '@comps/Button'
import RadioBtn from '@comps/RadioBtn'
import Screen from '@comps/Screen'
import Separator from '@comps/Separator'
import Txt from '@comps/Txt'
import { isIOS } from '@consts'
import { mintUrl } from '@consts/mints'
import { getMintsUrls } from '@db'
import type { ISelectRecoveryMintPageProps } from '@model/nav'
import { useThemeContext } from '@src/context/Theme'
import { NS } from '@src/i18n'
import { getDefaultMint } from '@store/mintStore'
import { globals } from '@styles'
import { formatMintUrl, isStr } from '@util'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, TouchableOpacity, View } from 'react-native'
import { s, ScaledSheet } from 'react-native-size-matters'

// TODO provide text input for custom mint url

export default function SelectRecoveryMintScreen({ navigation, route }: ISelectRecoveryMintPageProps) {

	const { t } = useTranslation([NS.common])
	const { color } = useThemeContext()

	const [userMints, setUserMints] = useState<string[]>([])
	const [selectedMint, setSelectedMint] = useState('')

	useEffect(() => {
		void (async () => {
			const allMints = await getMintsUrls()
			const defaultMint = await getDefaultMint()
			setUserMints(!allMints.length ? [mintUrl] : allMints)
			if (isStr(defaultMint)) { return setSelectedMint(defaultMint) }
			if (!allMints.length) { return setSelectedMint(mintUrl) }
			setSelectedMint(allMints[0])
		})()
	}, [])

	return (
		<Screen
			screenName={t('walletRecovery')}
			withBackBtn
			handlePress={() => navigation.goBack()}
		>
			<Txt txt={t('selectRestoreMint')} styles={[styles.hint]} bold />
			{userMints.length > 0 ?
				<ScrollView alwaysBounceVertical={false} style={{ marginBottom: s(90) }}>
					<View style={[globals(color).wrapContainer, { paddingBottom: s(20) }]}>
						{userMints.map((m, i) => (
							<RecoveryMint
								key={i}
								mintUrl={formatMintUrl(m)}
								handlePress={() => setSelectedMint(m)}
								selected={selectedMint === m}
								hasSeparator={i < userMints.length - 1}
							/>
						))}
					</View>
				</ScrollView>
				:
				<View>
					<RecoveryMint
						mintUrl={formatMintUrl(mintUrl)}
						handlePress={() => setSelectedMint(mintUrl)}
						selected={selectedMint === mintUrl}
					/>
				</View>
			}
			<View style={[styles.btn, { backgroundColor: color.BACKGROUND }]}>
				<View style={styles.btnWrap}>
					<Button
						txt={t('continue')}
						onPress={() => {
							navigation.navigate('Recover', {
								mintUrl: selectedMint,
								comingFromOnboarding: route.params.comingFromOnboarding
							})
						}}
					/>
				</View>
			</View>
		</Screen>
	)
}

interface IRecoveryMintProps {
	mintUrl: string
	handlePress: () => void
	selected?: boolean
	hasSeparator?: boolean
}

function RecoveryMint({ mintUrl, handlePress, selected, hasSeparator }: IRecoveryMintProps) {
	return (
		<>
			<TouchableOpacity
				onPress={handlePress}
				style={styles.rowWrap}
			>
				<Txt txt={mintUrl} />
				<RadioBtn selected={selected} />
			</TouchableOpacity>
			{hasSeparator && <Separator style={[styles.separator]} />}
		</>
	)
}

const styles = ScaledSheet.create({
	hint: {
		paddingHorizontal: '20@s',
		marginBottom: '20@vs',
	},
	rowWrap: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	separator: {
		marginTop: '20@s',
	},
	btn: {
		position: 'absolute',
		right: 0,
		bottom: isIOS ? '0@s' : '20@s',
		left: 0,
	},
	btnWrap: {
		marginHorizontal: '20@s',
		marginTop: '20@s',
	}
})
