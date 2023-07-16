import { getDecodedLnInvoice } from '@cashu/cashu-ts'
import Loading from '@comps/Loading'
import Txt from '@comps/Txt'
import { _testmintUrl } from '@consts'
import type { TProcessingPageProps } from '@model/nav'
import { ThemeContext } from '@src/context/Theme'
import { addToHistory } from '@store/HistoryStore'
import { requestMint, requestToken } from '@wallet'
import { useContext, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, View } from 'react-native'

export default function ProcessingScreen({ navigation, route }: TProcessingPageProps) {
	const { t } = useTranslation(['mints'])
	const { color } = useContext(ThemeContext)
	useEffect(() => {
		const { mint, amount } = route.params
		void (async () => {
			try {
				const resp = await requestMint(mint.mintUrl, amount)
				const decoded = getDecodedLnInvoice(resp.pr)
				// immediatly claim and navigate to success page for test-mint
				if (mint.mintUrl === _testmintUrl) {
					const { success, invoice } = await requestToken(mint.mintUrl, amount, resp.hash)
					if (!success) {
						// l('requestToken failed', success, invoice)
						return
					}
					// add as history entry
					await addToHistory({
						amount,
						type: 2,
						value: invoice?.pr || '',
						mints: [mint.mintUrl],
					})
					navigation.navigate('success', { amount, mint: mint.mintUrl })
					return
				}
				// navigate to invoice overview screen

			} catch (e) {
				// openPromptAutoClose({ msg: isErr(e) ? e.message : t('requestMintErr', { ns: 'error' }) })
			}
		})()
	}, [navigation, route.params])
	return (
		<View style={[styles.container, { backgroundColor: color.BACKGROUND }]}>
			<Loading size={40} />
			<Txt styles={[{ marginTop: 20 }]} txt={t('awaitingInvoice')} />
			<Txt styles={[styles.hint, { color: color.TEXT_SECONDARY }]} txt={t('invoiceHint')} />
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		paddingHorizontal: 20
	},
	hint: {
		fontSize: 14,
		marginTop: 10,
	}
})