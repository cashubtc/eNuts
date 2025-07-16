import Button, { TxtButton } from '@comps/Button'
import useLoading from '@comps/hooks/Loading'
import LeaveAppModal from '@comps/LeaveAppModal'
import Loading from '@comps/Loading'
import { BottomModal } from '@comps/modal/Question'
import Txt from '@comps/Txt'
import { isIOS } from '@consts'
import { getMintsBalances } from '@db'
import type { TNpubConfirmPageProps } from '@model/nav'
import type { IContact } from '@model/nostr'
import { pool } from '@nostr/class/Pool'
import { defaultRelays, EventKind } from '@nostr/consts'
import { getNostrUsername, handleNewNpub, npubEncode, parseProfileContent, truncateNpub } from '@nostr/util'
import ProfileBanner from '@screens/Addressbook/Contact/Banner'
import Lud from '@screens/Addressbook/Contact/Lud'
import NIP05Verified from '@screens/Addressbook/Contact/NIP05'
import Website from '@screens/Addressbook/Contact/Website'
import ProfilePic from '@screens/Addressbook/ProfilePic'
import Username from '@screens/Addressbook/Username'
import { useNostrContext } from '@src/context/Nostr'
import { usePromptContext } from '@src/context/Prompt'
import { useThemeContext } from '@src/context/Theme'
import { NS } from '@src/i18n'
import { store } from '@store'
import { STORE_KEYS } from '@store/consts'
import { getCustomMintNames } from '@store/mintStore'
import { globals } from '@styles'
import { isStr } from '@util'
import { Event as NostrEvent, nip19 } from 'nostr-tools'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'
import { s, ScaledSheet, vs } from 'react-native-size-matters'

export default function NpubConfirmScreen({ navigation, route }: TNpubConfirmPageProps) {

	const { hex, isPayment } = route.params
	const { t } = useTranslation([NS.common])
	const { color } = useThemeContext()
	const { replaceNpub, setNostr } = useNostrContext()
	const { openPromptAutoClose } = usePromptContext()
	const [modal, setModal] = useState(false)
	const [userProfile, setUserProfile] = useState<IContact | undefined>()
	const { loading, startLoading, stopLoading } = useLoading()
	const [visible, setVisible] = useState(false)
	const closeModal = useCallback(() => setVisible(false), [])
	const [url, setUrl] = useState('')

	// link press
	const handlePress = (url: string) => {
		if (url === 'lightning://') {
			 
			openPromptAutoClose({ msg: `⚠️\n\n${t('zapSoon', { ns: NS.common })}\n\n⚡👀` })
			return
		}
		setVisible(true)
		setUrl(url)
	}

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

	// start sending ecash via nostr
	const handleSend = async () => {
		const mintsWithBal = await getMintsBalances()
		const mints = await getCustomMintNames(mintsWithBal.map(m => ({ mintUrl: m.mintUrl })))
		const nonEmptyMints = mintsWithBal.filter(m => m.amount > 0)
		const nostr = {
			senderName: getNostrUsername(userProfile),
			contact: userProfile,
		}
		if (nonEmptyMints.length === 1) {
			navigation.navigate('selectNostrAmount', {
				mint: mints.find(m => m.mintUrl === nonEmptyMints[0].mintUrl) || { mintUrl: 'N/A', customName: 'N/A' },
				balance: nonEmptyMints[0].amount,
				nostr,
			})
			return
		}
		navigation.navigate('selectMint', {
			mints,
			mintsWithBal,
			allMintsEmpty: !nonEmptyMints.length,
			isSendEcash: true,
			nostr,
		})
	}

	useEffect(() => {
		startLoading()
		handleMetadata()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	return (
		<View style={[globals(color).container, styles.container]}>
			{loading ?
				<Loading size={vs(30)} />
				:
				<>
					{/* Contact pictures overview */}
					<ProfileBanner hex={userProfile?.hex} uri={userProfile?.banner} />
					<View style={styles.profilePicContainer}>
						<View style={styles.picWrap}>
							<ProfilePic
								hex={userProfile?.hex}
								uri={userProfile?.picture}
								size={s(70)}
							/>
						</View>
					</View>
					<View style={styles.contentWrap}>
						{/* username */}
						<Username contact={userProfile} fontSize={vs(22)} />
						{/* npub */}
						<Txt
							 
							txt={`${truncateNpub(npubEncode(userProfile?.hex ?? ''))}`}
							styles={[styles.npub, { color: color.TEXT_SECONDARY }]}
						/>
						{/* tags */}
						<View style={styles.tagsWrap}>
							<NIP05Verified nip05={userProfile?.nip05} onPress={handlePress} />
							<Website website={userProfile?.website} onPress={handlePress} />
							<Lud lud16={userProfile?.lud16} lud06={userProfile?.lud06} onPress={handlePress} />
						</View>
					</View>
					<View style={styles.action}>
						<Button
							txt={t('sendEcash')}
							onPress={() => void handleSend()}
						/>
						{!isPayment &&
							<>
								<View style={{ marginVertical: vs(10) }} />
								<Button
									txt={t('useNpub')}
									onPress={() => void handleNpub()}
									outlined
								/>
							</>
						}
						<TxtButton
							txt={t('scanAgain')}
							onPress={() => navigation.goBack()}
						/>
					</View>
				</>
			}
			<LeaveAppModal url={url} visible={visible} closeModal={closeModal} />
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
		paddingTop: '0@vs',
	},
	profilePicContainer: {
		flexDirection: 'row',
		alignItems: 'flex-end',
		justifyContent: 'space-between',
		marginTop: '-35@s',
		paddingHorizontal: '20@s',
	},
	picWrap: {
		width: '70@s',
		height: '70@s',
		borderRadius: 35,
		overflow: 'hidden'
	},
	contentWrap: {
		paddingTop: '10@vs',
		paddingHorizontal: '20@s',
	},
	npub: {
		fontSize: '12@vs',
	},
	tagsWrap: {
		marginTop: '20@vs',
	},
	action: {
		position: 'absolute',
		bottom: isIOS ? '40@vs' : '20@vs',
		right: '20@s',
		left: '20@s'
	},
})