import { useThemeContext } from '@src/context/Theme'
import { NS } from '@src/i18n'
import { globals } from '@styles'
import { formatMintUrl, share } from '@util'
import { useTranslation } from 'react-i18next'
import { Text } from 'react-native'
import { ScaledSheet } from 'react-native-size-matters'

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

const styles = ScaledSheet.create({
	subTxt: {
		marginTop: '20@vs',
		paddingHorizontal: '20@s',
	},
	token: {
		marginTop: '20@vs',
		fontSize: '14@vs',
		paddingHorizontal: '20@s',
	},
})