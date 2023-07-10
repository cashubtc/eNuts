import Button from '@comps/Button'
import type { ITokenInfo } from '@model'
import { ThemeContext } from '@src/context/Theme'
import { globals } from '@styles'
import { formatInt, formatMintUrl } from '@util'
import { getTranslationLangCode } from '@util/localization'
import { useContext } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'

import MyModal from '.'

interface ITrustModalProps {
	loading: boolean
	tokenInfo?: ITokenInfo
	handleTrustModal: () => void
	closeModal: () => void
}

export default function TrustMintModal({ loading, tokenInfo, handleTrustModal, closeModal }: ITrustModalProps) {
	const { t } = useTranslation(getTranslationLangCode())
	const { color, highlight } = useContext(ThemeContext)
	return (
		<MyModal type='question' animation='fade' visible close={closeModal}>
			<Text style={globals(color, highlight).modalHeader}>
				{t('trustMint')}?
			</Text>
			{/* token amount */}
			<Text style={[styles.mintPrompt, { color: color.TEXT_SECONDARY, }]}>
				{formatInt(tokenInfo?.value || 0)} Satoshi {t('common.from')}:
			</Text>
			{/* Show in which mint(s) the tokens are */}
			<View style={styles.tokenMintsView}>
				{tokenInfo?.mints.map(m => <Text style={[styles.mintPrompt, { color: color.TEXT_SECONDARY, }]} key={m}>{formatMintUrl(m)}</Text>)}
			</View>
			<Text style={globals(color, highlight).modalTxt}>
				{t('notClaim')}.
			</Text>
			<Button loading={loading} txt={loading ? t('wallet.claiming') + '...' : t('common.yes')} onPress={handleTrustModal} />
			<View style={{ marginVertical: 10 }} />
			<Button
				outlined
				txt={t('common.no')}
				onPress={closeModal}
			/>
		</MyModal>
	)
}

const styles = StyleSheet.create({
	mintPrompt: {
		fontSize: 12,
		marginBottom: 5,
	},
	tokenMintsView: {
		marginBottom: 20
	},
})