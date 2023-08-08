import type { GetInfoResponse } from '@cashu/cashu-ts'
import Empty from '@comps/Empty'
import { ExclamationIcon, MintBoardIcon } from '@comps/Icons'
import Screen from '@comps/Screen'
import Separator from '@comps/Separator'
import Txt from '@comps/Txt'
import { l } from '@log'
import type { TMintInfoPageProps } from '@model/nav'
import { useThemeContext } from '@src/context/Theme'
import { globals, highlight as hi, mainColors } from '@styles'
import { getMintInfo } from '@wallet'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default function MintInfoPage({ navigation, route }: TMintInfoPageProps) {
	const { t } = useTranslation(['common'])
	const { color, highlight } = useThemeContext()
	const insets = useSafeAreaInsets()
	const [info, setInfo] = useState<GetInfoResponse>()

	useEffect(() => {
		void (async () => {
			try {
				const mintInfo = await getMintInfo(route.params.mintUrl)
				setInfo(mintInfo)
				l({ mintInfo })
			} catch (e) {
				l(e)
				// mint info not available
			}
		})()
		return () => setInfo(undefined)
	}, [route.params.mintUrl])

	return (
		<Screen
			withBackBtn
			handlePress={() => navigation.goBack()}
		>
			{info ?
				<ScrollView style={{ marginBottom: insets.bottom }}>
					{/* Name, Version & short description */}
					<View style={[globals(color).wrapContainer, styles.mainInfo]}>
						<View style={[styles.circleContainer, { backgroundColor: color.INPUT_BG, borderColor: color.BORDER }]}>
							<Text style={[styles.mintIcon, { color: color.TEXT }]}>
								<MintBoardIcon width={30} height={28} color={hi[highlight]} />
							</Text>
						</View>
						<Text style={[styles.mintName, { color: color.TEXT }]}>
							{info.name}
						</Text>
						<Text style={[styles.mintVersion, { color: color.TEXT, }]}>
							{t('version')}: {info.version}
						</Text>
						{info.description && info.description.length > 0 &&
							<Text style={[styles.mintVersion, { color: color.TEXT, }]}>
								{info.description}
							</Text>
						}
					</View>
					{/* Message of the day - important announcements */}
					{!!info.motd &&
						<View style={[globals(color).wrapContainer, styles.infoEntry]}>
							<View style={styles.motd}>
								<View>
									<Text style={[styles.description, { color: color.TEXT }]}>
										{t('importantNotice', { ns: 'mints' })}
									</Text>
									<Txt txt={info.motd} />
								</View>
								<ExclamationIcon color={mainColors.ERROR} />
							</View>
						</View>
					}
					{/* Contact, Supported NUTs, Public Key */}
					<View style={[globals(color).wrapContainer, styles.infoEntry]}>
						<Text style={[styles.description, { color: color.TEXT }]}>
							{t('contact', { count: 1 })}
						</Text>
						{info.contact.map((c, i) => (
							<View key={i} style={styles.contactWrap}>
								{c[0].length > 0 && c[1].length > 0 ?
									<>
										<Txt txt={c[0]} />
										<Txt txt={c[1]} />
									</>
									:
									<Txt txt={t('mintNoContact', { ns: 'mints' })} />
								}
							</View>
						))}
						<Separator style={[{ marginVertical: 20 }]} />
						<Text style={[styles.description, { color: color.TEXT }]}>
							{t('supportedNuts', { ns: 'mints' })}
						</Text>
						{info.nuts.map((n, i) => <Txt key={i} txt={n} />)}
						<Separator style={[{ marginVertical: 20 }]} />
						<Text style={[styles.description, { color: color.TEXT }]}>
							{t('pubKey', { ns: 'mints' })}
						</Text>
						<Txt txt={info.pubkey} />
					</View>
					{/* Long description */}
					<View style={[globals(color).wrapContainer, styles.infoEntry]}>
						<Text style={[styles.description, { color: color.TEXT }]}>
							{t('additionalInfo', { ns: 'mints' })}
						</Text>
						<Txt txt={info.description_long || t('noAdditional', { ns: 'mints' })} />
					</View>
				</ScrollView>
				:
				<Empty txt={t('noInfo', { ns: 'mints' }) + '...'} />
			}
		</Screen>
	)
}

const styles = StyleSheet.create({
	mainInfo: {
		padding: 20,
		alignItems: 'center',
		marginTop: 50,
		marginBottom: 20,
	},
	circleContainer: {
		width: 90,
		height: 90,
		borderWidth: 1,
		borderRadius: 45,
		marginTop: -70,
		marginBottom: 15,
		justifyContent: 'center',
		alignItems: 'center'
	},
	mintIcon: {
		fontSize: 36,
		fontWeight: '300',
	},
	mintName: {
		fontSize: 26,
		fontWeight: '500'
	},
	mintVersion: {
		fontSize: 16,
		marginVertical: 10,
	},
	infoEntry: {
		paddingVertical: 20,
		marginBottom: 20,
	},
	description: {
		fontSize: 14,
		fontWeight: '500',
		marginBottom: 5,
	},
	contactWrap: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	motd: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
})