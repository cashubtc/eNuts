import { l } from '@log'
import type { GithubLatest } from '@model/github'
import { extractVersion, getLatestVersion } from '@util/github'
import { createContext, useContext, useEffect, useState } from 'react'

import { version } from '../../package.json'

const useRelease = () => {
	const [info, setInfo] = useState<GithubLatest>()
	const [isOutdated, setIsOutdated] = useState(false)

	useEffect(() => {
		void (async () => {
			try {
				const releaseInfo = await getLatestVersion()
				if (!releaseInfo) { return l('[useRelease] no release info') }
				setInfo(releaseInfo)
				const latest = extractVersion(releaseInfo.tag_name)
				setIsOutdated(latest !== version)
			} catch (error) {
				l('[useRelease] error', error)
			}
		})()
	}, [])

	return {
		info,
		isOutdated
	}
}
type useReleaseType = ReturnType<typeof useRelease>

const ReleaseCtx = createContext<useReleaseType>({
	info: undefined,
	isOutdated: false,
})

export const useReleaseContext = () => useContext(ReleaseCtx)

export const ReleaseProvider = ({ children }: { children: React.ReactNode }) => (
	<ReleaseCtx.Provider value={useRelease()} >
		{children}
	</ReleaseCtx.Provider>
)