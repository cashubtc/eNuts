import { TxtButton } from '@comps/Button'
import { ReceiveIcon, SwapIcon } from '@comps/Icons'
import Loading from '@comps/Loading'
import Separator from '@comps/Separator'
import type { ITokenInfo } from '@model'
import type { RootStackParamList } from '@model/nav'
import { type NavigationProp, useNavigation } from '@react-navigation/core'
import { usePromptContext } from '@src/context/Prompt'
import { useThemeContext } from '@src/context/Theme'
import { NS } from '@src/i18n'
import { getDefaultMint } from '@store/mintStore'
import { globals, mainColors } from '@styles'
import { formatMintUrl, formatSatStr, isStr } from '@util'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Text, TouchableOpacity, View } from 'react-native'
import { s, ScaledSheet, vs } from 'react-native-size-matters'

import MyModal from '.'

interface ITrustModalProps {
	loading: boolean
	tokenInfo?: ITokenInfo
	handleTrustModal: () => void
	closeModal: () => void
}

type StackNavigation = NavigationProp<RootStackParamList>

export default function TrustMintModal({ loading, tokenInfo, handleTrustModal, closeModal }: ITrustModalProps) {
	const { t } = useTranslation([NS.common])
	const nav = useNavigation<StackNavigation>()
	const { color, highlight } = useThemeContext()
	const { openPromptAutoClose } = usePromptContext()
	const [defaultMint, setDefaultMint] = useState('')

	const handleAutoSwap = () => {
		if (!tokenInfo) {
			return openPromptAutoClose({ msg: 'tokenInfo is undefined or user has no default mint' })
		}
		closeModal()
		nav.navigate('processing', {
			mint: {
				mintUrl: tokenInfo.mints[0],
				customName: ''
			},
			tokenInfo,
			targetMint: { mintUrl: defaultMint, customName: '' },
			amount: 0, // The amount is not important here, it will be retrieved from the tokenInfo
			isAutoSwap: true
		})
	}
	useEffect(() => {
		void (async () => {
			const defaultMint = await getDefaultMint()
			if (isStr(defaultMint) && defaultMint.length > 0) {
				setDefaultMint(defaultMint)
			}
		})()
	}, [])
	return (
		<MyModal type='bottom' animation='slide' visible close={closeModal}>
			<Text style={[globals(color, highlight).modalHeader, { marginBottom: vs(15) }]}>
				{t('trustMint')}
			</Text>
			{/* token amount */}
			{tokenInfo &&
				<Text style={[styles.mintPrompt, { color: color.TEXT }]}>
					{formatSatStr(tokenInfo.value)}{' '}{t('from')}:
				</Text>
			}
			{/* Show in which mint(s) the tokens are */}
			<View style={styles.tokenMintsView}>
				{tokenInfo?.mints.map(m => (
					<Text
						style={[styles.mintPrompt, { color: color.TEXT }]}
						key={m}
					>
						{formatMintUrl(m)}
					</Text>
				))}
			</View>
			<TouchableOpacity
				onPress={() => void handleAutoSwap()}
				style={[styles.container, { opacity: defaultMint.length === 0 ? 0.4 : 1 }]}
				disabled={defaultMint.length === 0}
			>
				<View style={styles.iconContainer}>
					<SwapIcon width={s(22)} height={s(22)} color={mainColors.ZAP} />
				</View>
				<View style={styles.txtWrap}>
					<Text style={[styles.actionText, { color: color.TEXT }]}>
						{t('autoSwapToDefaulMint')}
					</Text>
					<Text style={[
						styles.descriptionText,
						{ color: defaultMint.length === 0 ? mainColors.WARN : color.TEXT_SECONDARY }
					]}>
						{defaultMint.length === 0 ?
							t('noDefaultHint')
							:
							t('swapHint')
						}
					</Text>
				</View>
			</TouchableOpacity>
			<Separator style={[styles.separator]} />
			<TouchableOpacity
				style={styles.container}
				onPress={handleTrustModal}
			>
				<View style={styles.iconContainer}>
					{loading ?
						<View>
							<Loading size='small' color={mainColors.VALID} />
						</View>
						:
						<ReceiveIcon width={s(26)} height={s(26)} color={mainColors.VALID} />
					}
				</View>
				<View style={styles.txtWrap}>
					<Text style={[styles.actionText, { color: color.TEXT }]}>
						{loading ? t('claiming', { ns: NS.wallet }) : t('trustMintOpt')}
					</Text>
					<Text style={[styles.descriptionText, { color: color.TEXT_SECONDARY }]}>
						{t('trustHint')}
					</Text>
				</View>
			</TouchableOpacity>
			<TxtButton
				txt={t('cancel')}
				onPress={closeModal}
				style={[styles.TxtButton]}
			/>
		</MyModal>
	)
}

const styles = ScaledSheet.create({
	container: {
		flexDirection: 'row',
		alignItems: 'center',
		width: '100%',
	},
	iconContainer: {
		minWidth: '11%',
	},
	txtWrap: {
		width: '90%',
	},
	actionText: {
		fontSize: '14@vs',
		fontWeight: '500',
		marginBottom: '4@vs',
	},
	descriptionText: {
		fontSize: '12@vs',
	},
	mintPrompt: {
		fontSize: '12@vs',
		marginBottom: '5@vs',
	},
	tokenMintsView: {
		marginBottom: '30@vs'
	},
	TxtButton: {
		paddingBottom: vs(15),
		paddingTop: vs(25)
	},
	separator: {
		width: '100%',
		marginTop: '10@vs',
		marginBottom: '10@vs'
	}
})