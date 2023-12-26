/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable require-await */
/* eslint-disable no-await-in-loop */

import { addTransaction, deleteTransactions, delInvoice, getAllInvoices, getTransactions, groupEntries, migrateTransactions, updatePendingTransactionByInvoice } from '@db'
import { l } from '@log'
import type { IHistoryEntry } from '@model'
import { NS } from '@src/i18n'
import { historyStore, store } from '@store'
import { STORE_KEYS } from '@store/consts'
import { decodeLnInvoice } from '@util'
import { requestToken } from '@wallet'
import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { useFocusClaimContext } from './FocusClaim'
import { usePromptContext } from './Prompt'

const useHistory = () => {
	const { t } = useTranslation([NS.common])
	const [history, setHistory] = useState<Record<string, IHistoryEntry[]>>({})
	const [latestHistory, setLatestHistory] = useState<IHistoryEntry[]>([])
	// State to indicate token claim from clipboard after app comes to the foreground, to re-render total balance
	const { claimed } = useFocusClaimContext()
	const { openPromptAutoClose } = usePromptContext()
	const intervalRef = useRef<NodeJS.Timeout | null>(null)
	const hasEntries = useMemo(() => Object.keys(history).length > 0, [history])

	const startGlobalInvoiceInterval = () => {
		intervalRef.current = setInterval(() => {
			void handlePendingInvoices()
		}, 5000)
	}

	const clearInvoiceInterval = () => {
		if (intervalRef.current) {
			clearInterval(intervalRef.current)
		}
	}

	const setHistoryEntries = async () => {
		const allOld = await historyStore.getHistory({ order: 'DESC', start: 0, count: -1, orderBy: 'insertionOrder' })
		// migrate historyStore into sqlite table if needed
		if (allOld.length) {
			await migrateTransactions(allOld)
			// delete old historyStore
			await historyStore.clear()
			await store.delete(STORE_KEYS.latestHistory)
		}
		const all = await getTransactions()
		const latest = await getTransactions(3)
		setHistory(groupEntries(all))
		setLatestHistory(latest)
	}

	const handlePendingInvoices = async () => {
		const invoices = await getAllInvoices()
		if (!invoices.length) { return clearInvoiceInterval() }
		let paid = { count: 0, amount: 0 }
		for (const invoice of invoices) {
			try {
				const success = await requestToken(invoice.mintUrl, invoice.amount, invoice.hash)
				if (success) {
					paid.count++
					paid.amount += invoice.amount
					await updateHistoryEntry(invoice.pr)
					await delInvoice(invoice.hash)
					continue
				}
			} catch (_) {/* ignore */ }
			const { expiry } = decodeLnInvoice(invoice.pr)
			const date = new Date((invoice.time * 1000) + (expiry * 1000)).getTime()
			if (Date.now() > date) { await delInvoice(invoice.hash) }
		}
		// notify user
		if (paid.count > 0) {
			openPromptAutoClose({
				msg: t(paid.count > 1 ? 'paidInvoices' : 'paidInvoice', { count: paid.count, total: paid.amount }),
				success: true
			})
			paid = { count: 0, amount: 0 }
		}
	}

	const addHistoryEntry = async (entry: Omit<IHistoryEntry, 'timestamp'>) => {
		const item = { ...entry, timestamp: Math.ceil(Date.now() / 1000) }
		await addTransaction(item)
		await setHistoryEntries()
		// TODO update balance
		return item
	}

	const updateHistoryEntry = async (invoice: string) => {
		await updatePendingTransactionByInvoice(invoice)
		await setHistoryEntries()
		// TODO update balance
	}

	const deleteHistory = async () => {
		await deleteTransactions()
		openPromptAutoClose({
			msg: t('historyDeleted'),
			success: true
		})
	}

	useEffect(() => {
		void setHistoryEntries()
		// request token of pending invoices in interval until all are paid or expired
		startGlobalInvoiceInterval()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	useEffect(() => void setHistoryEntries(), [claimed])

	return {
		history,
		latestHistory,
		hasEntries,
		addHistoryEntry,
		updateHistoryEntry,
		deleteHistory,
		startGlobalInvoiceInterval,
	}
}
type useHistoryType = ReturnType<typeof useHistory>

const HistoryCtx = createContext<useHistoryType>({
	history: {},
	latestHistory: [],
	hasEntries: false,
	addHistoryEntry: async () => ({
		id: 0,
		timestamp: 0,
		amount: 0,
		value: '',
		mints: [],
		fee: 0,
		sender: '',
		recipient: '',
		type: 1,
		preImage: '',
		isSpent: false,
		isPending: false
	}),
	updateHistoryEntry: async () => l(''),
	deleteHistory: async () => l(''),
	startGlobalInvoiceInterval: () => l(''),
})

export const useHistoryContext = () => useContext(HistoryCtx)

export const HistoryProvider = ({ children }: { children: React.ReactNode }) => (
	<HistoryCtx.Provider value={useHistory()} >
		{children}
	</HistoryCtx.Provider>
)