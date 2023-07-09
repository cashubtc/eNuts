import { DayInMs, HourInMs, MinuteInMs } from '@consts'
import { getTranslationLangCode } from '@src/util/localization'
import { getShortDateStr } from '@util'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

interface IEntryTimeProps {
	from: number
	fallback?: string
}

export default function EntryTime({ from, fallback }: IEntryTimeProps) {
	const { t } = useTranslation(getTranslationLangCode())
	const [time, setTime] = useState<string>()
	function calcTime() {
		const fromDate = new Date(from)
		const ago = new Date().getTime() - from
		const absAgo = Math.abs(ago)
		if (absAgo > DayInMs) {
			return getShortDateStr(fromDate)
		} else if (absAgo > HourInMs) {
			const hrs = Math.floor(absAgo / HourInMs)
			return hrs > 1 ? t('history.nHrsAgo', { hrs }) : t('history.oneHrAgo') // `${hrs} hour${hrs > 1 ? 's' : ''} ago`
		} else if (absAgo < MinuteInMs) {
			return fallback
		}
		const mins = Math.floor(absAgo / MinuteInMs)
		return mins > 1 ? t('history.nMinsAgo', { mins }) : t('history.oneMinAgo') //`${mins} minute${mins > 1 ? 's' : ''} ago`
	}

	useEffect(() => {
		setTime(calcTime())
		const t = setInterval(() => {
			setTime(s => {
				const newTime = calcTime()
				if (newTime !== s) {
					return newTime
				}
				return s
			})
		}, MinuteInMs)
		return () => clearInterval(t)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [time])

	return <>{time}</>
}