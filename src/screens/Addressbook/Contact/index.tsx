import Button, { TxtButton } from '@comps/Button'
import Copy from '@comps/Copy'
import { LeftArrow, PenIcon, QRIcon, TrashbinIcon } from '@comps/Icons'
import LeaveAppModal from '@comps/LeaveAppModal'
import MyModal from '@comps/modal'
import { BottomModal } from '@comps/modal/Question'
import Txt from '@comps/Txt'
import TxtInput from '@comps/TxtInput'
import { getMintsBalances } from '@db'
import type { IContactPageProps } from '@model/nav'
import { getNostrUsername, isHex, isNpub, npubEncode, truncateNpub } from '@nostr/util'
import { useNostrContext } from '@src/context/Nostr'
import { usePromptContext } from '@src/context/Prompt'
import { useThemeContext } from '@src/context/Theme'
import { NS } from '@src/i18n'
import { getCustomMintNames } from '@store/mintStore'
import { globals, highlight as hi, mainColors } from '@styles'
import { isStr } from '@util'
import { nip19 } from 'nostr-tools'
import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { s, ScaledSheet, vs } from 'react-native-size-matters'

import ProfilePic from '../ProfilePic'
import Username from '../Username'
import ProfileBanner from './Banner'
import Lud from './Lud'
import NIP05Verified from './NIP05'
import Website from './Website'

export default function ContactPage({ navigation, route }: IContactPageProps) {
	const { contact, isUser, userProfile } = route.params
	const { t } = useTranslation([NS.addrBook])
	const { nostr, replaceNpub, resetNostrData } = useNostrContext()
	const { color, highlight } = useThemeContext()
	const [visible, setVisible] = useState(false)
	const closeModal = useCallback(() => setVisible(false), [])
	const [newNpub, setNewNpub] = useState('')
	const [sheet, setSheet] = useState({ edit: false, delete: false })
	const openEditSheet = useCallback(() => setSheet(prev => ({ ...prev, edit: true })), [])
	const openDeleteSheet = useCallback(() => setSheet(prev => ({ ...prev, delete: true })), [])
	const closeSheet = useCallback(() => setSheet({ edit: false, delete: false }), [])
	const [url, setUrl] = useState('')
	const { openPromptAutoClose } = usePromptContext()

	// link press
	const handlePress = (url: string) => {
		if (url === 'lightning://') {
			 
			openPromptAutoClose({ msg: `⚠️\n\n${t('zapSoon', { ns: NS.common })}\n\n⚡👀` })
			return
		}
		setVisible(true)
		setUrl(url)
	}

	// start sending ecash via nostr
	const handleSend = async () => {
		const mintsWithBal = await getMintsBalances()
		const mints = await getCustomMintNames(mintsWithBal.map(m => ({ mintUrl: m.mintUrl })))
		const nonEmptyMints = mintsWithBal.filter(m => m.amount > 0)
		const nostr = {
			senderName: getNostrUsername(userProfile),
			contact,
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

	// delete npub
	const deleteNpub = async () => {
		await resetNostrData()
		closeSheet()
		navigation.navigate('dashboard')
	}

	const editNpub = async () => {
		if (!isNpub(newNpub) && !isHex(newNpub)) {
			return openPromptAutoClose({ msg: t('invalidPubKey', { ns: NS.common }) })
		}
		try {
			const hex = isHex(newNpub) ? newNpub : nip19.decode(newNpub)?.data
			if (!isStr(hex)) {
				return openPromptAutoClose({ msg: t('invalidPubKey', { ns: NS.common }) })
			}
			await replaceNpub(hex)
			closeSheet()
			navigation.navigate('scan success', { hex, edited: true })
		} catch {
			return openPromptAutoClose({ msg: t('invalidPubKey', { ns: NS.common }) })
		}
	}

	return (
		<View style={[globals(color).container, styles.container]}>
			<TouchableOpacity
				style={styles.backBtn}
				onPress={() => navigation.goBack()}
			>
				<LeftArrow color={hi[highlight]} />
			</TouchableOpacity>
			{/* Contact pictures overview */}
			<ProfileBanner hex={contact?.hex} uri={contact?.banner} />
			<View style={styles.profilePicContainer}>
				<View style={styles.picWrap}>
					<ProfilePic
						hex={contact?.hex}
						uri={contact?.picture}
						size={s(70)}
						isUser={isUser}
					/>
				</View>
				{isUser &&
					<View style={styles.smallBtnWrap}>
						<SmallBtn onPress={openEditSheet}>
							<PenIcon color={mainColors.WHITE} />
						</SmallBtn>
						<View style={{ marginHorizontal: s(5) }} />
						<SmallBtn onPress={openDeleteSheet}>
							<TrashbinIcon color={mainColors.WHITE} />
						</SmallBtn>
					</View>
				}
			</View>
			<View style={styles.contentWrap}>
				{/* username */}
				<Username contact={contact} fontSize={vs(22)} />
				{/* npub */}
				<View style={styles.npubWrap}>
					<Txt
						txt={`${isUser ? t('enutsPub', { ns: NS.common }) : ''}${truncateNpub(isUser ? nostr.pubKey.encoded : npubEncode(contact?.hex ?? ''))}`}
						styles={[styles.npub, { color: color.TEXT_SECONDARY }]}
					/>
					{contact && contact.hex.length > 0 &&
						<Copy txt={isUser ? nostr.pubKey.encoded : npubEncode(contact.hex)} />
					}
				</View>
				{/* tags */}
				<View style={styles.tagsWrap}>
					<NIP05Verified nip05={contact?.nip05} onPress={handlePress} />
					<Website website={contact?.website} onPress={handlePress} />
					<Lud lud16={contact?.lud16} lud06={contact?.lud06} onPress={handlePress} />
				</View>
				{/* about */}
				<ScrollView alwaysBounceVertical={false}>
					{contact?.about && contact.about.length > 0 &&
						<Txt txt={contact.about} styles={[styles.about]} />
					}
				</ScrollView>
			</View>
			{!isUser &&
				<View style={styles.sendBtn}>
					<Button
						txt={t('sendEcash', { ns: NS.common })}
						onPress={() => void handleSend()}
					/>
				</View>
			}
			<LeaveAppModal url={url} visible={visible} closeModal={closeModal} />
			<BottomModal
				visible={sheet.delete}
				header={t('deleteNpub', { ns: NS.common })}
				txt={t('delNpubHint', { ns: NS.common })}
				confirmTxt={t('yes', { ns: NS.common })}
				confirmFn={() => void deleteNpub()}
				cancelTxt={t('cancel', { ns: NS.common })}
				cancelFn={closeSheet}
			/>
			<MyModal type='bottom' animation='slide' visible={sheet.edit} close={closeSheet}>
				<Text style={globals(color).modalHeader}>
					{t('addNewNpub', { ns: NS.common })}
				</Text>
				<Text style={[globals(color).modalTxt, styles.newNpubHintTxt]}>
					{t('addNpubHint', { ns: NS.common })}
				</Text>
				<View style={styles.wrap}>
					<TxtInput
						keyboardType='default'
						autoCapitalize='none'
						placeholder='NPUB/HEX'
						onChangeText={text => setNewNpub(text)}
						value={newNpub}
						onSubmitEditing={() => void editNpub()}
						style={[{ paddingRight: s(55) }]}
					/>
					{/* scan icon */}
					<TouchableOpacity
						style={styles.inputQR}
						onPress={() => {
							closeSheet()
							const t = setTimeout(() => {
								navigation.navigate('qr scan', {})
								clearTimeout(t)
							}, 200)
						}}
					>
						<QRIcon color={hi[highlight]} />
					</TouchableOpacity>
				</View>
				<Button
					txt={t('submit', { ns: NS.common })}
					onPress={() => void editNpub()}
				/>
				<TxtButton
					txt={t('cancel', { ns: NS.common })}
					onPress={() => closeSheet()}
				/>
			</MyModal>
		</View >
	)
}

interface ISmallBtnProps {
	children: React.ReactNode
	onPress: () => void
}

function SmallBtn({ children, onPress }: ISmallBtnProps) {
	const { highlight } = useThemeContext()
	return (
		<TouchableOpacity
			style={[styles.sendEcash, { backgroundColor: hi[highlight] }]}
			onPress={onPress}
		>
			{children}
		</TouchableOpacity>
	)
}

const styles = ScaledSheet.create({
	container: {
		paddingTop: 0
	},
	backBtn: {
		backgroundColor: 'rgba(0, 0, 0, .4)',
		position: 'absolute',
		top: '50@vs',
		left: '20@s',
		zIndex: 1,
		width: '40@s',
		height: '40@s',
		borderRadius: '20@s',
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center'
	},
	smallBtnWrap: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	wrap: {
		position: 'relative',
		width: '100%',
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
	},
	inputQR: {
		position: 'absolute',
		right: '13@s',
		height: '41@vs',
		paddingHorizontal: '10@s',
	},
	picWrap: {
		width: '70@s',
		height: '70@s',
		borderRadius: 35,
		overflow: 'hidden'
	},
	profilePicContainer: {
		flexDirection: 'row',
		alignItems: 'flex-end',
		justifyContent: 'space-between',
		marginTop: '-35@s',
		paddingHorizontal: '20@s',
	},
	sendEcash: {
		paddingHorizontal: '10@s',
		paddingVertical: '5@vs',
		borderRadius: 50,
		marginBottom: '-5@vs',
	},
	sendTxt: {
		color: mainColors.WHITE,
	},
	contentWrap: {
		paddingTop: '10@vs',
		paddingHorizontal: '20@s',
	},
	npubWrap: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	npub: {
		fontSize: '12@vs',
	},
	tagsWrap: {
		marginTop: '20@vs',
	},
	about: {
		marginTop: '20@vs',
	},
	newNpubHintTxt: {
		color: mainColors.WARN
	},
	sendBtn: {
		position: 'absolute',
		bottom: '20@vs',
		left: '20@s',
		right: '20@s',
	}
})