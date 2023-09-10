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
import { truncateNostrProfileInfo } from '@nostr/util'
import { usePromptContext } from '@src/context/Prompt'
import { useThemeContext } from '@src/context/Theme'
import { NS } from '@src/i18n'
import { historyStore } from '@store'
import { globals, mainColors } from '@styles'
import { copyStrToClipboard, formatInt, formatMintUrl, getLnInvoiceInfo, isUndef } from '@util'
import { claimToken, isTokenSpendable } from '@wallet'
import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const initialCopyState = {
	value: false,
	hash: false,
	preimage: false
}

export default function DetailsPage({ navigation, route }: THistoryEntryPageProps) {
	const { t } = useTranslation([NS.common])
	const insets = useSafeAreaInsets()
	const {
		timestamp,
		amount,
		type,
		value,
		mints,
		sender,
		recipient,
		preImage,
		fee,
		isSpent
	} = route.params.entry
	const { color } = useThemeContext()
	const [copy, setCopy] = useState(initialCopyState)
	const [spent, setSpent] = useState(isSpent)
	const { loading, startLoading, stopLoading } = useLoading()
	const [qr, setQr] = useState({ open: false, error: false })
	const isPayment = amount < 0
	const isLn = type === 2 || type === 3
	const LNstr = t(isPayment ? 'lnPayment' : 'lnInvoice')
	const Ecash = t('ecashPayment')
	const { hash, memo } = isLn ? getLnInvoiceInfo(value) : { hash: '', memo: '' }
	const tokenMemo = !isLn ? getDecodedToken(value).memo : t('noMemo', { ns: NS.history })
	const { openPromptAutoClose } = usePromptContext()

	const copyValue = async () => {
		await copyStrToClipboard(value)
		setCopy({ ...copy, value: true })
		handleTimeout()
	}

	const copyHash = async () => {
		await copyStrToClipboard(hash)
		setCopy({ ...copy, hash: true })
		handleTimeout()
	}

	const copyPreimage = async () => {
		if (!preImage) { return }
		await copyStrToClipboard(preImage)
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
		if (spent || loading) { return }
		startLoading()
		const isSpendable = await isTokenSpendable(value)
		setSpent(!isSpendable)
		// update history item
		await historyStore.updateHistoryEntry(route.params.entry, { ...route.params.entry, isSpent: !isSpendable })
		stopLoading()
	}

	const handleClaim = async () => {
		startLoading()
		const success = await claimToken(value)
		if (!success) {
			openPromptAutoClose({ msg: t('invalidOrSpent') })
			setSpent(true)
			stopLoading()
			return
		}
		// entry.isSpent can only be false here and is not undefined anymore
		await historyStore.updateHistoryEntry({ ...route.params.entry, isSpent: false }, { ...route.params.entry, isSpent: true })
		setSpent(true)
		stopLoading()
		openPromptAutoClose({
			msg: t(
				'claimSuccess',
				{
					amount: amount < 0 ? Math.abs(amount) : amount,
					mintUrl: mints.map(m => formatMintUrl(m)).join(', '),
					memo: tokenMemo
				}
			),
			success: true,
			ms: 3500
		})
	}

	const handleQR = useCallback(() => setQr({ ...qr, open: true }), [qr])

	const getSpentIcon = () => {
		if (spent) { return <CheckCircleIcon width={18} height={18} color={mainColors.VALID} /> }
		if (loading) { return <Loading /> }
		if (isUndef(spent)) { return <SearchIcon width={20} height={20} color={color.TEXT} /> }
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
					<Text style={[styles.amount, { color: amount < 0 ? mainColors.ERROR : mainColors.VALID }]}>
						{formatInt(amount < 0 ? Math.abs(amount) : amount)}
					</Text>
					<Txt
						txt='Satoshi'
						styles={[{ color: color.TEXT_SECONDARY }]}
					/>
				</View>
				<View style={globals(color).wrapContainer}>
					{/* Settle Time */}
					<View style={styles.entryInfo}>
						<Txt txt={t('settleTime', { ns: NS.history })} />
						<Txt txt={new Date(timestamp * 1000).toLocaleString()} />
					</View>
					<Separator />
					{/* nostr recipient */}
					{recipient && recipient.length > 0 &&
						<>
							<View style={styles.entryInfo}>
								<Txt txt={t('recipient')} />
								<Txt txt={type === 3 ? formatMintUrl(recipient) : truncateNostrProfileInfo(recipient)} />
							</View>
							<Separator />
						</>
					}
					{/* nostr sender (in case user claims from nostr DMs) */}
					{sender && sender.length > 0 &&
						<>
							<View style={styles.entryInfo}>
								<Txt txt={t('sender')} />
								<Txt txt={truncateNostrProfileInfo(sender)} />
							</View>
							<Separator />
						</>
					}
					{/* Memo */}
					<View style={styles.entryInfo}>
						<Txt txt={t('memo', { ns: NS.history })} />
						<Txt
							txt={isLn && memo.length > 0 ? memo : tokenMemo && tokenMemo.length > 0 ? tokenMemo : t('noMemo', { ns: NS.history })}
							styles={[styles.infoValue]}
						/>
					</View>
					<Separator />
					{/* Mints */}
					<View style={styles.entryInfo}>
						<Txt txt={isLn ? 'Mint' : 'Mints'} />
						<Txt txt={mints.map(m => formatMintUrl(m)).join(', ')} />
					</View>
					<Separator />
					{/* cashu token or ln invoice */}
					<TouchableOpacity
						style={styles.entryInfo}
						onPress={() => {
							if (!value.length || copy.value) { return }
							void copyValue()
						}}
					>
						<Txt txt={isLn ? t('invoice') : 'Token'} />
						<View style={styles.copyWrap}>
							<Txt
								txt={value.length ? `${value.slice(0, 16)}...` : t('n/a')}
								styles={[styles.infoValue, value.length > 0 ? styles.mr10 : {}]}
							/>
							{value.length > 0 &&
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
								isSpent={spent}
								handleCheckSpendable={() => void handleCheckSpendable()}
							>
								<Txt
									txt={isUndef(spent) ? t('checkSpent', { ns: NS.history }) : t(spent ? 'isSpent' : 'isPending', { ns: NS.history })}
								/>
								{getSpentIcon()}
							</IsSpentContainer>
							<Separator />
							{!isUndef(spent) && !spent &&
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
								<Txt txt={t('paymentHash', { ns: NS.history })} />
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
									if (!preImage || copy.preimage) { return }
									void copyPreimage()
								}}
							>
								<Txt txt='Pre-Image' />
								<View style={styles.copyWrap}>
									<Txt
										txt={preImage || t('n/a')}
										styles={[styles.infoValue, preImage && preImage.length > 0 ? styles.mr10 : {}]}
									/>
									{preImage && preImage.length > 0 &&
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
								<Txt txt={fee ? `${fee} Satoshi` : t('n/a')} />
							</View>
							<Separator />
						</>
					}
					{/* QR code */}
					<TouchableOpacity
						style={styles.entryInfo}
						onPress={handleQR}
					>
						<Txt txt={t('showQr', { ns: NS.history })} />
						<QRIcon width={17} height={17} color={color.TEXT} />
					</TouchableOpacity>
				</View>
			</ScrollView>
			<MyModal type='question' visible={qr.open} close={() => setQr({ open: false, error: false })}>
				{qr.error ?
					<Txt txt={t('bigQrMsg')} styles={[{ textAlign: 'center' }]} />
					:
					<QR
						value={value}
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