import { deriveSeedFromMnemonic } from '@cashu/cashu-ts'
import Button from '@comps/Button'
import useLoading from '@comps/hooks/Loading'
import Screen from '@comps/Screen'
import Txt from '@comps/Txt'
import TxtInput from '@comps/TxtInput'
import { isIOS } from '@consts'
import type { IConfirmMnemonicPageProps } from '@model/nav'
import { usePromptContext } from '@src/context/Prompt'
import { useThemeContext } from '@src/context/Theme'
import { NS } from '@src/i18n'
import { store } from '@store'
import { STORE_KEYS } from '@store/consts'
import { saveSeed } from '@store/restore'
import { createRef, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { KeyboardAvoidingView, type TextInput, View } from 'react-native'
import { ScaledSheet } from 'react-native-size-matters'

export default function ConfirmMnemonicScreen({ navigation, route }: IConfirmMnemonicPageProps) {

	const { t } = useTranslation([NS.common])
	const { color } = useThemeContext()
	const [input, setInput] = useState('')
	const inputRef = createRef<TextInput>()
	const { openPromptAutoClose } = usePromptContext()
	const { loading, startLoading, stopLoading } = useLoading()
	const randomInt = useMemo(() => Math.floor(Math.random() * 12), [])

	const handleConfirm = async () => {
		if (!input.length || loading) { return }
		if (input !== route.params.mnemonic[randomInt]) {
			openPromptAutoClose({
				msg: t('confirmMnemonicErr'),
				success: false,
				ms: 5000,
			})
			return setInput('')
		}
		startLoading()
		const mnemonic = route.params.mnemonic.join(' ')
		const seed = deriveSeedFromMnemonic(mnemonic)
		await saveSeed(seed)
		stopLoading()
		openPromptAutoClose({ msg: t('seedEnabled'), success: true })
		await store.set(STORE_KEYS.restoreCounter, '')
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
			withBackBtn
			handlePress={() => navigation.goBack()}
			screenName={t('confirm')}
		>
			<View style={{ flex: 1, justifyContent: 'space-between' }}>
				<Txt txt={t('confirmSeed')} styles={[styles.hint]} bold />
				<View style={{ alignItems: 'center' }}>
					<View style={[styles.seedWord, { backgroundColor: color.DRAWER }]}>
						<Txt
							bold
							txt={`${randomInt + 1}. `}
							styles={[{ fontSize: 18, color: color.TEXT }]}
						/>
						<Txt
							bold
							txt=' ???'
							styles={[{ fontSize: 18, color: color.TEXT_SECONDARY }]}
						/>
					</View>
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
						disabled={!input.length || loading}
						txt={t('confirm')}
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
		marginBottom: isIOS ? '0@s' : '20@s',
	},
	placeholder: {
		height: '100@vs',
	},
	seedWord: {
		padding: '10@s',
		borderRadius: '10@s',
		width: '50%',
		flexDirection: 'row',
		alignItems: 'center',
	},
})