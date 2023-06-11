import { getDecodedToken } from '@cashu/cashu-ts'
import Button from '@comps/Button'
import useLoading from '@comps/hooks/Loading'
import { BackupIcon, CheckCircleIcon, CheckmarkIcon, CopyIcon, QRIcon } from '@comps/Icons'
import MyModal from '@comps/modal'
import QR from '@comps/QR'
import Txt from '@comps/Txt'
import type { THistoryEntryPageProps } from '@model/nav'
import TopNav from '@nav/TopNav'
import { ThemeContext } from '@src/context/Theme'
import { mainColors } from '@styles'
import { formatInt, formatMintUrl, getLnInvoiceInfo, isUndef } from '@util'
import { isTokenSpendable } from '@wallet'
import * as Clipboard from 'expo-clipboard'
import { useContext, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { TouchableOpacity } from 'react-native-gesture-handler'

const initialCopyState = {
	value: false,
	hash: false,
	preimage: false
}

export default function DetailsPage({ route }: THistoryEntryPageProps) {
	const entry = route.params.entry
	const { color } = useContext(ThemeContext)
	const [copy, setCopy] = useState(initialCopyState)
	const [isSpent, setIsSpent] = useState(entry.isSpent)
	const { loading, startLoading, stopLoading } = useLoading()
	const [qr, setQr] = useState({ open: false, error: false })
	const isPayment = entry.amount < 0
	const isLn = entry.type === 2
	const LNstr = `Lightning ${isPayment ? 'payment' : 'invoice'}`
	const Ecash = 'Ecash payment'
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
	const handleCheckSpendable = async () => {
		if (isSpent || loading) { return }
		startLoading()
		const isSpendable = await isTokenSpendable(entry.value)
		setIsSpent(!isSpendable)
		// update history item
		stopLoading()
	}
	const handleQR = () => {
		setQr({ ...qr, open: true })
	}
	return (
		<View style={[styles.container, { backgroundColor: color.BACKGROUND }]}>
			<TopNav withBackBtn />
			<View style={styles.topSection}>
				<Txt
					txt={isLn ? LNstr : Ecash}
					styles={[styles.info]}
				/>
				<Text style={[styles.amount, { color: entry.amount < 0 ? color.ERROR : mainColors.VALID }]}>
					{formatInt(entry.amount < 0 ? Math.abs(entry.amount) : entry.amount)}
				</Text>
				<Txt
					txt='Satoshi'
					styles={[{ color: color.TEXT_SECONDARY }]}
				/>
			</View>
			{/* Settle Time */}
			<View style={styles.entryInfo}>
				<Txt txt='Settle Time' />
				<Txt txt={new Date(entry.timestamp * 1000).toLocaleString()} />
			</View>
			<View style={[styles.separator, { borderColor: color.BORDER }]} />
			{/* Memo */}
			<View style={styles.entryInfo}>
				<Txt txt='Memo' />
				<Txt
					txt={isLn && memo.length > 0 ? memo : tokenMemo && tokenMemo.length > 0 ? tokenMemo : 'No Memo'}
					styles={[styles.infoValue]}
				/>
			</View>
			<View style={[styles.separator, { borderColor: color.BORDER }]} />
			{/* Mints */}
			{/* TODO update style to fit multiple mints */}
			<View style={styles.entryInfo}>
				<Txt txt={isLn ? 'Mint' : 'Mints'} />
				<Txt txt={entry.mints.map(m => formatMintUrl(m)).join(', ')} />
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
				<Txt txt={isLn ? 'Invoice' : 'Token'} />
				<View style={styles.copyWrap}>
					<Txt
						txt={entry.value.length ? `${entry.value.slice(0, 16)}...` : 'Not available'}
						styles={[styles.infoValue, entry.value.length > 0 ? styles.mr10 : {}]}
					/>
					{entry.value.length > 0 &&
						<>
							{copy.value ?
								<CheckmarkIcon width={18} height={20} color={mainColors.VALID} />
								:
								<CopyIcon width={19} height={21} color={color.TEXT} />
							}
						</>
					}
				</View>
			</TouchableOpacity>
			<View style={[styles.separator, { borderColor: color.BORDER }]} />
			{/* check is token spendable */}
			{isPayment && !isLn &&
				<IsSpentContainer
					isSpent={isSpent}
					handleCheckSpendable={() => void handleCheckSpendable()}
				>
					<Txt
						txt={isUndef(isSpent) ? 'Check if token has been spent' : `Token ${isSpent ? 'has been spent' : 'is pending...'}`}
					/>
					{isSpent ?
						<CheckCircleIcon width={18} height={18} color={mainColors.VALID} />
						:
						loading ?
							<Txt txt='Loading...' />
							:
							<BackupIcon width={20} height={20} color={color.TEXT} />
					}
				</IsSpentContainer>
			}
			<View style={[styles.separator, { borderColor: color.BORDER }]} />
			{/* Lightning related */}
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
						<Txt txt='Payment Hash' />
						<View style={styles.copyWrap}>
							<Txt
								txt={hash.length > 0 ? `${hash.slice(0, 16)}...` : 'Not available'}
								styles={[styles.infoValue, hash.length > 0 ? styles.mr10 : {}]}
							/>
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
						<Txt txt='Pre-Image' />
						<View style={styles.copyWrap}>
							<Txt
								txt={entry.preImage || 'Not available'}
								styles={[styles.infoValue, entry.preImage && entry.preImage.length > 0 ? styles.mr10 : {}]}
							/>
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
						<Txt txt='Fee' />
						<Txt txt={entry.fee ? `${entry.fee} Satoshi` : 'Not available'} />
					</View>
					<View style={[styles.separator, { borderColor: color.BORDER }]} />
				</>
			}
			{/* QR code */}
			<TouchableOpacity
				style={styles.entryInfo}
				onPress={handleQR}
			>
				<Txt txt='Show QR code' />
				<QRIcon width={17} height={17} color={color.TEXT} />
			</TouchableOpacity>
			<MyModal type='question' visible={qr.open}>
				{qr.error ?
					<Txt txt='The amount of data is too big for a QR code.' styles={[{ textAlign: 'center' }]} />
					:
					<QR
						value={entry.value}
						size={300}
						onError={() => {
							setQr({ open: true, error: true })
						}}
					/>
				}
				<View style={{ marginVertical: 20 }} />
				<Button
					outlined
					txt='OK'
					onPress={() => setQr({ open: false, error: false })}
				/>
			</MyModal>
		</View>
	)
}

interface IIsSpentContainerProps {
	isSpent?: boolean,
	handleCheckSpendable: () => void
	children: React.ReactNode
}

function IsSpentContainer({ isSpent, handleCheckSpendable, children }: IIsSpentContainerProps) {
	return isSpent ?
		<View style={styles.entryInfo}>
			{children}
		</View>
		:
		<TouchableOpacity
			style={styles.entryInfo}
			onPress={() => void handleCheckSpendable()}
		>
			{children}
		</TouchableOpacity>
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