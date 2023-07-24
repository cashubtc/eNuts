import Button from '@comps/Button'
import Txt from '@comps/Txt'
import TxtInput from '@comps/TxtInput'
import type { TMemoPageProps } from '@model/nav'
import TopNav from '@nav/TopNav'
import { ThemeContext } from '@src/context/Theme'
import { globals } from '@styles'
import { useContext, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, View } from 'react-native'

export default function MemoScreen({ navigation, route }: TMemoPageProps) {
	const { mint, balance, amount, isSendingWholeMintBal } = route.params
	const { t } = useTranslation(['common'])
	const { color } = useContext(ThemeContext)
	const [memo, setMemo] = useState('')
	const handlePress = () => {
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
	}
	return (
		<View style={[globals(color).container, styles.container]}>
			<TopNav
				screenName={t('sendEcash')}
				withBackBtn
			/>
			<Txt
				txt={t('addMemo')}
				styles={[styles.hint]}
			/>
			<View style={styles.actionContainer}>
				<TxtInput
					placeholder={t('optionalMemo')}
					maxLength={21}
					onChangeText={setMemo}
					onSubmitEditing={handlePress}
				/>
				<Button
					txt={t('continue')}
					onPress={handlePress}
				/>
			</View>
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
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