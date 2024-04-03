import { getDecodedToken } from '@cashu/cashu-ts'
import useLoading from '@comps/hooks/Loading'
import { BackupIcon, CheckCircleIcon, CheckmarkIcon, CopyIcon, QRIcon, SandClockIcon, SearchIcon } from '@comps/Icons'
import Loading from '@comps/Loading'
import QRModal from '@comps/QRModal'
import Separator from '@comps/Separator'
import Txt from '@comps/Txt'
import type { THistoryEntryPageProps } from '@model/nav'
import TopNav from '@nav/TopNav'
import { truncateStr } from '@nostr/util'
import { useHistoryContext } from '@src/context/History'
import { usePromptContext } from '@src/context/Prompt'
import { useThemeContext } from '@src/context/Theme'
import { NS } from '@src/i18n'
import { txType } from '@src/model'
import { getCustomMintNames } from '@store/mintStore'
import { globals, mainColors } from '@styles'
import { copyStrToClipboard, formatInt, formatMintUrl, formatSatStr, getLnInvoiceInfo, isNum, isUndef } from '@util'
import { claimToken, isTokenSpendable } from '@wallet'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { s, ScaledSheet } from 'react-native-size-matters'

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
		fee,
		isSpent,
		isPending,
		isExpired
	} = route.params.entry
	const { color } = useThemeContext()
	const { addHistoryEntry, updateHistoryEntry, checkLnPr } = useHistoryContext()
	const [copy, setCopy] = useState(initialCopyState)
	const [spent, setSpent] = useState(isSpent)
	const { loading, startLoading, stopLoading } = useLoading()
	const [qr, setQr] = useState({ open: false, error: false })
	const isPayment = useRef(amount < 0)
	const isLn = useRef(type > txType.SEND_RECEIVE && type < txType.RESTORE)
	const LNstr = useRef(t(isPayment.current ? 'lnPayment' : 'lnInvoice'))
	const Ecash = useRef(t('ecashPayment'))
	const { hash, memo } = useMemo(() => isLn.current ? getLnInvoiceInfo(value) : { hash: '', memo: '' }, [value])
	const tokenMemo = useMemo(() => !isLn.current && type !== txType.RESTORE ? getDecodedToken(value).memo : t('noMemo', { ns: NS.history }), [t, value, type])
	const { openPromptAutoClose } = usePromptContext()
	const [customMints, setCustomMints] = useState([{ mintUrl: '', customName: '' }])
	const intervalRef = useRef<NodeJS.Timeout | null>(null)

	useEffect(() => {
		void (async () => {
			const customName = await getCustomMintNames(mints.map(m => ({ mintUrl: m })))
			setCustomMints(customName)
		})()
	}, [mints])

	const getTxColor = () => {
		if (type === txType.SWAP || type === txType.RESTORE || isPending) { return color.TEXT }
		return amount < 0 ? mainColors.ERROR : mainColors.VALID
	}

	const getScreenName = () => {
		if (type === txType.SWAP) { return t('multimintSwap') }
		if (type === txType.RESTORE) { return t('seedBackup') }
		return isLn.current ? LNstr.current : Ecash.current
	}

	const getAmount = () => {
		if (type === txType.SWAP || type === txType.RESTORE) { return `${formatInt(Math.abs(amount))}` }
		return `${amount > 0 ? '+' : ''}${formatInt(amount)}`
	}

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
		await updateHistoryEntry(route.params.entry, { ...route.params.entry, isSpent: !isSpendable })
		stopLoading()
	}

	const handleClaim = async () => {
		startLoading()
		const success = await claimToken(value)
		if (!success) {
			openPromptAutoClose({ msg: t('invalidOrSpent') })
			setSpent(true)
			return stopLoading()
		}
		// entry.isSpent can only be false here and is not undefined anymore
		await updateHistoryEntry({ ...route.params.entry, isSpent: false }, { ...route.params.entry, isSpent: true })
		setSpent(true)
		await addHistoryEntry({ ...route.params.entry, amount: Math.abs(route.params.entry.amount), isSpent: true })
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

	const getMemo = () => {
		if (isLn.current) {
			if (memo === 'enuts') { return 'Cashu deposit' }
			return memo
		}
		if (type === txType.RESTORE) { return t('seedBackup', { ns: NS.common }) }
		if (tokenMemo) { return tokenMemo }
		return t('noMemo', { ns: NS.history })
	}

	// used in interval to check if token is spent while qr sheet is open
	const checkEcashPayment = async () => {
		if (type > txType.SEND_RECEIVE) { return clearTokenInterval() }
		const isSpendable = await isTokenSpendable(value)
		setSpent(!isSpendable)
		if (!isSpendable) {
			clearTokenInterval()
			setQr({ ...qr, open: false })
			openPromptAutoClose({ msg: t('isSpent', { ns: NS.history }), success: true })
			await updateHistoryEntry(route.params.entry, { ...route.params.entry, isSpent: true })
		}
	}

	const startTokenInterval = () => {
		if (spent || type > txType.SEND_RECEIVE) { return }
		intervalRef.current = setInterval(() => {
			void checkEcashPayment()
		}, 3000)
	}

	const clearTokenInterval = () => {
		if (intervalRef.current) {
			clearInterval(intervalRef.current)
		}
	}

	// auto check payment in intervals
	useEffect(() => {
		if (!qr.open || spent || type === txType.SEND_RECEIVE) { return clearTokenInterval() }
		startTokenInterval()
		return () => clearTokenInterval()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [qr.open])

	return (
		<View style={[globals(color).container, styles.container]}>
			<TopNav
				screenName={getScreenName()}
				withBackBtn
				handlePress={() => navigation.goBack()}
			/>
			<ScrollView showsVerticalScrollIndicator={false}>
				<View style={{ marginBottom: insets.bottom, paddingTop: s(10) }}>
					<View style={styles.topSection}>
						{isPending && !isExpired &&
							<Txt txt={t('paymentPending')} />
						}
						{isExpired ?
							<Txt txt={t('invoiceExpired')} />
							:
							<>
								<Text style={[styles.amount, { color: getTxColor() }]}>
									{getAmount()}
								</Text>
								<Txt
									txt={formatSatStr(amount, 'standard', false)}
									styles={[{ color: color.TEXT_SECONDARY }]}
								/>
							</>
						}
					</View>
					<View style={globals(color).wrapContainer}>
						{/* Manual check of pending invoice */}
						{isPending && !isExpired &&
							<>
								<TouchableOpacity
									style={styles.entryInfo}
									onPress={() => void checkLnPr(value)}
								>
									<Txt txt={t('checkPayment')} />
									<SearchIcon width={20} height={20} color={color.TEXT} />
								</TouchableOpacity>
								<Separator />
							</>
						}
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
									<Txt txt={type === txType.SWAP ? formatMintUrl(recipient) : truncateStr(recipient)} />
								</View>
								<Separator />
							</>
						}
						{/* nostr sender (in case user claims from nostr DMs) */}
						{sender && sender.length > 0 &&
							<>
								<View style={styles.entryInfo}>
									<Txt txt={t('sender')} />
									<Txt txt={truncateStr(sender)} />
								</View>
								<Separator />
							</>
						}
						{/* Memo */}
						{getMemo().length > 0 &&
							<>
								<View style={styles.entryInfo}>
									<Txt txt={t('memo', { ns: NS.history })} />
									<Txt
										txt={getMemo()}
										styles={[styles.infoValue]}
									/>
								</View>
								<Separator />
							</>
						}
						{/* Mints */}
						<View style={styles.entryInfo}>
							<Txt txt={isLn.current ? 'Mint' : 'Mints'} />
							<Txt txt={customMints.map(m => m.customName.length ? m.customName : formatMintUrl(m.mintUrl)).join(', ')} />
						</View>
						{/* cashu token or ln invoice */}
						{type < txType.RESTORE &&
							<>
								<Separator />
								<TouchableOpacity
									style={styles.entryInfo}
									onPress={() => {
										if (!value.length || copy.value) { return }
										void copyValue()
									}}
								>
									<Txt txt={isLn.current ? t('invoice') : 'Token'} />
									<View style={styles.copyWrap}>
										<Txt
											txt={value.length ? `${value.slice(0, 16)}...` : t('n/a')}
											styles={[styles.infoValue, value.length > 0 ? styles.mr10 : {}]}
										/>
										{value.length > 0 &&
											<>
												{copy.value ?
													<CheckmarkIcon width={s(18)} height={s(20)} color={mainColors.VALID} />
													:
													<CopyIcon width={s(19)} height={s(21)} color={color.TEXT} />
												}
											</>
										}
									</View>
								</TouchableOpacity>
								<Separator />
							</>
						}
						{/* check is token spendable */}
						{isPayment.current && !isLn.current &&
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
											{loading ? <Loading /> : <BackupIcon width={s(20)} height={s(20)} color={color.TEXT} />}
										</TouchableOpacity>
										<Separator />
									</>
								}
							</>
						}
						{/* Lightning related */}
						{isLn.current &&
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
													<CheckmarkIcon width={s(18)} height={s(20)} color={mainColors.VALID} />
													:
													<CopyIcon width={s(18)} height={s(20)} color={color.TEXT} />
												}
											</>
										}
									</View>
								</TouchableOpacity>
								<Separator />
								{/* LN payment fees */}
								{!isPending &&
									<>
										<View style={styles.entryInfo}>
											<Txt txt={t('fee')} />
											<Txt txt={formatSatStr(isNum(fee) ? fee : 0)} />
										</View>
										<Separator />
									</>
								}
							</>
						}
						{/* QR code */}
						{type < txType.RESTORE &&
							<TouchableOpacity
								style={styles.entryInfo}
								onPress={handleQR}
							>
								<Txt txt={t('showQr', { ns: NS.history })} />
								<QRIcon width={s(17)} height={s(17)} color={color.TEXT} />
							</TouchableOpacity>
						}
					</View>
				</View>
			</ScrollView >
			<QRModal
				visible={qr.open}
				value={value}
				error={qr.error}
				close={() => setQr({ open: false, error: false })}
				onError={() => setQr({ open: true, error: true })}
				isInvoice={isLn.current}
				truncateNum={isLn.current ? 20 : 25}
			/>
		</View >
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

const styles = ScaledSheet.create({
	container: {
		paddingTop: '90@vs',
	},
	topSection: {
		marginBottom: '30@vs',
		alignItems: 'center',
	},
	infoValue: {
		maxWidth: '200@s',
	},
	amount: {
		fontSize: '40@vs',
		fontWeight: '600',
	},
	entryInfo: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingBottom: '20@vs',
	},
	copyWrap: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	mr10: {
		marginRight: '10@s',
	}
})