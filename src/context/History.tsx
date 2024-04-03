/* eslint-disable no-await-in-loop */

import { delInvoice, getAllInvoices } from '@db'
import { l } from '@log'
import type { IHistoryEntry } from '@model'
import { NS } from '@src/i18n'
import { historyStore, store } from '@store'
import { STORE_KEYS } from '@store/consts'
import { getHistory, getHistoryEntriesByInvoices, getHistoryEntryByInvoice } from '@store/HistoryStore'
import { addToHistory, getLatestHistory, updateHistory } from '@store/latestHistoryEntries'
import { decodeLnInvoice, formatInt } from '@util'
import { requestToken } from '@wallet'
import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { useFocusClaimContext } from './FocusClaim'
import { usePromptContext } from './Prompt'

export const INVOICE_INTERVAL = 15_000

const useHistory = () => {
	const { t } = useTranslation([NS.common])
	const [history, setHistory] = useState<Record<string, IHistoryEntry[]>>({})
	const [latestHistory, setLatestHistory] = useState<IHistoryEntry[]>([])
	// State to indicate token claim from clipboard after app comes to the foreground, to re-render total balance
	const { claimed } = useFocusClaimContext()
	const { openPromptAutoClose } = usePromptContext()
	const intervalRef = useRef<NodeJS.Timeout | null>(null)
	const allHisoryEntries = useRef<IHistoryEntry[]>([])
	const hasEntries = useMemo(() => Object.keys(history).length > 0, [history])

	const startGlobalInvoiceInterval = () => {
		intervalRef.current = setInterval(() => {
			void handlePendingInvoices()
		}, INVOICE_INTERVAL)
	}

	const clearInvoiceInterval = () => {
		if (intervalRef.current) {
			clearInterval(intervalRef.current)
			allHisoryEntries.current = []
		}
	}

	const setHistoryEntries = async () => {
		const [all, latest] = await Promise.all([getHistory(), getLatestHistory()])
		setHistory(all)
		setLatestHistory(latest.reverse())
	}

	const handlePendingInvoices = async () => {
		const invoices = await getAllInvoices()
		if (!invoices.length) { return clearInvoiceInterval() }
		if (!allHisoryEntries.current.length) {
			const historyEntries = await getHistoryEntriesByInvoices(invoices)
			allHisoryEntries.current = historyEntries
		}
		let paid = { count: 0, amount: 0 }
		for (const invoice of invoices) {
			try {
				const { success } = await requestToken(invoice.mintUrl, invoice.amount, invoice.hash)
				if (success) {
					paid.count++
					paid.amount += invoice.amount
					const entry = getHistoryEntryByInvoice(allHisoryEntries.current, invoice.pr)
					if (entry) {
						await updateHistoryEntry(entry, { ...entry, isPending: false })
					}
					// TODO update balance
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
				msg: t(paid.count > 1 ? 'paidInvoices' : 'paidInvoice', { count: paid.count, total: formatInt(paid.amount) }),
				success: true
			})
			paid = { count: 0, amount: 0 }
		}
	}

	const addHistoryEntry = async (entry: Omit<IHistoryEntry, 'timestamp'>) => {
		const resp = await addToHistory(entry)
		await setHistoryEntries()
		return resp
	}

	const updateHistoryEntry = async (oldEntry: IHistoryEntry, newEntry: IHistoryEntry) => {
		await updateHistory(oldEntry, newEntry)
		await setHistoryEntries()
	}

	const deleteHistory = async () => {
		const [success] = await Promise.all([
			historyStore.clear(),
			store.delete(STORE_KEYS.latestHistory),
		])
		setHistory({})
		setLatestHistory([])
		openPromptAutoClose({
			msg: success ? t('historyDeleted') : t('delHistoryErr'),
			success
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
	// eslint-disable-next-line require-await, @typescript-eslint/require-await
	addHistoryEntry: async () => ({
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
	// eslint-disable-next-line no-return-await, @typescript-eslint/await-thenable
	updateHistoryEntry: async () => await l(''),
	// eslint-disable-next-line no-return-await, @typescript-eslint/await-thenable
	deleteHistory: async () => await l(''),
	startGlobalInvoiceInterval: () => l(''),
})

export const useHistoryContext = () => useContext(HistoryCtx)

export const HistoryProvider = ({ children }: { children: React.ReactNode }) => (
	<HistoryCtx.Provider value={useHistory()} >
		{children}
	</HistoryCtx.Provider>
)