import Button from '@comps/Button'
import type { ITokenInfo } from '@model'
import { useThemeContext } from '@src/context/Theme'
import { NS } from '@src/i18n'
import { globals } from '@styles'
import { formatInt, formatMintUrl } from '@util'
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
	const { t } = useTranslation([NS.common])
	const { color, highlight } = useThemeContext()
	return (
		<MyModal type='question' animation='fade' visible close={closeModal}>
			<Text style={globals(color, highlight).modalHeader}>
				{t('trustMint')}?
			</Text>
			{/* token amount */}
			<Text style={[styles.mintPrompt, { color: color.TEXT_SECONDARY, }]}>
				{formatInt(tokenInfo?.value || 0)} Satoshi {t('from')}:
			</Text>
			{/* Show in which mint(s) the tokens are */}
			<View style={styles.tokenMintsView}>
				{tokenInfo?.mints.map(m => <Text style={[styles.mintPrompt, { color: color.TEXT_SECONDARY, }]} key={m}>{formatMintUrl(m)}</Text>)}
			</View>
			<Text style={globals(color, highlight).modalTxt}>
				{t('notClaim')}.
			</Text>
			<Button loading={loading} txt={loading ? t('claiming', { ns: NS.wallet }) + '...' : t('yes')} onPress={handleTrustModal} />
			<View style={{ marginVertical: 10 }} />
			<Button
				outlined
				txt={t('no')}
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