import { BookIcon, NostrIcon, ScanQRIcon, ShareIcon, SwapIcon, UserIcon, ZapIcon } from '@comps/Icons'
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
import { ScrollView, View } from 'react-native'
import { s, ScaledSheet } from 'react-native-size-matters'

export default function SelectTargetScreen({ navigation, route }: TSelectTargetPageProps) {
	const { mint, balance, remainingMints, isSendEcash, nostr } = route.params
	const { t } = useTranslation([NS.mints])
	const { openPromptAutoClose } = usePromptContext()
	const { color } = useThemeContext()
	const { nutPub, lud16 } = useNostrContext().nostr
	return (
		<Screen
			screenName={t(isSendEcash ? 'sendEcash' : 'cashOut', { ns: NS.common })}
			withBackBtn
			handlePress={() => navigation.goBack()}
		>
			<Txt txt={t('chooseTarget')} styles={[styles.hint]} bold />
			<ScrollView alwaysBounceVertical={false}>
				<View style={globals(color).wrapContainer}>
					{isSendEcash || nostr ?
						<>
							<Option
								icon={<ShareIcon width={s(18)} height={s(18)} color={mainColors.VALID} />}
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
								<>
									{lud16.length > 0 &&
										<Option
											icon={<UserIcon color={highlight['Default']} />}
											txt={lud16}
											hint={t('meltNostrProfileHint', { ns: NS.common })}
											onPress={() => {
												navigation.navigate('selectAmount', {
													mint,
													balance,
													isMelt: true,
													lnurl: lud16
												})
											}}
											hasSeparator
										/>
									}
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
								</>
							}
							<Option
								icon={<ZapIcon width={s(26)} height={s(26)} color={mainColors.ZAP} />}
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
									if (mint.mintUrl === _testmintUrl) {
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
			</ScrollView>
		</Screen>
	)
}

const styles = ScaledSheet.create({
	hint: {
		paddingHorizontal: '20@s',
		marginBottom: '20@vs',
	},
})
