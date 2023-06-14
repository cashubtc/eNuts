import type { GetInfoResponse } from '@cashu/cashu-ts'
import { ExclamationIcon, MintBoardIcon } from '@comps/Icons'
import Separator from '@comps/Separator'
import Txt from '@comps/Txt'
import { l } from '@log'
import type { TMintInfoPageProps } from '@model/nav'
import TopNav from '@nav/TopNav'
import { ThemeContext } from '@src/context/Theme'
import { highlight as hi } from '@styles'
import { getMintInfo } from '@wallet'
import { useContext, useEffect, useState } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'

export default function MintInfoPage({ route }: TMintInfoPageProps) {

	const { color, highlight } = useContext(ThemeContext)
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
		<View style={[styles.container, { backgroundColor: color.BACKGROUND }]}>
			<TopNav withBackBtn />
			{info ?
				<ScrollView>
					{/* Name, Version & short description */}
					<View style={[styles.mainInfo, { backgroundColor: color.INPUT_BG, borderColor: color.BORDER }]}>
						<Text style={[styles.mintIcon, { backgroundColor: color.INPUT_BG, borderColor: color.BORDER, color: color.TEXT }]}>
							<MintBoardIcon width={30} height={28} color={hi[highlight]} />
						</Text>
						<Text style={[styles.mintName, { color: color.TEXT }]}>
							{info.name}
						</Text>
						<Text style={[styles.mintVersion, { color: color.TEXT, }]}>
							Version: {info.version}
						</Text>
						{info.description?.length > 0 &&
							<Text style={[styles.mintVersion, { color: color.TEXT, }]}>
								{info.description}
							</Text>
						}
					</View>
					{/* Message of the day - important announcements */}
					{!!info.motd &&
						<View style={[styles.infoEntry, { backgroundColor: color.INPUT_BG, borderColor: color.BORDER }]}>
							<View style={styles.motd}>
								<View>
									<Text style={[styles.description, { color: color.TEXT }]}>
										Important notice
									</Text>
									<Txt txt={info.motd} />
								</View>
								<ExclamationIcon color={color.ERROR} />
							</View>
						</View>
					}
					{/* Contact, Supported NUTs, Public Key */}
					<View style={[styles.infoEntry, { backgroundColor: color.INPUT_BG, borderColor: color.BORDER }]}>
						<Text style={[styles.description, { color: color.TEXT }]}>
							Contact
						</Text>
						{info.contact.map((c, i) => (
							<View key={i} style={styles.contactWrap}>
								{c[0].length > 0 && c[1].length > 0 ?
									<>
										<Txt txt={c[0]} />
										<Txt txt={c[1]} />
									</>
									:
									<Txt txt='The mint has no contact info' />
								}
							</View>
						))}
						<Separator style={[{ marginVertical: 20 }]} />
						<Text style={[styles.description, { color: color.TEXT }]}>
							Supported NUTs
						</Text>
						{info.nuts.map((n, i) => <Txt key={i} txt={n} />)}
						<Separator style={[{ marginVertical: 20 }]} />
						<Text style={[styles.description, { color: color.TEXT }]}>
							Public key
						</Text>
						<Txt txt={info.pubkey} />
					</View>
					{/* Long description */}
					<View style={[styles.infoEntry, { backgroundColor: color.INPUT_BG, borderColor: color.BORDER }]}>
						<Text style={[styles.description, { color: color.TEXT }]}>
							Additional information
						</Text>
						<Txt txt={info.description_long || 'This mint has no additional info'} />
					</View>
				</ScrollView>
				:
				<View style={styles.errorWrap}>
					<Text style={[styles.errorMsg, { color: color.TEXT }]}>
						Found no info...
					</Text>
				</View>
			}
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		paddingTop: 100
	},
	mainInfo: {
		borderWidth: 1,
		borderRadius: 20,
		padding: 20,
		alignItems: 'center',
		marginTop: 50,
		marginBottom: 20,
	},
	mintIcon: {
		borderRadius: 50,
		borderWidth: 1,
		paddingVertical: 35,
		paddingHorizontal: 35,
		fontSize: 36,
		fontWeight: '300',
		marginTop: -70,
		marginBottom: 15,
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
		borderWidth: 1,
		borderRadius: 20,
		paddingHorizontal: 20,
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
	errorWrap: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	errorMsg: {
		fontSize: 18,
		fontWeight: '500',
	}
})