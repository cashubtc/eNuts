import Loading from '@comps/Loading'
import Txt from '@comps/Txt'
import { l } from '@log'
import type { ISelectKeysetPageProps } from '@model/nav'
import { useThemeContext } from '@src/context/Theme'
import { getMintKeySetIds } from '@wallet'
import { useEffect, useState } from 'react'
import { View } from 'react-native'


export default function SelectKeysetScreen({ navigation, route }: ISelectKeysetPageProps) {

	const { mnemonic, mintUrl, comingFromOnboarding } = route.params

	const { color } = useThemeContext()
	const [loading, setLoading] = useState(true)
	const [allKeysets, setAllKeysets] = useState<string[]>([])

	const handleKeysets = async () => {
		try {
			const { keysets } = await getMintKeySetIds(mintUrl)
			l({ keysets })
			setLoading(false)
			// TODO get keysets that already have been restored and disable them
			setAllKeysets(keysets)
		} catch (e) {
			l('[handleKeysetId] error: ', e)
			setLoading(false)
		}
	}

	useEffect(() => {
		void handleKeysets()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	return (
		<View
			style={{
				flex: 1,
				justifyContent: 'center',
				alignItems: 'center',
				backgroundColor: color.BACKGROUND
			}}
		>
			{loading ?
				<Loading />
				:
				<Txt txt={`total usable keysets: ${allKeysets.length}`} />
			}
		</View>
	)
}