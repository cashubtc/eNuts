import { deriveSeedFromMnemonic } from '@cashu/cashu-ts'
import Button, { TxtButton } from '@comps/Button'
import useLoading from '@comps/hooks/Loading'
import Screen from '@comps/Screen'
import Txt from '@comps/Txt'
import TxtInput from '@comps/TxtInput'
import { isIOS } from '@consts'
import { saveSeed } from '@db/backup'
import type { IConfirmMnemonicPageProps } from '@model/nav'
import { usePromptContext } from '@src/context/Prompt'
import { useThemeContext } from '@src/context/Theme'
import { store } from '@store'
import { STORE_KEYS } from '@store/consts'
import { getPinpadBg, mainColors } from '@styles'
import { createRef, useEffect, useMemo, useState } from 'react'
import { KeyboardAvoidingView, type TextInput, View } from 'react-native'
import { s, ScaledSheet } from 'react-native-size-matters'

export default function ConfirmMnemonicScreen({ navigation, route }: IConfirmMnemonicPageProps) {

	const { highlight } = useThemeContext()
	const [input, setInput] = useState('')
	const inputRef = createRef<TextInput>()
	const { openPromptAutoClose } = usePromptContext()
	const { loading, startLoading, stopLoading } = useLoading()
	const randomInt = useMemo(() => Math.floor(Math.random() * 12), [])

	const handleConfirm = async () => {
		if (!input.length || loading) { return }
		if (input !== route.params.mnemonic[randomInt]) {
			openPromptAutoClose({
				msg: 'Wrong word! Please make sure to write down your seed phrase correctly in the right order.',
				success: false,
				ms: 5000,
			})
			return setInput('')
		}
		startLoading()
		const seed = deriveSeedFromMnemonic(route.params.mnemonic.join(' '))
		await saveSeed(seed)
		// create counter in store for seed recovery
		await store.set(STORE_KEYS.restoreCounter, '0')
		// TODO initialize cashu wallet using the saved seed
		stopLoading()
		openPromptAutoClose({ msg: 'Seed recovery enabled!', success: true })
		if (route.params.comingFromOnboarding) {
			return navigation.navigate('auth', { pinHash: '' })
		}
		navigation.navigate('dashboard')
	}

	// auto-focus keyboard
	useEffect(() => {
		const t = setTimeout(() => {
			inputRef.current?.focus()
			clearTimeout(t)
		}, 200)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	return (
		<Screen
			screenName='Confirm Seed'
			noIcons
		>
			<View style={{ flex: 1, justifyContent: 'space-between' }}>
				<View style={{ alignItems: 'center' }}>
					<Txt txt='Please confirm your seed by typing in the correct word.' styles={[styles.hint]} bold />
					<View
						style={{
							backgroundColor: getPinpadBg(highlight),
							padding: s(10),
							borderRadius: s(10),
							width: '50%',
							flexDirection: 'row',
							alignItems: 'center',
						}}
					>
						<Txt
							bold
							txt={`${randomInt + 1}. `}
							styles={[{ fontSize: 18, color: mainColors.WHITE }]}
						/>
						<Txt
							bold
							txt=' ???'
							styles={[{ fontSize: 18, color: mainColors.WHITE }]}
						/>
					</View>
					<TxtButton
						txt='Show seed again'
						onPress={() => navigation.goBack()}
						style={[{ marginTop: s(-10) }]}
					/>
				</View>
				<KeyboardAvoidingView
					behavior={isIOS ? 'padding' : undefined}
					style={styles.actionWrap}
				>
					<TxtInput
						innerRef={inputRef}
						placeholder={`Seed (${randomInt + 1}.)`}
						onChangeText={text => setInput(text)}
						onSubmitEditing={() => void handleConfirm()}
						autoFocus
						ms={200}
					/>
					<Button
						disabled={!input.length}
						txt={loading ? 'Confirming...' : 'Confirm'}
						onPress={() => void handleConfirm()}
					/>
					{isIOS && <View style={styles.placeholder} />}
				</KeyboardAvoidingView>
			</View>
		</Screen>
	)
}

const styles = ScaledSheet.create({
	hint: {
		paddingHorizontal: '20@s',
		marginBottom: '20@vs',
	},
	actionWrap: {
		paddingHorizontal: '20@s',
	},
	placeholder: {
		height: '100@vs',
	}
})