import Button from '@comps/Button'
import { LeftArrow } from '@comps/Icons'
import Txt from '@comps/Txt'
import TxtInput from '@comps/TxtInput'
import { isIOS } from '@consts'
import type { TMemoPageProps } from '@model/nav'
import TopNav from '@nav/TopNav'
import { getNostrUsername, truncateNpub } from '@nostr/util'
import ProfileBanner from '@screens/Addressbook/Contact/Banner'
import ProfilePic from '@screens/Addressbook/ProfilePic'
import { useThemeContext } from '@src/context/Theme'
import { NS } from '@src/i18n'
import { globals, highlight as hi, mainColors } from '@styles'
import { nip19 } from 'nostr-tools'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { KeyboardAvoidingView, Text, TouchableOpacity, View } from 'react-native'
import { s, ScaledSheet, vs } from 'react-native-size-matters'

export default function MemoScreen({ navigation, route }: TMemoPageProps) {

	const { mint, balance, amount, nostr, isSendingWholeMintBal } = route.params
	const { t } = useTranslation([NS.common])
	const { color, highlight } = useThemeContext()
	const [memo, setMemo] = useState('')

	const handlePress = () => {
		// Check if user sends his whole mint balance, so there is no need for coin selection and that can be skipped here
		if (isSendingWholeMintBal) {
			navigation.navigate('processing', {
				mint,
				amount,
				estFee: 0,
				isSendEcash: true,
				memo
			})
			return
		}
		navigation.navigate('coinSelection', {
			mint,
			balance,
			amount,
			estFee: 0,
			isSendEcash: true,
			nostr,
			memo
		})
	}

	return (
		<View style={[
			globals(color).container,
			styles.container,
			{
				paddingTop: nostr ? 0 : vs(100),
				paddingBottom: isIOS ? vs(50) : vs(20),
			}
		]}>
			{!nostr ?
				<>
					<TopNav
						screenName={t('sendEcash')}
						withBackBtn
						handlePress={() => navigation.goBack()}
					/>
					<Txt
						txt={t('addMemo')}
						styles={[styles.hint]}
					/>
				</>
				:
				<View>
					<View style={styles.navWrap}>
						<View style={styles.navTxtWrap}>
							<TouchableOpacity
								onPress={() => navigation.goBack()}
								style={styles.backiconWrap}
							>
								<LeftArrow color={hi[highlight]} />
							</TouchableOpacity>
							<View style={{ marginLeft: s(10) }}>
								<Text style={[globals(color).navTxt, styles.navTxt]}>
									{t('sendEcash')}
								</Text>
							</View>
						</View>
						{/* <MintBalance balance={formatInt(balance)} txtColor={err ? mainColors.ERROR : mainColors.WHITE} /> */}
					</View>
					{/* Contact pictures overview */}
					<ProfileBanner
						hex={nostr?.contact?.hex ?? ''}
						uri={nostr?.contact?.banner}
						isSending
						dimmed
					/>
					<View style={styles.profilePicContainer}>
						<View style={styles.picWrap}>
							<ProfilePic
								hex={nostr?.contact?.hex ?? ''}
								uri={nostr?.contact?.picture}
								size={80}
							/>
						</View>
					</View>
					<Txt
						txt={getNostrUsername(nostr?.contact) ?? truncateNpub(nip19.npubEncode(nostr?.contact?.hex ?? ''))}
						styles={[styles.username]}
					/>
				</View>
			}
			<KeyboardAvoidingView
				behavior={isIOS ? 'padding' : undefined}
				style={{ marginHorizontal: s(20) }}
			>
				<TxtInput
					placeholder={t('optionalMemo')}
					maxLength={21}
					onChangeText={setMemo}
					onSubmitEditing={handlePress}
				/>
				<Button
					txt={t('continue')}
					onPress={handlePress}
				/>
			</KeyboardAvoidingView>
		</View>
	)
}

const styles = ScaledSheet.create({
	container: {
		flexDirection: 'column',
		justifyContent: 'space-between',
	},
	hint: {
		fontWeight: '500',
		marginHorizontal: '20@s',
	},
	backiconWrap: {
		paddingRight: '10@s',
		paddingLeft: '20@s',
		paddingVertical: '10@vs',
	},
	navTxtWrap: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	navTxt: {
		color: mainColors.WHITE,
	},
	navWrap: {
		position: 'absolute',
		top: 0,
		right: 0,
		left: 0,
		// backgroundColor: 'rgba(0, 0, 0, .7)',
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		height: '100@vs',
		paddingRight: '20@s',
		paddingTop: '40@vs',
		zIndex: 1,
	},
	profilePicContainer: {
		flexDirection: 'row',
		alignItems: 'flex-end',
		justifyContent: 'space-between',
		marginTop: '-40@vs',
		paddingHorizontal: '20@s',
	},
	picWrap: {
		width: '80@s',
		height: '80@s',
		borderRadius: '40@s',
		overflow: 'hidden',
		marginBottom: '10@vs'
	},
	username: {
		fontSize: '17@vs',
		fontWeight: '500',
		marginHorizontal: '20@s',
	},
})