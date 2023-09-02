import { BookIcon, NostrIcon, ScanQRIcon, ShareIcon, SwapIcon, ZapIcon } from '@comps/Icons'
import Option from '@comps/Option'
import Screen from '@comps/Screen'
import Txt from '@comps/Txt'
import type { TSelectTargetPageProps } from '@model/nav'
import { _testmintUrl } from '@src/consts'
import { useNostrContext } from '@src/context/Nostr'
import { usePromptContext } from '@src/context/Prompt'
import { useThemeContext } from '@src/context/Theme'
import { NS } from '@src/i18n'
import { globals, highlight, mainColors } from '@styles'
import { isNum } from '@util'
import { useTranslation } from 'react-i18next'
import { StyleSheet, View } from 'react-native'

export default function SelectTargetScreen({ navigation, route }: TSelectTargetPageProps) {
	const { mint, balance, remainingMints, isSendEcash, nostr } = route.params
	const { t } = useTranslation([NS.mints])
	const { openPromptAutoClose } = usePromptContext()
	const { color } = useThemeContext()
	const { nutPub } = useNostrContext()
	return (
		<Screen
			screenName={t(isSendEcash ? 'sendEcash' : 'cashOut', { ns: NS.common })}
			withBackBtn
			handlePress={() => navigation.goBack()}
		>
			<Txt styles={[styles.hint]} txt={t('chooseTarget')} />
			<View style={[globals(color).wrapContainer, styles.targets]}>
				{isSendEcash || nostr ?
					<>
						<Option
							icon={<ShareIcon width={20} height={20} color={mainColors.VALID} />}
							txt={t('copyShareToken')}
							hint={t('copyShareTokenHint')}
							onPress={() => navigation.navigate('selectAmount', { mint, balance, nostr, isSendEcash: true })}
							hasSeparator
						/>
						<Option
							icon={<NostrIcon />}
							txt={t('sendNostr')}
							hint={t('sendNostrHint')}
							onPress={() => navigation.navigate('Address book', { mint, balance, isSendEcash: true })}
						/>
					</>
					:
					<>
						{nutPub.length > 0 &&
							<Option
								icon={<BookIcon color={highlight['Nostr']} />}
								txt={t('addressBook', { ns: NS.topNav })}
								hint={t('meltAddressbookHint')}
								onPress={() => {
									navigation.navigate('Address book', {
										isMelt: true,
										mint,
										balance: isNum(balance) ? balance : 0
									})
								}}
								hasSeparator
							/>
						}
						<Option
							icon={<ZapIcon width={28} height={28} color={mainColors.WARN} />}
							txt={t('inputField')}
							hint={t('meltInputHint')}
							onPress={() => navigation.navigate('meltInputfield', { mint, balance })}
							hasSeparator
						/>
						<Option
							icon={<ScanQRIcon color={highlight['Sky']} />}
							txt={t('scanQR')}
							hint={t('meltScanQRHint')}
							onPress={() => navigation.navigate('qr scan', { mint, balance })}
							hasSeparator
						/>
						<Option
							icon={<SwapIcon color={highlight['Zap']} />}
							txt={t('multimintSwap', { ns: NS.common })}
							hint={t('meltSwapHint')}
							onPress={() => {
								// check if source mint is testmint
								if (__DEV__ && mint.mintUrl === _testmintUrl) {
									openPromptAutoClose({ msg: t('swapNotAllowed') })
									return
								}
								// check if there is another mint except testmint
								if (!remainingMints?.length) {
									openPromptAutoClose({ msg: t('atLeast2Mints') })
									return
								}
								navigation.navigate('selectMintToSwapTo', { mint, balance, remainingMints })
							}}
						/>
					</>
				}
			</View>
		</Screen>
	)
}

const styles = StyleSheet.create({
	hint: {
		paddingHorizontal: 20,
		marginBottom: 20,
		fontWeight: '500',
	},
	targets: {
		paddingVertical: 20,
	},
})
