import type { GetInfoResponse } from '@cashu/cashu-ts'
import Empty from '@comps/Empty'
import useLoading from '@comps/hooks/Loading'
import { ExclamationIcon, MintBoardIcon } from '@comps/Icons'
import Loading from '@comps/Loading'
import Screen from '@comps/Screen'
import Separator from '@comps/Separator'
import Txt from '@comps/Txt'
import { isIOS } from '@consts'
import type { TMintInfoPageProps } from '@model/nav'
import { useThemeContext } from '@src/context/Theme'
import { NS } from '@src/i18n'
import { globals, highlight as hi, mainColors } from '@styles'
import { getMintInfo } from '@wallet'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default function MintInfoPage({ navigation, route }: TMintInfoPageProps) {
	const { t } = useTranslation([NS.common])
	const { color, highlight } = useThemeContext()
	const insets = useSafeAreaInsets()
	const [info, setInfo] = useState<GetInfoResponse>()
	const { loading, startLoading, stopLoading } = useLoading()

	useEffect(() => {
		void (async () => {
			startLoading()
			try {
				const mintInfo = await getMintInfo(route.params.mintUrl)
				setInfo(mintInfo)
			} catch (e) {
				// ignore mint info not available
			}
			stopLoading()
		})()
		return () => setInfo(undefined)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [route.params.mintUrl])

	return (
		<Screen
			withBackBtn
			handlePress={() => navigation.goBack()}
		>
			{info ?
				<ScrollView style={{ marginBottom: isIOS ? insets.bottom : 0 }}>
					{/* Name, Version & short description */}
					<View style={[globals(color).wrapContainer, styles.mainInfo]}>
						<View style={[styles.circleContainer, { backgroundColor: color.INPUT_BG, borderColor: color.BORDER }]}>
							<Text style={[styles.mintIcon, { color: color.TEXT }]}>
								<MintBoardIcon width={30} height={28} color={hi[highlight]} />
							</Text>
						</View>
						<Txt
							txt={info.name}
							bold
							styles={[styles.mintName]}
						/>
						<Txt
							txt={`${t('version')}: ${info.version}`}
							bold
							styles={[styles.mintVersion]}
						/>
						{info.description && info.description.length > 0 &&
							<Txt
								txt={info.description}
								bold
								styles={[styles.mintVersion]}
							/>
						}
					</View>
					{/* Message of the day - important announcements */}
					{!!info.motd &&
						<View style={[globals(color).wrapContainer, styles.infoEntry]}>
							<View style={styles.motd}>
								<View>
									<Txt
										txt={t('importantNotice', { ns: NS.mints })}
										bold
										styles={[styles.description]}
									/>
									<Txt txt={info.motd} />
								</View>
								<ExclamationIcon color={mainColors.ERROR} />
							</View>
						</View>
					}
					{/* Contact, Supported NUTs, Public Key */}
					<View style={[globals(color).wrapContainer, styles.infoEntry]}>
						<Txt
							txt={t('contact', { count: 1 })}
							bold
							styles={[styles.description]}
						/>
						{info.contact?.map((c, i) => (
							<View key={i} style={styles.contactWrap}>
								{c[0].length > 0 && c[1].length > 0 ?
									<>
										<Txt txt={c[0]} />
										<Txt txt={c[1]} />
									</>
									:
									<Txt txt={t('mintNoContact', { ns: NS.mints })} />
								}
							</View>
						))}
						<Separator style={[{ marginVertical: 20 }]} />
						<Txt
							txt={t('supportedNuts', { ns: NS.mints })}
							bold
							styles={[styles.description]}
						/>
						{info.nuts?.map((n, i) => <Txt key={i} txt={n} />)}
						<Separator style={[{ marginVertical: 20 }]} />
						<Txt
							txt={t('pubKey', { ns: NS.mints })}
							bold
							styles={[styles.description]}
						/>
						<Txt txt={info.pubkey} />
					</View>
					{/* Long description */}
					<View style={[globals(color).wrapContainer, styles.infoEntry]}>
						<Txt
							txt={t('additionalInfo', { ns: NS.mints })}
							bold
							styles={[styles.description]}
						/>
						<Txt txt={info.description_long || t('noAdditional', { ns: NS.mints })} />
					</View>
				</ScrollView>
				:
				loading ?
					<Loading />
					:
					<Empty txt={t('noInfo', { ns: NS.mints }) + '...'} />
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
	},
	mintVersion: {
		marginVertical: 10,
	},
	infoEntry: {
		paddingBottom: 20,
	},
	description: {
		fontSize: 14,
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