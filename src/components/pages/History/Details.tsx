import { getDecodedToken } from '@cashu/cashu-ts'
import { CheckmarkIcon, CopyIcon } from '@comps/Icons'
import type { THistoryEntryPageProps } from '@model/nav'
import TopNav from '@nav/TopNav'
import { ThemeContext } from '@src/context/Theme'
import { mainColors } from '@styles/colors'
import { globals } from '@styles/globals'
import { formatInt, formatMintUrl, getLnInvoiceInfo } from '@util'
import * as Clipboard from 'expo-clipboard'
import { useContext, useState } from 'react'
import { StyleSheet,Text, View } from 'react-native'
import { TouchableOpacity } from 'react-native-gesture-handler'

const initialCopyState = {
	value: false,
	hash: false,
	preimage: false
}

export default function DetailsPage({ route }: THistoryEntryPageProps) {
	const { color, highlight } = useContext(ThemeContext)
	const [copy, setCopy] = useState(initialCopyState)
	const entry = route.params.entry
	const isPayment = entry.amount < 0
	const isLn = entry.type === 2
	const LNstr = `Lightning ${isPayment ? 'payment' : 'invoice'}`
	const eCash = 'eCash payment'
	const { hash, memo } = isLn ? getLnInvoiceInfo(entry.value) : { hash: '', memo: '' }
	const tokenMemo = !isLn ? getDecodedToken(entry.value).memo : 'No Memo'
	const copyValue = async () => {
		await Clipboard.setStringAsync(entry.value)
		setCopy({ ...copy, value: true })
		handleTimeout()
	}
	const copyHash = async () => {
		await Clipboard.setStringAsync(hash)
		setCopy({ ...copy, hash: true })
		handleTimeout()
	}
	const copyPreimage = async () => {
		await Clipboard.setStringAsync(entry.preImage || '')
		setCopy({ ...copy, preimage: true })
		handleTimeout()
	}
	const handleTimeout = () => {
		const t = setTimeout(() => {
			setCopy(initialCopyState)
			clearTimeout(t)
		}, 3000)
	}
	return (
		<View style={[styles.container, { backgroundColor: color.BACKGROUND }]}>
			<TopNav withBackBtn />
			<View style={styles.topSection}>
				<Text style={[globals(color, highlight).txt, styles.info]}>
					{isLn ? LNstr : eCash}
				</Text>
				<Text style={[styles.amount, { color: entry.amount < 0 ? color.ERROR : mainColors.VALID }]}>
					{formatInt(entry.amount < 0 ? Math.abs(entry.amount) : entry.amount, 'en', 'standard')}
				</Text>
				<Text style={[globals(color, highlight).txt, { color: color.TEXT_SECONDARY }]}>
					Satoshi
				</Text>
			</View>
			{/* Settle Time */}
			<View style={styles.entryInfo}>
				<Text style={globals(color, highlight).txt}>
					Settle Time
				</Text>
				<Text style={globals(color, highlight).txt}>
					{new Date(entry.timestamp * 1000).toLocaleString()}
				</Text>
			</View>
			<View style={[styles.separator, { borderColor: color.BORDER }]} />
			{/* Memo */}
			<View style={styles.entryInfo}>
				<Text style={globals(color, highlight).txt}>
					Memo
				</Text>
				<Text style={[globals(color, highlight).txt, styles.infoValue]}>
					{isLn && memo.length > 0 ? memo : tokenMemo && tokenMemo.length > 0 ? tokenMemo : 'No Memo'}
				</Text>
			</View>
			<View style={[styles.separator, { borderColor: color.BORDER }]} />
			{/* Mints */}
			{/* TODO update style to fit multiple mints */}
			<View style={styles.entryInfo}>
				<Text style={globals(color, highlight).txt}>
					{isLn ? 'Mint' : 'Mints'}
				</Text>
				<Text style={globals(color, highlight).txt}>
					{entry.mints.map(m => formatMintUrl(m))}
				</Text>
			</View>
			<View style={[styles.separator, { borderColor: color.BORDER }]} />
			{/* cashu token or ln invoice */}
			<TouchableOpacity
				style={styles.entryInfo}
				onPress={() => {
					if (!entry.value.length || copy.value) { return }
					void copyValue()
				}}
			>
				<Text style={globals(color, highlight).txt}>
					{isLn ? 'Invoice' : 'Token'}
				</Text>
				<View style={styles.copyWrap}>
					<Text style={[globals(color, highlight).txt, styles.infoValue, entry.value.length > 0 ? styles.mr10 : {}]}>
						{entry.value.length ? `${entry.value.slice(0, 16)}...` : 'Not available'}
					</Text>
					{entry.value.length > 0 &&
						<>
							{copy.value ?
								<CheckmarkIcon width={18} height={20} color={mainColors.VALID} />
								:
								<CopyIcon width={18} height={20} color={color.TEXT} />
							}
						</>
					}
				</View>
			</TouchableOpacity>
			<View style={[styles.separator, { borderColor: color.BORDER }]} />
			{isLn &&
				<>
					{/* LN payment hash */}
					<TouchableOpacity
						style={styles.entryInfo}
						onPress={() => {
							if (!hash.length || copy.hash) { return }
							void copyHash()
						}}
					>
						<Text style={globals(color, highlight).txt}>
							Payment Hash
						</Text>
						<View style={styles.copyWrap}>
							<Text style={[globals(color, highlight).txt, styles.infoValue, hash.length > 0 ? styles.mr10 : {}]}>
								{hash.length > 0 ? `${hash.slice(0, 16)}...` : 'Not available'}
							</Text>
							{hash.length > 0 &&
								<>
									{copy.hash ?
										<CheckmarkIcon width={18} height={20} color={mainColors.VALID} />
										:
										<CopyIcon width={18} height={20} color={color.TEXT} />
									}
								</>
							}
						</View>
					</TouchableOpacity>
					<View style={[styles.separator, { borderColor: color.BORDER }]} />
					{/* LN payment preImage */}
					<TouchableOpacity
						style={styles.entryInfo}
						onPress={() => {
							if (!entry.preImage || copy.preimage) { return }
							void copyPreimage()
						}}
					>
						<Text style={globals(color, highlight).txt}>
							Pre-Image
						</Text>
						<View style={styles.copyWrap}>
							<Text style={[
								globals(color, highlight).txt,
								styles.infoValue,
								entry.preImage && entry.preImage.length > 0 ? styles.mr10 : {}
							]}>
								{entry.preImage || 'Not available'}
							</Text>
							{entry.preImage && entry.preImage.length > 0 &&
								<>
									{copy.preimage ?
										<CheckmarkIcon width={18} height={20} color={mainColors.VALID} />
										:
										<CopyIcon width={18} height={20} color={color.TEXT} />
									}
								</>
							}
						</View>
					</TouchableOpacity>
					<View style={[styles.separator, { borderColor: color.BORDER }]} />
					{/* LN payment fees */}
					<View style={styles.entryInfo}>
						<Text style={globals(color, highlight).txt}>
							Fee
						</Text>
						<Text style={globals(color, highlight).txt}>
							{entry.fee ? `${entry.fee} Satoshi` : 'Not available'}
						</Text>
					</View>
				</>
			}
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		paddingHorizontal: 20,
	},
	topSection: {
		width: '100%',
		marginTop: 130,
		marginBottom: 40,
		alignItems: 'center',
	},
	info: {
		marginBottom: 10,
		fontSize: 18,
	},
	infoValue: {
		maxWidth: 200,
	},
	amount: {
		fontSize: 35,
		marginTop: 10,
	},
	entryInfo: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingVertical: 15,
	},
	separator: {
		borderBottomWidth: 1,
	},
	copyBtn: {
		position: 'absolute',
		bottom: 20,
		left: 20,
		right: 20,
	},
	copyWrap: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	mr10: {
		marginRight: 10,
	}
})