import { getEncodedToken } from '@cashu/cashu-ts'
import { type RootStackParamList } from '@model/nav'
import { type NavigationProp, useNavigation } from '@react-navigation/core'
import { useFocusClaimContext } from '@src/context/FocusClaim'
import { usePromptContext } from '@src/context/Prompt'
import { useThemeContext } from '@src/context/Theme'
import { NS } from '@src/i18n'
import { addToHistory } from '@store/latestHistoryEntries'
import { globals, mainColors } from '@styles'
import { copyStrToClipboard, formatInt, formatMintUrl, formatSatStr, isErr } from '@util'
import { claimToken } from '@wallet'
import { getTokenInfo } from '@wallet/proofs'
import { useTranslation } from 'react-i18next'
import { Text } from 'react-native'

import Button, { TxtButton } from './Button'
import useLoading from './hooks/Loading'
import Loading from './Loading'
import MyModal from './modal'
import Txt from './Txt'

type StackNavigation = NavigationProp<RootStackParamList>

export default function ClipboardModal() {
	const nav = useNavigation<StackNavigation>()
	const { t } = useTranslation([NS.common])
	const { color, highlight } = useThemeContext()
	const { tokenInfo, claimOpen, setClaimOpen, setClaimed, closeModal } = useFocusClaimContext()
	const { loading, startLoading, stopLoading } = useLoading()
	const { openPromptAutoClose } = usePromptContext()

	const handleRedeem = async () => {
		startLoading()
		if (!tokenInfo) {
			setClaimOpen(false)
			return stopLoading()
		}
		const encoded = getEncodedToken(tokenInfo.decoded)
		try {
			const success = await claimToken(encoded)
			if (!success) {
				stopLoading()
				setClaimOpen(false)
				return openPromptAutoClose({ msg: t('invalidOrSpent', { ns: NS.common }) })
			}
		} catch (e) {
			stopLoading()
			setClaimOpen(false)
			return openPromptAutoClose({ msg: isErr(e) ? e.message : t('claimTokenErr', { ns: NS.error }) })
		}
		const info = getTokenInfo(encoded)
		if (!info) {
			stopLoading()
			setClaimOpen(false)
			return openPromptAutoClose({ msg: t('tokenInfoErr', { ns: NS.common }) })
		}
		stopLoading()
		setClaimOpen(false)
		// add as history entry (receive ecash)
		await addToHistory({
			amount: info.value,
			type: 1,
			value: encoded,
			mints: info.mints,
		})
		nav.navigate('success', {
			amount: info?.value,
			memo: info?.decoded.memo,
			isClaim: true
		})
		setClaimed(true)
	}

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
				icon={loading ? <Loading color={mainColors.WHITE} /> : undefined}
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