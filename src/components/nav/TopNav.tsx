import { LeftArrow, ScanQRIcon, SearchIcon } from '@comps/Icons'
import Loading from '@comps/Loading'
import MintBalance from '@comps/MintBalance'
import type { IPopupOptionProps } from '@comps/Popup'
import Popup from '@comps/Popup'
import ProfilePic from '@screens/Addressbook/ProfilePic'
import { useNostrContext } from '@src/context/Nostr'
import { useThemeContext } from '@src/context/Theme'
import { NS } from '@src/i18n'
import { globals, highlight as hi } from '@styles'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

interface TTopNavProps {
	screenName?: string
	withBackBtn?: boolean
	handlePress?: () => void
	nostrProfile?: string
	showSearch?: boolean
	toggleSearch?: () => void
	cancel?: boolean
	handleCancel?: () => void
	openProfile?: () => void
	handleMintBalancePress?: () => void
	disableMintBalance?: boolean
	txt?: string
	mintBalance?: string
	loading?: boolean
	noIcons?: boolean,
	historyOpts?: IPopupOptionProps[]
}

export default function TopNav({
	screenName,
	withBackBtn,
	handlePress,
	nostrProfile,
	showSearch,
	toggleSearch,
	cancel,
	handleCancel,
	openProfile,
	txt,
	mintBalance,
	handleMintBalancePress,
	disableMintBalance,
	loading,
	noIcons,
	historyOpts
}: TTopNavProps) {
	const { t } = useTranslation([NS.common])
	const { color, highlight } = useThemeContext()
	const { pubKey } = useNostrContext()
	return (
		<View style={[styles.topNav, { backgroundColor: color.BACKGROUND }]}>
			{/* Placeholder */}
			{!screenName && !withBackBtn && <View />}
			<View style={styles.wrap}>
				{withBackBtn && !txt?.length &&
					<TouchableOpacity
						onPress={handlePress}
						style={styles.backiconWrap}
					>
						<LeftArrow color={hi[highlight]} />
					</TouchableOpacity>
				}
				{screenName &&
					<Text style={globals(color).navTxt}>
						{screenName}
					</Text>
				}
			</View>
			<View style={{ flexDirection: 'row', alignItems: 'center' }}>
				{showSearch &&
					<TouchableOpacity
						onPress={() => toggleSearch?.()}
						style={{ padding: 5 }}
					>
						<SearchIcon color={color.TEXT} />
					</TouchableOpacity>
				}
				{(cancel || (txt && txt.length > 0)) &&
					<TouchableOpacity style={[styles.right, styles.cancel]} onPress={() => {
						if (txt?.length) { return handlePress?.() }
						handleCancel?.()
					}}>
						<Text style={globals(color, highlight).pressTxt}>
							{txt || t('cancel')}
						</Text>
					</TouchableOpacity>
				}
				{mintBalance ?
					<TouchableOpacity
						style={styles.right}
						onPress={handleMintBalancePress}
						disabled={disableMintBalance}
					>
						<MintBalance
							balance={mintBalance}
							txtColor={disableMintBalance ? color.TEXT_SECONDARY : color.TEXT}
							disabled={disableMintBalance}
						/>
					</TouchableOpacity>
					:
					<TouchableOpacity style={styles.right} onPress={() => {
						if (nostrProfile) { return openProfile?.() }
						handlePress?.()
					}}>
						{nostrProfile ?
							loading ?
								<Loading size={22} />
								:
								<ProfilePic
									hex={pubKey.hex}
									uri={nostrProfile}
									size={30}
									overlayColor={color.INPUT_BG}
									recyclingKey={pubKey.hex}
									isUser
								/>
							:
							!withBackBtn &&
							!nostrProfile &&
							!loading &&
							!noIcons &&
							<ScanQRIcon color={color.TEXT} />
						}
						{historyOpts && historyOpts.length > 0 &&
							<Popup opts={historyOpts} optsWidth={250} />
						}
					</TouchableOpacity>
				}
			</View>
		</View>
	)
}

const styles = StyleSheet.create({
	topNav: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingTop: 60,
		paddingHorizontal: 20,
		paddingBottom: 10,
	},
	wrap: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	backiconWrap: {
		marginLeft: -20,
		paddingLeft: 20,
		paddingRight: 20,
	},
	right: {
		paddingLeft: 20,
	},
	cancel: {
		marginRight: -20
	}
})