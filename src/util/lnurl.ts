export function isLnurlEncoded(str: string) {
	str = str?.trim()
	const uriPrefixes = [
		'lightning:',
		'lightning=',
		'lightning://',
		'lnurlp://',
		'lnurlp=',
		'lnurlp:',
		'lnurl:',
		'lnurl=',
		'lnurl://',
	]
	for (const prefix of uriPrefixes) {
		if (str?.length && str.startsWith(prefix)) {
			str = str.slice(prefix.length).trim()
			break
		}
	}
	return str.toLowerCase().startsWith('lnurl1')
}