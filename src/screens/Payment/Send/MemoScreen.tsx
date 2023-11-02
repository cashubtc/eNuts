import Button from '@comps/Button'
import { LeftArrow } from '@comps/Icons'
import Txt from '@comps/Txt'
import TxtInput from '@comps/TxtInput'
import { isIOS } from '@consts'
import type { TMemoPageProps } from '@model/nav'
import TopNav from '@nav/TopNav'
import ProfileBanner from '@screens/Addressbook/Contact/Banner'
import ProfilePic from '@screens/Addressbook/ProfilePic'
import { useThemeContext } from '@src/context/Theme'
import { NS } from '@src/i18n'
import { globals, highlight as hi, mainColors } from '@styles'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { KeyboardAvoidingView, StyleSheet, Text   , TouchableOpacity, View } from 'react-native'

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
				paddingTop: nostr ? 0 : 110,
				paddingBottom: isIOS ? 50 : 20,
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
							<View style={{ marginLeft: 10 }}>
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
						dimmed
					/>
					<View style={styles.profilePicContainer}>
						<View style={styles.picWrap}>
							<ProfilePic
								hex={nostr?.contact?.hex ?? ''}
								uri={nostr?.contact?.picture}
								size={100}
								recyclingKey={nostr?.contact?.hex ?? ''}
							/>
						</View>
					</View>
				</View>
			}
			<KeyboardAvoidingView
				behavior={isIOS ? 'padding' : undefined}
				style={{ marginHorizontal: 20 }}
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

const styles = StyleSheet.create({
	container: {
		flexDirection: 'column',
		justifyContent: 'space-between',
	},
	hint: {
		fontWeight: '500',
		marginHorizontal: 20,
	},
	backiconWrap: {
		paddingRight: 10,
		paddingLeft: 20,
		paddingVertical: 10,
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
		height: 100,
		paddingRight: 20,
		paddingTop: 40,
		zIndex: 1,
	},
	profilePicContainer: {
		flexDirection: 'row',
		alignItems: 'flex-end',
		justifyContent: 'space-between',
		marginTop: -50,
		paddingHorizontal: 20,
	},
	picWrap: {
		width: 100,
		height: 100,
		borderRadius: 50,
		overflow: 'hidden',
	},
})