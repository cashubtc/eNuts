import Button from '@comps/Button'
import useLoading from '@comps/hooks/Loading'
import Loading from '@comps/Loading'
import Screen from '@comps/Screen'
import Txt from '@comps/Txt'
import TxtInput from '@comps/TxtInput'
import { isIOS } from '@consts'
import type { IRecoverPageProps } from '@model/nav'
import { useThemeContext } from '@src/context/Theme'
import { NS } from '@src/i18n'
import { l } from '@src/logger'
import { getStrFromClipboard } from '@src/util'
import { globals } from '@styles'
import { createRef, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { KeyboardAvoidingView, Text, type TextInput, TouchableOpacity, View } from 'react-native'
import { ScaledSheet } from 'react-native-size-matters'

export default function RecoverScreen({ navigation }: IRecoverPageProps) {

	const { t } = useTranslation([NS.common])
	const { color, highlight } = useThemeContext()

	const [input, setInput] = useState('')
	const { loading } = useLoading()
	const inputRef = createRef<TextInput>()

	const handleBtnPress = () => {
		if (loading) { return }
		// TODO navigate to loading screen and send restore request
		l('request seed recovery', input)
	}

	const handleInputLabelPress = async () => {
		l('paste/clear input')
		if (input.length > 0) {
			return setInput('')
		}
		// paste from clipboard
		const clipboard = await getStrFromClipboard()
		if (!clipboard) { return }
		setInput(clipboard)
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
			screenName={t('walletRecovery')}
			withBackBtn
			handlePress={() => navigation.goBack()}
		>
			<View style={styles.container}>
				<Txt txt={t('recoveryHint')} styles={[styles.hint]} bold />
				<KeyboardAvoidingView
					behavior={isIOS ? 'padding' : undefined}
					style={styles.actionWrap}
				>
					<View style={{ position: 'relative' }}>
						<TxtInput
							multiline
							innerRef={inputRef}
							placeholder={t('12WordMnemonic')}
							onChangeText={text => setInput(text)}
							onSubmitEditing={() => void handleBtnPress()}
							autoFocus
							ms={200}
							style={[styles.multilineInput]}
						/>
						{/* Paste / Clear Input */}
						<TouchableOpacity
							style={[styles.pasteInputTxtWrap, { backgroundColor: color.INPUT_BG }]}
							onPress={() => void handleInputLabelPress()}
						>
							<Text style={globals(color, highlight).pressTxt}>
								{!input.length ? t('paste') : t('clear')}
							</Text>
						</TouchableOpacity>
					</View>
					<Button
						disabled={!input.length}
						txt={t('confirm')}
						onPress={() => void handleBtnPress()}
						icon={loading ? <Loading size={20} /> : undefined}
					/>
					{isIOS && <View style={styles.placeholder} />}
				</KeyboardAvoidingView>
			</View>
		</Screen>
	)
}

const styles = ScaledSheet.create({
	container: {
		flex: 1,
		justifyContent: 'space-between'
	},
	wrapContainer: {
		borderRadius: 20,
		paddingVertical: '20@vs',
		marginBottom: '20@vs',
		paddingRight: '40@s',
	},
	action: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: '20@s',
		width: '100%'
	},
	separator: {
		width: '100%',
		marginTop: '20@vs'
	},
	hint: {
		paddingHorizontal: '20@s',
		marginBottom: '20@vs',
	},
	actionWrap: {
		paddingHorizontal: '20@s',
	},
	pasteInputTxtWrap: {
		position: 'absolute',
		left: 0,
		right: 0,
		marginLeft: 'auto',
		marginRight: 'auto',
		bottom: '10@vs',
		padding: '10@s',
		borderBottomLeftRadius: 25,
		borderBottomRightRadius: 25,
	},
	placeholder: {
		height: '100@vs',
	},
	multilineInput: {
		height: '120@s',
		borderRadius: 25,
		paddingBottom: '40@s'
	}
})