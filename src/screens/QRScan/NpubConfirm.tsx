import ActionButtons from '@comps/ActionButtons'
import useLoading from '@comps/hooks/Loading'
import { NostrIcon } from '@comps/Icons'
import Loading from '@comps/Loading'
import { BottomModal } from '@comps/modal/Question'
import Txt from '@comps/Txt'
import type { TNpubConfirmPageProps } from '@model/nav'
import { IContact } from '@model/nostr'
import { pool } from '@nostr/class/Pool'
import { defaultRelays, EventKind } from '@nostr/consts'
import { getNostrUsername, handleNewNpub, parseProfileContent } from '@nostr/util'
import NIP05Verified from '@screens/Addressbook/Contact/NIP05'
import ProfilePic from '@screens/Addressbook/ProfilePic'
import { useNostrContext } from '@src/context/Nostr'
import { usePromptContext } from '@src/context/Prompt'
import { useThemeContext } from '@src/context/Theme'
import { NS } from '@src/i18n'
import { store } from '@store'
import { STORE_KEYS } from '@store/consts'
import { globals, highlight as hi } from '@styles'
import { isStr } from '@util'
import { Event as NostrEvent, nip19 } from 'nostr-tools'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Text, View } from 'react-native'
import { s, ScaledSheet } from 'react-native-size-matters'

export default function NpubConfirmScreen({ navigation, route }: TNpubConfirmPageProps) {

	const { hex } = route.params
	const { t } = useTranslation([NS.common])
	const { color, highlight } = useThemeContext()
	const { replaceNpub, setNostr } = useNostrContext()
	const { openPromptAutoClose } = usePromptContext()
	const [modal, setModal] = useState(false)
	const [userProfile, setUserProfile] = useState<IContact | undefined>()
	const { loading, startLoading, stopLoading } = useLoading()

	const handleMetadata = () => {
		if (!hex || !isStr(hex)) { return }
		const sub = pool.subscribePool({
			filter: {
				relayUrls: defaultRelays,
				authors: [hex],
				kinds: [EventKind.Metadata],
			}
		})
		stopLoading()
		sub?.on('event', (e: NostrEvent) => {
			if (+e.kind === EventKind.Metadata) {
				setUserProfile(prev => ({ ...prev, ...parseProfileContent(e), hex }))
			}
		})
	}

	const handleNpub = async () => {
		const currentHex = await store.get(STORE_KEYS.npubHex)
		if (currentHex === hex) {
			openPromptAutoClose({ msg: t('npubAlreadyAdded') })
			return
		}
		if (isStr(currentHex) && hex !== currentHex) {
			setModal(true)
			return
		}
		const didInit = await store.get(STORE_KEYS.nutpub)
		if (!currentHex) {
			setNostr(prev => ({
				...prev,
				pubKey: { encoded: nip19.npubEncode(hex), hex }
			}))
			await handleNewNpub(hex, !isStr(didInit)).catch(() =>
				openPromptAutoClose({ msg: t('invalidPubKey') })
			)
			navigation.navigate('scan success', { hex, userProfile })
		}
	}

	const handleNpubReplace = async () => {
		await replaceNpub(hex).catch(() =>
			openPromptAutoClose({ msg: t('invalidPubKey') })
		)
		setModal(false)
		navigation.navigate('scan success', { hex, userProfile })
	}

	useEffect(() => {
		startLoading()
		handleMetadata()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	return (
		<View style={[globals(color).container, styles.container]}>
			<View />
			<View style={styles.infoWrap}>
				{loading ?
					<Loading color={hi[highlight]} size={s(50)} />
					: userProfile?.picture ?
						<>
							<ProfilePic
								hex={userProfile.hex}
								uri={userProfile.picture}
								size={100}
							/>
							<Text style={[styles.name, { color: color.TEXT }]}>
								{getNostrUsername(userProfile)}
							</Text>
							{userProfile?.nip05 &&
								<NIP05Verified nip05={userProfile.nip05} onPress={() => {/* ignore */ }} />
							}
							<Txt
								txt={nip19.npubEncode(hex)}
								styles={[styles.hint, { color: color.TEXT_SECONDARY }]}
							/>
						</>
						:
						<NostrIcon width={s(50)} height={s(50)} />
				}
				<Txt
					txt={t('confirmNpubHint')}
					styles={[styles.descText]}
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

const styles = ScaledSheet.create({
	container: {
		alignItems: 'center',
		justifyContent: 'space-between',
		padding: '20@s',
	},
	descText: {
		marginBottom: '10@vs',
		textAlign: 'center',
	},
	hint: {
		fontSize: '12@vs',
		textAlign: 'center',
		marginVertical: '20@vs',
	},
	infoWrap: {
		alignItems: 'center',
	},
	name: {
		fontSize: '20@vs',
		fontWeight: '500',
		marginTop: '20@vs',
		marginBottom: '5@vs',
	}
})