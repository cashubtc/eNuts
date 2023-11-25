import type { Token } from '@cashu/cashu-ts'
import useLoading from '@comps/hooks/Loading'
import useCashuToken from '@comps/hooks/Token'
import Loading from '@comps/Loading'
import TrustMintModal from '@comps/modal/TrustMint'
import Txt from '@comps/Txt'
import { addMint } from '@db'
import { l } from '@log'
import type { ITokenInfo } from '@model'
import type { IContact, INostrDm } from '@model/nostr'
import { useNostrContext } from '@src/context/Nostr'
import { usePromptContext } from '@src/context/Prompt'
import { useThemeContext } from '@src/context/Theme'
import { NS } from '@src/i18n'
import { getNostrUsername, truncateStr } from '@src/nostr/util'
import { addToHistory } from '@store/latestHistoryEntries'
import { updateNostrRedeemed } from '@store/nostrDms'
import { highlight as hi, mainColors } from '@styles'
import { formatMintUrl, formatSatStr } from '@util'
import { claimToken } from '@wallet'
import { getTokenInfo } from '@wallet/proofs'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TouchableOpacity, View } from 'react-native'
import { ScaledSheet, vs } from 'react-native-size-matters'

interface ITokenProps {
	sender?: IContact
	token: string
	id: string
	dms: INostrDm[]
	setDms: (newDms: INostrDm[]) => void
	mints: string[]
}

export default function Token({ sender, token, id, dms, setDms, mints }: ITokenProps) {
	const { t } = useTranslation([NS.common])
	const { openPromptAutoClose } = usePromptContext()
	const { color, highlight } = useThemeContext()
	const { setNostr } = useNostrContext()
	const [info, setInfo] = useState<ITokenInfo | undefined>()
	const { trustModal, setTrustModal } = useCashuToken()
	const { loading, startLoading, stopLoading } = useLoading()

	const handleStoreRedeemed = async () => {
		await updateNostrRedeemed(id)
		// update claimed state
		setNostr(prev => {
			prev.claimedEvtIds[id] = id
			return { ...prev }
		})
		// update dms state
		setDms([...dms.filter(dm => dm.id !== id)])
	}

	const handleRedeem = async () => {
		if (!info) { return }
		startLoading()
		// check for unknown mint
		if (!mints.includes(info.mints[0] || '')) {
			// show trust modal
			setTrustModal(true)
			return
		}
		await receiveToken()
	}

	// This function is only called if the mints of the received token are not in the user DB
	const handleTrustModal = async () => {
		if (!info) { return }
		for (const mint of info.mints) {
			// eslint-disable-next-line no-await-in-loop
			await addMint(mint)
		}
		// add token to db
		await receiveToken()
	}

	// helper function that gets called either right after pasting token or in the trust modal depending on user permission
	const receiveToken = async () => {
		if (!info) { return }
		// redeem
		try {
			const success = await claimToken(token).catch(l)
			if (!success) {
				openPromptAutoClose({ msg: t('invalidOrSpent') })
				await handleStoreRedeemed()
				stopLoading()
				return
			}
			// add as history entry (receive ecash from nostr)
			await addToHistory({
				amount: info.value,
				type: 1,
				value: token,
				mints: info.mints,
				sender: truncateStr(getNostrUsername(sender) ?? '')
			})
			await handleStoreRedeemed()
			openPromptAutoClose({
				success: true,
				msg: t('claimSuccess', {
					amount: info.value,
					mintUrl: info.mints[0],
					memo: info.decoded.memo
				})
			})
			stopLoading()

		} catch (e) {
			l(e)
		}
	}

	useEffect(() => {
		try {
			const decoded = getTokenInfo(token)
			setInfo(decoded)
		} catch (e) {
			l(e)
		}
	}, [token])

	return (
		<View style={[styles.tokenWrap, { borderColor: color.BORDER }]}>
			<View>
				<Txt
					txt={formatSatStr(info?.value || 0)}
					styles={[styles.amount]}
				/>
				<Txt
					txt={formatMintUrl(info?.mints[0] || '')}
					styles={[{
						color: mints.includes(info?.mints[0] || '') ? color.TEXT_SECONDARY : mainColors.WARN,
						marginBottom: vs(10)
					}]}
				/>
			</View>
			{loading ?
				<Loading />
				:
				<TouchableOpacity
					onPress={() => void handleRedeem()}
					style={[styles.redeem, { backgroundColor: hi[highlight] }]}
				>
					<Txt txt='Redeem' styles={[{ color: mainColors.WHITE }]} />
				</TouchableOpacity>
			}
			{/* Question modal for mint trusting */}
			{trustModal &&
				<TrustMintModal
					loading={loading}
					tokenInfo={info}
					handleTrustModal={() => void handleTrustModal()}
					closeModal={() => setTrustModal(false)}
				/>
			}
		</View>
	)
}

const styles = ScaledSheet.create({
	tokenWrap: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		borderWidth: 1,
		borderRadius: 20,
		paddingVertical: '10@vs',
		paddingHorizontal: '20@s',
		marginVertical: '10@vs',
	},
	amount: {
		fontSize: '20@s',
		fontWeight: '500',
		color: mainColors.VALID
	},
	redeem: {
		paddingVertical: '5@vs',
		paddingHorizontal: '10@s',
		borderRadius: 50,
	}
})