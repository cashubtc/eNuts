import Button from '@comps/Button'
import Txt from '@comps/Txt'
import type { TMemoPageProps } from '@model/nav'
import TopNav from '@nav/TopNav'
import { ThemeContext } from '@src/context/Theme'
import { globals } from '@styles'
import { createRef, useContext, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, TextInput, View } from 'react-native'

export default function MemoScreen({ navigation, route }: TMemoPageProps) {
	const { mint, balance, amount, isSendingWholeMintBal } = route.params
	const { t } = useTranslation(['common'])
	const { color, highlight } = useContext(ThemeContext)
	const memoInputRef = createRef<TextInput>()
	const [memo, setMemo] = useState('')
	// auto-focus keyboard
	useEffect(() => {
		const t = setTimeout(() => {
			memoInputRef.current?.focus()
			clearTimeout(t)
		}, 400)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])
	return (
		<View style={[styles.container, { backgroundColor: color.BACKGROUND }]}>
			<TopNav
				screenName={t('sendEcash')}
				withBackBtn
			/>
			<Txt
				txt={t('addMemo')}
				styles={[styles.hint]}
			/>
			<View style={styles.actionContainer}>
				<TextInput
					ref={memoInputRef}
					style={globals(color, highlight).input}
					placeholder={t('optionalMemo')}
					placeholderTextColor={color.INPUT_PH}
					maxLength={21}
					onChangeText={setMemo}
				/>
				<View style={{ marginVertical: 10 }} />
				<Button
					txt={t('continue')}
					onPress={() => {
						// Check if user sends his whole mint balance, so there is no need for coin selection and that can be skipped here
						if (isSendingWholeMintBal) {
							navigation.navigate('processing', {
								mint,
								amount,
								estFee: 0,
								isSendEcash: true,
								memo
							})
							return
						}
						navigation.navigate('coinSelection', {
							mint,
							balance,
							amount,
							estFee: 0,
							isSendEcash: true,
							memo
						})
					}}
				/>
			</View>
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		paddingTop: 110,
		flexDirection: 'column',
		justifyContent: 'space-between',
	},
	hint: {
		paddingHorizontal: 20,
		marginBottom: 20,
		fontWeight: '500'
	},
	actionContainer: {
		padding: 20,
	}
})