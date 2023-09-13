import { useThemeContext } from '@src/context/Theme'
import { NS } from '@src/i18n'
import { globals } from '@styles'
import { formatMintUrl, share } from '@util'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text } from 'react-native'

import ActionButtons from './ActionButtons'
import useCopy from './hooks/Copy'

interface IBackupSuccessProps {
	token: string
	mint?: string
}

export default function BackupSuccess({ token, mint }: IBackupSuccessProps) {
	const { t } = useTranslation([NS.common])
	const { color } = useThemeContext()
	const { copied, copy } = useCopy()

	return (
		<>
			<Text style={[globals(color).navTxt, styles.subTxt]}>
				{t('copyBackup', { ns: NS.backup })}
			</Text>
			<Text style={[styles.token, { color: color.TEXT }]}>
				{t('backup', { ns: NS.topNav })}: {token.substring(0, 25)}...
			</Text>
			{mint &&
				<Text style={[styles.token, { color: color.TEXT }]}>
					Mint: {formatMintUrl(mint)}
				</Text>
			}
			<ActionButtons
				absolutePos
				topBtnTxt={t('share')}
				topBtnAction={() => void share(token, `cashu://${token}`)}
				bottomBtnTxt={copied ? t('copied') : t('copyToken')}
				bottomBtnAction={() => void copy(token)}
			/>
		</>
	)
}

const styles = StyleSheet.create({
	subTxt: {
		marginTop: 20,
		paddingHorizontal: 20,
	},
	token: {
		marginTop: 20,
		fontSize: 16,
		paddingHorizontal: 20,
	},
})