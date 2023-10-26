import ActionButtons from '@comps/ActionButtons'
import { NostrIcon } from '@comps/Icons'
import { BottomModal } from '@comps/modal/Question'
import Txt from '@comps/Txt'
import type { TNpubConfirmPageProps } from '@model/nav'
import { handleNewNpub } from '@nostr/util'
import { useNostrContext } from '@src/context/Nostr'
import { usePromptContext } from '@src/context/Prompt'
import { useThemeContext } from '@src/context/Theme'
import { NS } from '@src/i18n'
import { l } from '@src/logger'
import { store } from '@store'
import { STORE_KEYS } from '@store/consts'
import { globals } from '@styles'
import { isStr } from '@util'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'

export default function NpubConfirmScreen({ navigation, route }: TNpubConfirmPageProps) {

	// TODO we could fetch relay to get npub metadata and display it here and pass it to scan success screen

	const { npub } = route.params
	const { t } = useTranslation([NS.common])
	const { color } = useThemeContext()
	const { replaceNpub } = useNostrContext()
	const { openPromptAutoClose } = usePromptContext()
	const [modal, setModal] = useState(false)

	const handleNpub = async () => {
		const currentNpub = await store.get(STORE_KEYS.npub)
		l({ currentNpub })
		if (currentNpub === npub) {
			openPromptAutoClose({ msg: t('npubAlreadyAdded') })
			return
		}
		if (isStr(currentNpub) && npub !== currentNpub) {
			setModal(true)
			return
		}
		const didInit = await store.get(STORE_KEYS.nutpub)
		if (!currentNpub) {
			await handleNewNpub(npub, !isStr(didInit)).catch(() =>
				openPromptAutoClose({ msg: t('invalidPubKey') })
			)
			navigation.navigate('scan success', { npub })
		}
	}

	const handleNpubReplace = async () => {
		l({ npub })
		await replaceNpub(npub).catch(() =>
			openPromptAutoClose({ msg: t('invalidPubKey') })
		)
		setModal(false)
		navigation.navigate('scan success', { npub })
	}

	return (
		<View style={[globals(color).container, styles.container]}>
			<View />
			<View style={styles.infoWrap}>
				<NostrIcon width={60} height={60} />
				<Text style={globals(color).modalHeader}>
					{t('confirmNpub')}
				</Text>
				<Txt
					txt={t('confirmNpubHint')}
					styles={[styles.descText]}
				/>
				<Txt
					txt={npub}
					styles={[styles.hint, { color: color.TEXT_SECONDARY }]}
				/>
			</View>
			<ActionButtons
				topBtnTxt={t('confirm')}
				topBtnAction={() => void handleNpub()}
				bottomBtnTxt={t('cancel')}
				bottomBtnAction={() => navigation.goBack()}
			/>
			<BottomModal
				visible={modal}
				header={t('replaceNpub')}
				txt={t('replaceNpubTxt')}
				confirmTxt={t('yes')}
				confirmFn={() => void handleNpubReplace()}
				cancelTxt={t('cancel')}
				cancelFn={() => setModal(false)}
			/>
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		alignItems: 'center',
		justifyContent: 'space-between',
		padding: 20
	},
	descText: {
		marginBottom: 10,
		textAlign: 'center',
	},
	hint: {
		fontSize: 14,
		textAlign: 'center',
	},
	infoWrap: {
		alignItems: 'center',
	}
})