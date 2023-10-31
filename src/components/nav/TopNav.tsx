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
	nostrProfile?: string
	showSearch?: boolean
	toggleSearch?: () => void
	cancel?: boolean
	handlePress?: () => void
	openProfile?: () => void
	txt?: string
	mintBalance?: string
	loading?: boolean
	noIcons?: boolean,
	historyOpts?: IPopupOptionProps[]
}

export default function TopNav({
	screenName,
	withBackBtn,
	nostrProfile,
	showSearch,
	toggleSearch,
	cancel,
	handlePress,
	openProfile,
	txt,
	mintBalance,
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
				{withBackBtn && !cancel && !txt?.length &&
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
				{mintBalance ?
					<MintBalance balance={mintBalance} txtColor={color.TEXT} />
					:
					<TouchableOpacity style={styles.right} onPress={() => {
						if (nostrProfile) { return openProfile?.() }
						handlePress?.()
					}}>
						{(cancel || txt?.length) ?
							<Text style={globals(color, highlight).pressTxt}>
								{txt || t('cancel')}
							</Text>
							:
							!withBackBtn &&
							!nostrProfile &&
							!loading &&
							!noIcons &&
							<ScanQRIcon color={color.TEXT} />
						}
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
							null
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
})