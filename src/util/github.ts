import { latestReleaseUrl } from '@consts/urls'
import type { GithubLatest } from '@model/github'

export function getLatestVersion() {
	return fetch(latestReleaseUrl)
		.then(res => res.json())
		.then(json => json) as Promise<GithubLatest>
}

export function extractVersion(version: string) {
	const startIndex = version.indexOf('v') + 1
	const endIndex = version.indexOf('-', startIndex)
	return version.slice(startIndex, endIndex)
}