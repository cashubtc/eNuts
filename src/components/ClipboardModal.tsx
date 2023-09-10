import { useFocusClaimContext } from '@src/context/FocusClaim'
import { useThemeContext } from '@src/context/Theme'
import { NS } from '@src/i18n'
import { globals } from '@styles'
import { formatInt } from '@util'
import { useTranslation } from 'react-i18next'
import { Text, View } from 'react-native'

import Button from './Button'
import MyModal from './modal'
import Txt from './Txt'

export default function ClipboardModal() {
	const { t } = useTranslation([NS.common])
	const { color, highlight } = useThemeContext()
	const { tokenInfo, claimOpen, closeModal, handleRedeem } = useFocusClaimContext()
	return (
		tokenInfo &&
		<MyModal type='question' visible={claimOpen} close={closeModal}>
			<Text style={globals(color, highlight).modalHeader}>
				{t('foundCashuClipboard')}
			</Text>
			<Text style={globals(color, highlight).modalTxt}>
				{tokenInfo.decoded.memo && tokenInfo.decoded.memo.length > 0 &&
					<>{t('memo', { ns: NS.history })}: {tokenInfo.decoded.memo}{'\n'}</>
				}
				<Txt
					txt={formatInt(tokenInfo.value)}
					styles={[{ fontWeight: '500' }]}
				/>
				{' '}Satoshi {t('fromMint')}:{' '}
				{tokenInfo.mints.join(', ')}
			</Text>
			<Button
				txt={t('accept')}
				onPress={() => void handleRedeem()}
			/>
			<View style={{ marginVertical: 10 }} />
			<Button
				txt={t('cancel')}
				outlined
				onPress={closeModal}
			/>
		</MyModal>
	)
}