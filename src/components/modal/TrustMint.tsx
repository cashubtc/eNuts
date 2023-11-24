import Button from '@comps/Button'
import type { ITokenInfo } from '@model'
import { useThemeContext } from '@src/context/Theme'
import { NS } from '@src/i18n'
import { globals } from '@styles'
import { formatMintUrl, formatSatStr } from '@util'
import { useTranslation } from 'react-i18next'
import { Text, View } from 'react-native'
import { ScaledSheet, vs } from 'react-native-size-matters'

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
		<MyModal type='bottom' animation='slide' visible close={closeModal}>
			<Text style={globals(color, highlight).modalHeader}>
				{t('trustMint')}?
			</Text>
			<Text style={[globals(color, highlight).modalTxt, { color: color.TEXT_SECONDARY }]}>
				{t('notClaim')}.
			</Text>
			{/* token amount */}
			{tokenInfo &&
				<Text style={[styles.mintPrompt, { color: color.TEXT }]}>
					{formatSatStr(tokenInfo.value)}{' '}{t('from')}:
				</Text>
			}
			{/* Show in which mint(s) the tokens are */}
			<View style={styles.tokenMintsView}>
				{tokenInfo?.mints.map(m => <Text style={[styles.mintPrompt, { color: color.TEXT }]} key={m}>{formatMintUrl(m)}</Text>)}
			</View>
			<Button loading={loading} txt={loading ? t('claiming', { ns: NS.wallet }) : t('yes')} onPress={handleTrustModal} />
			<View style={{ marginVertical: vs(10) }} />
			<Button
				outlined
				txt={t('no')}
				onPress={closeModal}
			/>
		</MyModal>
	)
}

const styles = ScaledSheet.create({
	mintPrompt: {
		fontSize: '12@vs',
		marginBottom: '5@vs',
	},
	tokenMintsView: {
		marginBottom: '20@vs'
	},
})