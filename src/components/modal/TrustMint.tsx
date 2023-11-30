import { TxtButton } from '@comps/Button'
import { ReceiveIcon, SwapIcon } from '@comps/Icons'
import Separator from '@comps/Separator'
import Txt from '@comps/Txt'
import type { ITokenInfo } from '@model'
import { useThemeContext } from '@src/context/Theme'
import { NS } from '@src/i18n'
import { globals, mainColors } from '@styles'
import { formatMintUrl, formatSatStr } from '@util'
import { useTranslation } from 'react-i18next'
import { Text, TouchableOpacity, View } from 'react-native'
import { s, ScaledSheet, vs } from 'react-native-size-matters'

import MyModal from '.'

interface ITrustModalProps {
	loading: boolean
	tokenInfo?: ITokenInfo
	handleTrustModal: () => void
	handleAutoSwap: () => void
	closeModal: () => void
}

export default function TrustMintModal({ loading, tokenInfo, handleTrustModal, handleAutoSwap, closeModal }: ITrustModalProps) {
	const { t } = useTranslation([NS.common])
	const { color, highlight } = useThemeContext()
	return (
		<MyModal type='bottom' animation='slide' visible close={closeModal}>
			<Text style={[globals(color, highlight).modalHeader, { marginBottom: vs(15) }]}>
				{t('trustMint')}?
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
			<TouchableOpacity onPress={handleAutoSwap} style={{ paddingHorizontal: s(20) }}>
				<View style={styles.action}>
					<View style={{ minWidth: s(40) }}>
						<SwapIcon width={s(22)} height={s(22)} color={mainColors.ZAP} />
					</View>
					<View>
						<Txt txt={t('autoSwapToDefaulMint')} bold />
						<Txt styles={[{ fontSize: vs(11), color: color.TEXT_SECONDARY }]} txt={t('swapHint')} />
					</View>
				</View>
			</TouchableOpacity>
			<Separator style={[{ width: '100%', marginTop: vs(20) }]} />
			<TouchableOpacity onPress={handleTrustModal} style={{ marginBottom: vs(20), paddingHorizontal: s(20) }}>
				<View style={styles.action}>
					<View style={{ minWidth: s(40) }}>
						<ReceiveIcon width={s(26)} height={s(26)} color={mainColors.VALID} />
					</View>
					<View>
						<Txt txt={loading ? t('claiming', { ns: NS.wallet }) : t('trustMintOpt')} bold />
						<Txt styles={[{ fontSize: vs(11), color: color.TEXT_SECONDARY }]} txt={t('trustHint')} />
					</View>
				</View>
			</TouchableOpacity>
			<TxtButton
				txt={t('cancel')}
				onPress={closeModal}
				style={[{ paddingBottom: vs(15), paddingTop: vs(15) }]}
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
		marginBottom: '40@vs'
	},
	action: {
		flexDirection: 'row',
		alignItems: 'center',
		width: '100%',
	}
})