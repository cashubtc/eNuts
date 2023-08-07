import { getDecodedToken } from '@cashu/cashu-ts'
import Button from '@comps/Button'
import useLoading from '@comps/hooks/Loading'
import { BackupIcon, CheckCircleIcon, CheckmarkIcon, CopyIcon, QRIcon, SandClockIcon, SearchIcon } from '@comps/Icons'
import Loading from '@comps/Loading'
import MyModal from '@comps/modal'
import QR from '@comps/QR'
import Separator from '@comps/Separator'
import Txt from '@comps/Txt'
import type { THistoryEntryPageProps } from '@model/nav'
import TopNav from '@nav/TopNav'
import { PromptCtx } from '@src/context/Prompt'
import { ThemeContext } from '@src/context/Theme'
import { historyStore } from '@store'
import { globals, mainColors } from '@styles'
import { formatInt, formatMintUrl, getLnInvoiceInfo, isUndef } from '@util'
import { claimToken, isTokenSpendable } from '@wallet'
import * as Clipboard from 'expo-clipboard'
import { useContext, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const initialCopyState = {
	value: false,
	hash: false,
	preimage: false
}

export default function DetailsPage({ navigation, route }: THistoryEntryPageProps) {
	const { t } = useTranslation(['common'])
	const insets = useSafeAreaInsets()
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
	const { openPromptAutoClose } = useContext(PromptCtx)
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
	const handleClaim = async () => {
		startLoading()
		const success = await claimToken(entry.value)
		if (!success) {
			openPromptAutoClose({ msg: t('invalidOrSpent') })
			setIsSpent(true)
			stopLoading()
			return
		}
		// entry.isSpent can only be false here and is not undefined anymore
		await historyStore.updateHistoryEntry({ ...entry, isSpent: false }, { ...entry, isSpent: true })
		setIsSpent(true)
		stopLoading()
		openPromptAutoClose({
			msg: t(
				'claimBackSuccess',
				{
					amount: entry.amount < 0 ? Math.abs(entry.amount) : entry.amount,
					mintUrl: entry.mints.map(m => formatMintUrl(m)).join(', '),
					memo: tokenMemo
				}
			),
			success: true,
			ms: 3500
		})
	}
	const handleQR = () => {
		setQr({ ...qr, open: true })
	}
	const getSpentIcon = () => {
		if (isSpent) { return <CheckCircleIcon width={18} height={18} color={mainColors.VALID} /> }
		if (loading) { return <Loading /> }
		if (isUndef(isSpent)) { return <SearchIcon width={20} height={20} color={color.TEXT} /> }
		return <SandClockIcon width={20} height={20} color={color.TEXT} />
	}
	return (
		<View style={[globals(color).container, styles.container]}>
			<TopNav
				screenName={isLn ? LNstr : Ecash}
				withBackBtn
				handlePress={() => navigation.goBack()}
			/>
			<ScrollView style={{ marginTop: 110, marginBottom: insets.bottom }} showsVerticalScrollIndicator={false} >
				<View style={styles.topSection}>
					<Text style={[styles.amount, { color: entry.amount < 0 ? mainColors.ERROR : mainColors.VALID }]}>
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
									txt={isUndef(isSpent) ? t('checkSpent', { ns: 'history' }) : t(isSpent ? 'isSpent' : 'isPending', { ns: 'history' })}
								/>
								{getSpentIcon()}
							</IsSpentContainer>
							<Separator />
							{!isUndef(isSpent) && !isSpent &&
								<>
									<TouchableOpacity
										style={styles.entryInfo}
										onPress={() => void handleClaim()}
									>
										<Txt txt={t('claimToken')} />
										{loading ? <Loading /> : <BackupIcon width={20} height={20} color={color.TEXT} />}
									</TouchableOpacity>
									<Separator />
								</>
							}
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
		paddingTop: 0,
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