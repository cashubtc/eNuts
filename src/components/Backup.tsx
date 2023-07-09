import { l } from '@log'
import { ThemeContext } from '@src/context/Theme'
import { globals } from '@styles'
import { formatMintUrl } from '@util'
import * as Clipboard from 'expo-clipboard'
import { useContext, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Share, StyleSheet, Text } from 'react-native'

import ActionButtons from './ActionButtons'
import { getTranslationLangCode } from '@src/util/localization'

interface IBackupSuccessProps {
	token: string
	mint?: string
}

export default function BackupSuccess({ token, mint }: IBackupSuccessProps) {
	const { t } = useTranslation(getTranslationLangCode())
	const { color } = useContext(ThemeContext)
	const [copied, setCopied] = useState(false)
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
	const handleCopy = async () => {
		await Clipboard.setStringAsync(token)
		setCopied(true)
		const t = setTimeout(() => {
			setCopied(false)
			clearTimeout(t)
		}, 3000)
	}
	return (
		<>
			<Text style={[globals(color).navTxt, styles.subTxt]}>
				{t('backup.copyBackup')}
			</Text>
			<Text style={[styles.token, { color: color.TEXT }]}>
				{t('common.backup')}: {token.substring(0, 25)}...
			</Text>
			{mint &&
				<Text style={[styles.token, { color: color.TEXT }]}>
					Mint: {formatMintUrl(mint)}
				</Text>
			}
			<ActionButtons
				absolutePos
				topBtnTxt={t('common.share')}
				topBtnAction={() => void handleShare()}
				bottomBtnTxt={copied ? t('common.copied') : t('common.copyToken')}
				bottomBtnAction={() => void handleCopy()}
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