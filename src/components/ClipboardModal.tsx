import { useFocusClaimContext } from '@src/context/FocusClaim'
import { useThemeContext } from '@src/context/Theme'
import { NS } from '@src/i18n'
import { globals } from '@styles'
import { copyStrToClipboard, formatInt, formatMintUrl, formatSatStr } from '@util'
import { useTranslation } from 'react-i18next'
import { Text } from 'react-native'

import Button, { TxtButton } from './Button'
import MyModal from './modal'
import Txt from './Txt'

export default function ClipboardModal() {
	const { t } = useTranslation([NS.common])
	const { color, highlight } = useThemeContext()
	const { tokenInfo, claimOpen, closeModal, handleRedeem } = useFocusClaimContext()
	return (
		tokenInfo &&
		<MyModal type='bottom' animation='slide' visible={claimOpen} close={closeModal}>
			<Text style={globals(color, highlight).modalHeader}>
				{t('foundCashuClipboard')}
			</Text>
			<Text style={globals(color, highlight).modalTxt}>
				{tokenInfo.decoded.memo && tokenInfo.decoded.memo.length > 0 &&
					<>{t('memo', { ns: NS.history })}: {tokenInfo.decoded.memo}{'\n'}</>
				}
				<Txt txt={formatInt(tokenInfo.value)} bold />
				{' '}{formatSatStr(tokenInfo.value, 'compact', false)}{' '}{t('fromMint')}:{'\n'}
				{tokenInfo.mints.map(m => formatMintUrl(m)).join(', ')}
			</Text>
			<Button
				txt={t('accept')}
				onPress={() => void handleRedeem()}
			/>
			<TxtButton
				txt={t('cancel')}
				onPress={() => {
					// empty the clipboard to avoid re-triggering this modal
					void copyStrToClipboard('')
					closeModal()
				}}
			/>
		</MyModal>
	)
}