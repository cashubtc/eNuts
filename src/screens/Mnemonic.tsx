import Button from '@comps/Button'
import useCopy from '@comps/hooks/Copy'
import { ExclamationIcon } from '@comps/Icons'
import Txt from '@comps/Txt'
import { isIOS } from '@consts'
import { generateMnemonic } from '@db/backup'
import type { IMnemonicPageProps } from '@model/nav'
import { useThemeContext } from '@src/context/Theme'
import { NS } from '@src/i18n'
import { getPinpadBg, mainColors } from '@styles'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList, SafeAreaView, View } from 'react-native'
import { s, ScaledSheet } from 'react-native-size-matters'

export default function MnemonicScreen({ navigation }: IMnemonicPageProps) {

	const { t } = useTranslation([NS.common])
	const { highlight } = useThemeContext()
	const [mnemonic, setMnemonic] = useState<string>()
	const { copy, copied } = useCopy()

	const handleCopyMnemonic = async () => {
		if (!mnemonic) { return }
		await copy(mnemonic)
	}

	useEffect(() => {
		const words = generateMnemonic()
		if (!words) { return }
		setMnemonic(words)
	}, [])

	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: mainColors.VALID }}>
			<View style={styles.headerWrap}>
				<Txt
					txt={t('seedBackup')}
					styles={[styles.header, { color: mainColors.WHITE }]}
				/>
			</View>
			<View style={styles.content}>
				<FlatList
					data={mnemonic?.split(' ')}
					numColumns={2}
					keyExtractor={(_item, index) => index.toString()}
					renderItem={({ item, index }) => (
						<View
							style={[
								styles.mnemonicWord,
								{
									backgroundColor: getPinpadBg(highlight),
									marginRight: index % 2 === 0 ? s(10) : 0
								}
							]}
						>
							<Txt
								bold
								txt={`${index + 1}. `}
								styles={[{ fontSize: 18, color: mainColors.WHITE }]}
							/>
							<Txt
								bold
								txt={item}
								styles={[{ fontSize: 18, color: mainColors.WHITE }]}
							/>
						</View>
					)}
				/>
			</View>
			<Button
				txt={copied ? 'Copied!' : 'Copy'}
				onPress={() => void handleCopyMnemonic()}
			/>
			<View style={styles.actionWrap}>
				<View style={[styles.warnContainer, { backgroundColor: getPinpadBg(highlight) }]}>
					<ExclamationIcon color={mainColors.ERROR} />
					<Txt
						center
						bold
						txt={t('mnemonicHint')}
						styles={[{ color: mainColors.WHITE }]}
					/>
				</View>
				<Button
					border
					txt={t('continue')}
					onPress={() => {
						if (!mnemonic) { return }
						navigation.navigate('Confirm Mnemonic', { mnemonic: mnemonic.split(' ') })
					}}
				/>
			</View>
		</SafeAreaView>
	)
}

const styles = ScaledSheet.create({
	headerWrap: {
		padding: '20@s',
		alignItems: 'center',
		justifyContent: 'center'
	},
	header: {
		fontSize: '36@s',
		textAlign: 'center',
		marginBottom: 0
	},
	content: {
		paddingHorizontal: '20@s',
	},
	mnemonicWord: {
		padding: '10@s',
		marginBottom: '10@s',
		borderRadius: '10@s',
		width: '48%',
		flexDirection: 'row',
		alignItems: 'center',
	},
	actionWrap: {
		position: 'absolute',
		bottom: isIOS ? '40@s' : '20@s',
		width: '100%',
		paddingHorizontal: '20@s'
	},
	warnContainer: {
		alignItems: 'center',
		padding: '10@s',
		rowGap: '10@s',
		borderRadius: '10@s',
		marginBottom: '10@s'
	},
})