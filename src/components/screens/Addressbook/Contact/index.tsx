import { CopyIcon } from '@comps/Icons'
import Txt from '@comps/Txt'
import { getMintsBalances } from '@db'
import type { IContactPageProps } from '@model/nav'
import TopNav from '@nav/TopNav'
import { getNostrUsername, truncateNpub } from '@nostr/util'
import { ThemeContext } from '@src/context/Theme'
import { store } from '@store'
import { STORE_KEYS } from '@store/consts'
import { getCustomMintNames } from '@store/mintStore'
import { globals, highlight as hi } from '@styles'
import { nip19 } from 'nostr-tools'
import { useContext, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, TouchableOpacity, View } from 'react-native'

import ProfilePic from '../ProfilePic'
import Username from '../Username'
import ProfileBanner from './Banner'
import Lud from './Lud'
import NIP05Verified from './NIP05'
import Website from './Website'

export default function ContactPage({ navigation, route }: IContactPageProps) {
	const { contact, npub, isUser, userProfile } = route.params
	const { t } = useTranslation(['addrBook'])
	const { color, highlight } = useContext(ThemeContext)
	const [nutPub, setNutPub] = useState('')

	// start sending ecash via nostr
	const handleSend = async () => {
		const mintsWithBal = await getMintsBalances()
		const mints = await getCustomMintNames(mintsWithBal.map(m => ({ mintUrl: m.mintUrl })))
		const nonEmptyMints = mintsWithBal.filter(m => m.amount > 0)
		const nostr = {
			senderName: getNostrUsername(userProfile),
			receiverNpub: npub,
			receiverName: getNostrUsername(contact),
		}
		// TODO this could potentially written in shorter form
		if (nonEmptyMints.length === 1) {
			navigation.navigate('selectAmount', {
				mint: mints.find(m => m.mintUrl === nonEmptyMints[0].mintUrl) || { mintUrl: 'N/A', customName: 'N/A' },
				isSendEcash: true,
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

	const copyNpub = () => {
		//
	}

	useEffect(() => {
		void (async () => {
			const enutsPubKey = await store.get(STORE_KEYS.nutpub)
			setNutPub(nip19.npubEncode(enutsPubKey || ''))
		})()
	}, [])

	return (
		<View style={[globals(color).container, styles.container]}>
			<TopNav
				withBackBtn
				screenName={isUser ? t('yourProfile') : getNostrUsername(contact)}
				handlePress={() => navigation.goBack()}
			/>
			{/* Contact pictures overview */}
			<View style={{ zIndex: 5 }}>
				<ProfileBanner uri={contact?.banner} isUser={isUser} />
				<View style={styles.profilePicContainer}>
					<ProfilePic uri={contact?.picture} size={100} isUser={isUser} />
					{!isUser &&
						<TouchableOpacity
							style={[styles.sendEcash, { backgroundColor: hi[highlight] }]}
							onPress={() => void handleSend()}
						>
							<Txt txt='Send Ecash' styles={[{ fontWeight: '500', color: '#FAFAFA' }]} />
						</TouchableOpacity>
					}
				</View>
				<View style={styles.contentWrap}>
					{/* username */}
					<Username
						displayName={contact?.displayName}
						display_name={contact?.display_name}
						username={contact?.username}
						name={contact?.name}
						npub={npub}
						fontSize={24}
					/>
					{/* npubs */}
					<View style={styles.npubWrap}>
						<Txt txt={`${isUser ? 'nostr: ' : ''}${truncateNpub(npub)}`} styles={[styles.npub, { color: color.TEXT_SECONDARY }]} />
						<TouchableOpacity style={styles.copyIconWrap} onPress={copyNpub}>
							<CopyIcon width={18} height={18} color={color.TEXT_SECONDARY} />
						</TouchableOpacity>
					</View>
					{isUser &&
						<View style={styles.npubWrap}>
							<Txt txt={`eNuts: ${truncateNpub(nutPub)}`} styles={[styles.npub, { color: color.TEXT_SECONDARY }]} />
							<TouchableOpacity style={styles.copyIconWrap}>
								<CopyIcon width={18} height={18} color={color.TEXT_SECONDARY} />
							</TouchableOpacity>
						</View>
					}
					{/* tags */}
					<View style={styles.tagsWrap}>
						<NIP05Verified nip05={contact?.nip05} />
						<Website website={contact?.website} />
						<Lud lud16={contact?.lud16} lud06={contact?.lud06} />
					</View>
					{/* about */}
					{contact?.about && contact.about.length > 0 &&
						<Txt txt={contact.about} styles={[styles.about]} />
					}
				</View>
			</View>
		</View >
	)
}

const styles = StyleSheet.create({
	container: {
		paddingTop: 100
	},
	profilePicContainer: {
		flexDirection: 'row',
		alignItems: 'flex-end',
		justifyContent: 'space-between',
		marginTop: -50,
		paddingHorizontal: 20,
	},
	sendEcash: {
		paddingHorizontal: 10,
		paddingVertical: 5,
		borderRadius: 50,
		marginBottom: 5,
	},
	contentWrap: {
		paddingTop: 10,
		paddingHorizontal: 20,
	},
	npubWrap: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	npub: {
		fontSize: 14,
	},
	copyIconWrap: {
		paddingHorizontal: 10,
		paddingVertical: 5,
	},
	tagsWrap: {
		marginTop: 20,
	},
	about: {
		marginTop: 20,
	},
})