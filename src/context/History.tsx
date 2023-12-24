
import { l } from '@log'
import type { IHistoryEntry } from '@model'
import { NS } from '@src/i18n'
import { historyStore, store } from '@store'
import { STORE_KEYS } from '@store/consts'
import { getHistory } from '@store/HistoryStore'
import { addToHistory, getLatestHistory } from '@store/latestHistoryEntries'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
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

	const hasEntries = useMemo(() => Object.keys(history).length > 0, [history])

	const setHistoryEntries = async () => {
		const [latest, all] = await Promise.all([getLatestHistory(), getHistory()])
		setHistory(all)
		setLatestHistory(latest.reverse())
	}

	const addHistoryEntry = async (entry: Omit<IHistoryEntry, 'timestamp'>) => {
		const [resp] = await Promise.all([
			addToHistory(entry),
			setHistoryEntries()
		])
		return resp
	}

	const updateHistoryEntry = async (oldEntry: IHistoryEntry, newEntry: IHistoryEntry) => {
		await Promise.all([
			historyStore.updateHistoryEntry(oldEntry, newEntry),
			setHistoryEntries()
		])
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
		// TODO requestTokenLoop() should be moved to this global context
	}, [])

	useEffect(() => void setHistoryEntries(), [claimed])

	return {
		history,
		latestHistory,
		hasEntries,
		addHistoryEntry,
		updateHistoryEntry,
		deleteHistory,
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
})

export const useHistoryContext = () => useContext(HistoryCtx)

export const HistoryProvider = ({ children }: { children: React.ReactNode }) => (
	<HistoryCtx.Provider value={useHistory()} >
		{children}
	</HistoryCtx.Provider>
)