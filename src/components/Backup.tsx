import { l } from '@log'
import { useThemeContext } from '@src/context/Theme'
import { globals } from '@styles'
import { formatMintUrl } from '@util'
import { useTranslation } from 'react-i18next'
import { Share, StyleSheet, Text } from 'react-native'

import ActionButtons from './ActionButtons'
import useCopy from './hooks/Copy'

interface IBackupSuccessProps {
	token: string
	mint?: string
}

export default function BackupSuccess({ token, mint }: IBackupSuccessProps) {
	const { t } = useTranslation(['common'])
	const { color } = useThemeContext()
	const { copied, copy } = useCopy()

	const handleShare = async () => {
		try {
			const res = await Share.share({
				message: token, // `cashu://${route.params.token}`
				url: `cashu://${token}`
			})
			if (res.action === Share.sharedAction) {
				if (res.activityType) {
					// shared with activity type of result.activityType
					l('shared with activity type of result.activityType')
				} else {
					// shared
					l('shared')
				}
			} else if (res.action === Share.dismissedAction) {
				// dismissed
				l('sharing dismissed')
			}
		} catch (e) {
			l(e)
		}
	}
	return (
		<>
			<Text style={[globals(color).navTxt, styles.subTxt]}>
				{t('copyBackup', { ns: 'backup' })}
			</Text>
			<Text style={[styles.token, { color: color.TEXT }]}>
				{t('backup', { ns: 'topNav' })}: {token.substring(0, 25)}...
			</Text>
			{mint &&
				<Text style={[styles.token, { color: color.TEXT }]}>
					Mint: {formatMintUrl(mint)}
				</Text>
			}
			<ActionButtons
				absolutePos
				topBtnTxt={t('share')}
				topBtnAction={() => void handleShare()}
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