import Button from '@comps/Button'
import useCopy from '@comps/hooks/Copy'
import { ExclamationIcon } from '@comps/Icons'
import Txt from '@comps/Txt'
import { isIOS } from '@consts'
import { generateMnemonic } from '@db/backup'
import type { IMnemonicPageProps } from '@model/nav'
import { useThemeContext } from '@src/context/Theme'
import { getPinpadBg, mainColors } from '@styles'
import { useEffect, useState } from 'react'
import { FlatList, SafeAreaView, View } from 'react-native'
import { s } from 'react-native-size-matters'

export default function MnemonicScreen({ navigation }: IMnemonicPageProps) {

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
			<View style={{ padding: s(20), alignItems: 'center', justifyContent: 'center' }}>
				<Txt
					txt='Seed Phrase'
					styles={[{ fontSize: 36, textAlign: 'center', marginBottom: 0, color: mainColors.WHITE }]}
				/>
			</View>
			<View style={{ paddingHorizontal: s(20) }}>
				<FlatList
					data={mnemonic?.split(' ')}
					numColumns={2}
					keyExtractor={(_item, index) => index.toString()}
					renderItem={({ item, index }) => (
						<View
							style={{
								backgroundColor: getPinpadBg(highlight),
								padding: s(10),
								marginBottom: s(10),
								marginRight: index % 2 === 0 ? s(10) : 0,
								borderRadius: s(10),
								width: '48%',
								flexDirection: 'row',
								alignItems: 'center',
							}}
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
			<View style={{ position: 'absolute', bottom: isIOS ? s(40) : s(20), width: '100%', paddingHorizontal: s(20) }}>
				<View style={{ alignItems: 'center', padding: s(10), rowGap: s(10), backgroundColor: getPinpadBg(highlight), borderRadius: s(10), marginBottom: s(20) }}>
					<ExclamationIcon color={mainColors.ERROR} />
					<Txt
						center
						bold
						txt='The seed phrase will never be shown again. Write it down and never share it with anyone.'
						styles={[{ color: mainColors.WHITE }]}
					/>
				</View>
				<Button
					border
					txt='Continue'
					onPress={() => {
						if (!mnemonic) { return }
						navigation.navigate('Confirm Mnemonic', { mnemonic: mnemonic.split(' ')})
					}}
				/>
			</View>
		</SafeAreaView>
	)
}