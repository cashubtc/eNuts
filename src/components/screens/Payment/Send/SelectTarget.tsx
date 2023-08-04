import useNostr from '@comps/hooks/Nostr'
import usePrompt from '@comps/hooks/Prompt'
import Option from '@comps/Option'
import Screen from '@comps/Screen'
import Toaster from '@comps/Toaster'
import Txt from '@comps/Txt'
import { l } from '@log'
import type { TSelectTargetPageProps } from '@model/nav'
import { ThemeContext } from '@src/context/Theme'
import { globals } from '@styles'
import { isNum } from '@util'
import { useContext } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, View } from 'react-native'

export default function SelectTargetScreen({ navigation, route }: TSelectTargetPageProps) {
	const { mint, balance, remainingMints, isSendEcash, nostr } = route.params
	const { t } = useTranslation(['mints'])
	const { color } = useContext(ThemeContext)
	const { prompt, openPromptAutoClose } = usePrompt()
	const { hasContacts } = useNostr()
	return (
		<Screen
			screenName={t('cashOut', { ns: 'common' })}
			withBackBtn
			handlePress={() => navigation.goBack()}
		>
			<Txt styles={[styles.hint]} txt={t('chooseTarget')} />
			<View style={[globals(color).wrapContainer, styles.targets]}>
				{isSendEcash || nostr ?
					<>
						<Option
							txt={t('copyShareToken')}
							hint={t('copyShareTokenHint')}
							onPress={() => navigation.navigate('selectAmount', { mint, balance, nostr, isSendEcash: true })}
							hasSeparator
						/>
						<Option
							txt={t('sendNostr')}
							hint={t('sendNostrHint')}
							onPress={() => navigation.navigate('Address book', { mint, balance, isSendEcash: true })}
						/>
					</>
					:
					<>
						{hasContacts &&
							<Option
								txt={t('addressBook', { ns: 'topNav' })}
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
							txt={t('inputField')}
							hint={t('meltInputHint')}
							onPress={() => navigation.navigate('meltInputfield', { mint, balance })}
							hasSeparator
						/>
						<Option
							txt={t('scanQR')}
							hint={t('meltScanQRHint')}
							onPress={() => navigation.navigate('qr scan', { mint, balance })}
							hasSeparator
						/>
						<Option
							txt={t('multimintSwap', { ns: 'common' })}
							hint={t('meltSwapHint')}
							onPress={() => {
								l({ remainingMints })
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
			{prompt.open && <Toaster txt={prompt.msg} />}
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
