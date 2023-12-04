import { useThemeContext } from '@src/context/Theme'
import { NS } from '@src/i18n'
import { store } from '@store'
import { STORE_KEYS } from '@store/consts'
import { highlight as hi, mainColors } from '@styles/colors'
import { formatMintUrl, share } from '@util'
import { useTranslation } from 'react-i18next'
import { TouchableOpacity, View } from 'react-native'
import { s, ScaledSheet, vs } from 'react-native-size-matters'

import Button from './Button'
import useCopy from './hooks/Copy'
import { CheckmarkIcon, CopyIcon, FlagIcon, ShareIcon } from './Icons'
import Txt from './Txt'

interface IBackupSuccessProps {
	token: string
	mint?: string
}

export default function BackupSuccess({ token, mint }: IBackupSuccessProps) {
	const { t } = useTranslation([NS.common])
	const { color, highlight } = useThemeContext()
	const { copied, copy } = useCopy()
	const handleCopy = async () => {
		await copy(token)
		// we can save the created backup here to avoid foreground prompts of self-created backup tokens
		await store.set(STORE_KEYS.createdToken, token)
	}
	return (
		<>
			<View style={styles.container}>
				<Txt
					txt={t('backupQ')}
					bold
					styles={[styles.header]}
				/>
				<Txt
					txt={t('backupHint')}
					styles={[styles.header, { color: color.TEXT_SECONDARY, marginBottom: !mint ? 0 : vs(10) }]}
				/>
				{!mint &&
					<Txt
						txt={t('singleBackupHint')}
						styles={[styles.header, { color: mainColors.WARN }]}
					/>
				}
				{mint &&
					<Txt bold txt={`Mint: ${formatMintUrl(mint)}`} />
				}
				<TouchableOpacity
					style={[styles.tokenWrap, { backgroundColor: color.INPUT_BG }]}
					onPress={() => void handleCopy()}
				>
					<View style={styles.backupTxtWrap}>
						<FlagIcon color={color.TEXT} />
						<Txt txt={`${token.substring(0, 20)}...`} bold styles={[{ marginLeft: s(10) }]} />
					</View>
					{copied ? <CheckmarkIcon color={mainColors.VALID} /> : <CopyIcon color={color.TEXT} />}
				</TouchableOpacity>
			</View>
			<View style={styles.action}>
				<Button
					outlined
					txt={t('share')}
					onPress={() => void share(token, `cashu://${token}`)}
					icon={<ShareIcon width={20} height={20} color={hi[highlight]} />}
				/>
			</View>
		</>
	)
}

const styles = ScaledSheet.create({
	container: {
		flex: 1,
		paddingHorizontal: '20@s',
	},
	header: {
		marginBottom: '10@vs',
	},
	tokenWrap: {
		paddingVertical: '15@vs',
		paddingHorizontal: '10@s',
		borderRadius: '5@s',
		marginVertical: '5@vs',
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	backupTxtWrap: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	action: {
		padding: '20@s',
	}
})