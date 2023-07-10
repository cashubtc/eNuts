import { getDecodedToken } from '@cashu/cashu-ts'
import Button from '@comps/Button'
import useLoading from '@comps/hooks/Loading'
import { BackupIcon, CheckCircleIcon, CheckmarkIcon, CopyIcon, QRIcon } from '@comps/Icons'
import Loading from '@comps/Loading'
import MyModal from '@comps/modal'
import QR from '@comps/QR'
import Separator from '@comps/Separator'
import Txt from '@comps/Txt'
import type { THistoryEntryPageProps } from '@model/nav'
import BottomNav from '@nav/BottomNav'
import TopNav from '@nav/TopNav'
import { ThemeContext } from '@src/context/Theme'
import { historyStore } from '@store'
import { globals, mainColors } from '@styles'
import { formatInt, formatMintUrl, getLnInvoiceInfo, isUndef } from '@util'
import { isTokenSpendable } from '@wallet'
import * as Clipboard from 'expo-clipboard'
import { useContext, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'

const initialCopyState = {
	value: false,
	hash: false,
	preimage: false
}

export default function DetailsPage({ navigation, route }: THistoryEntryPageProps) {
	const { t } = useTranslation(['common', 'history'])
	const entry = route.params.entry
	const { color } = useContext(ThemeContext)
	const [copy, setCopy] = useState(initialCopyState)
	const [isSpent, setIsSpent] = useState(entry.isSpent)
	const { loading, startLoading, stopLoading } = useLoading()
	const [qr, setQr] = useState({ open: false, error: false })
	const isPayment = entry.amount < 0
	const isLn = entry.type === 2
	const LNstr = t(isPayment ? 'lnPayment' : 'lnInvoice')
	const Ecash = t('ecashPayment')
	const { hash, memo } = isLn ? getLnInvoiceInfo(entry.value) : { hash: '', memo: '' }
	const tokenMemo = !isLn ? getDecodedToken(entry.value).memo : t('noMemo', { ns: 'history' })
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
		if (!entry.preImage) { return }
		await Clipboard.setStringAsync(entry.preImage)
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
		await historyStore.updateHistoryEntry(entry, { ...entry, isSpent: !isSpendable })
		stopLoading()
	}
	const handleQR = () => {
		setQr({ ...qr, open: true })
	}
	return (
		<View style={[styles.container, { backgroundColor: color.BACKGROUND }]}>
			<TopNav screenName={isLn ? LNstr : Ecash} withBackBtn />
			<ScrollView style={{ marginTop: 110, marginBottom: 60 }} showsVerticalScrollIndicator={false} >
				<View style={styles.topSection}>
					<Text style={[styles.amount, { color: entry.amount < 0 ? color.ERROR : mainColors.VALID }]}>
						{formatInt(entry.amount < 0 ? Math.abs(entry.amount) : entry.amount)}
					</Text>
					<Txt
						txt='Satoshi'
						styles={[{ color: color.TEXT_SECONDARY }]}
					/>
				</View>
				<View style={globals(color).wrapContainer}>
					{/* Settle Time */}
					<View style={styles.entryInfo}>
						<Txt txt={t('settleTime', { ns: 'history' })} />
						<Txt txt={new Date(entry.timestamp * 1000).toLocaleString()} />
					</View>
					<Separator />
					{/* Memo */}
					<View style={styles.entryInfo}>
						<Txt txt={t('memo', { ns: 'history' })} />
						<Txt
							txt={isLn && memo.length > 0 ? memo : tokenMemo && tokenMemo.length > 0 ? tokenMemo : t('noMemo', { ns: 'history' })}
							styles={[styles.infoValue]}
						/>
					</View>
					<Separator />
					{/* Mints */}
					{/* TODO update style to fit multiple mints */}
					<View style={styles.entryInfo}>
						<Txt txt={isLn ? 'Mint' : 'Mints'} />
						<Txt txt={entry.mints.map(m => formatMintUrl(m)).join(', ')} />
					</View>
					<Separator />
					{/* cashu token or ln invoice */}
					<TouchableOpacity
						style={styles.entryInfo}
						onPress={() => {
							if (!entry.value.length || copy.value) { return }
							void copyValue()
						}}
					>
						<Txt txt={isLn ? t('invoice') : 'Token'} />
						<View style={styles.copyWrap}>
							<Txt
								txt={entry.value.length ? `${entry.value.slice(0, 16)}...` : t('n/a')}
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
					<Separator />
					{/* check is token spendable */}
					{isPayment && !isLn &&
						<>
							<IsSpentContainer
								isSpent={isSpent}
								handleCheckSpendable={() => void handleCheckSpendable()}
							>
								<Txt
									txt={isUndef(isSpent) ? t('checkSpent', { ns: 'history' }) : t(isSpent ? 'isSpent' : 'isPending', { ns: 'history' }) + '...'}
								/>
								{isSpent ?
									<CheckCircleIcon width={18} height={18} color={mainColors.VALID} />
									:
									loading ?
										<Loading />
										:
										<BackupIcon width={20} height={20} color={color.TEXT} />
								}
							</IsSpentContainer>
							<Separator />
						</>
					}
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
								<Txt txt={t('paymentHash', { ns: 'history' })} />
								<View style={styles.copyWrap}>
									<Txt
										txt={hash.length > 0 ? `${hash.slice(0, 16)}...` : t('n/a')}
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
							<Separator />
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
										txt={entry.preImage || t('n/a')}
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
							<Separator />
							{/* LN payment fees */}
							<View style={styles.entryInfo}>
								<Txt txt={t('fee')} />
								<Txt txt={entry.fee ? `${entry.fee} Satoshi` : t('n/a')} />
							</View>
							<Separator />
						</>
					}
					{/* QR code */}
					<TouchableOpacity
						style={styles.entryInfo}
						onPress={handleQR}
					>
						<Txt txt={t('showQr', { ns: 'history' })} />
						<QRIcon width={17} height={17} color={color.TEXT} />
					</TouchableOpacity>
				</View>
			</ScrollView>
			<BottomNav navigation={navigation} route={route} />
			<MyModal type='question' visible={qr.open} close={() => setQr({ open: false, error: false })}>
				{qr.error ?
					<Txt txt={t('bigQrMsg')} styles={[{ textAlign: 'center' }]} />
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
	},
	topSection: {
		marginBottom: 30,
		alignItems: 'center',
	},
	infoValue: {
		maxWidth: 200,
	},
	amount: {
		fontSize: 50,
	},
	entryInfo: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingVertical: 20,
	},
	copyWrap: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	mr10: {
		marginRight: 10,
	}
})