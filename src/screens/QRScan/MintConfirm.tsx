import ActionButtons from '@comps/ActionButtons'
import { MintBoardIcon } from '@comps/Icons'
import Txt from '@comps/Txt'
import { addMint, getMintsUrls } from '@db'
import type { TMintConfirmPageProps } from '@model/nav'
import { usePromptContext } from '@src/context/Prompt'
import { useThemeContext } from '@src/context/Theme'
import { NS } from '@src/i18n'
import { globals, highlight as hi } from '@styles'
import { isErr } from '@util'
import { useTranslation } from 'react-i18next'
import { Text, View } from 'react-native'
import { s, ScaledSheet } from 'react-native-size-matters'

export default function MintConfirmScreen({ navigation, route }: TMintConfirmPageProps) {

	const { mintUrl } = route.params
	const { t } = useTranslation([NS.common])
	const { color, highlight } = useThemeContext()
	const { openPromptAutoClose } = usePromptContext()

	const handleNewMint = async () => {
		try {
			// check if mint is already in db
			const mints = await getMintsUrls(true)
			if (mints.some(m => m.mintUrl === mintUrl)) {
				openPromptAutoClose({ msg: t('mntAlreadyAdded', { ns: NS.mints }) })
				return
			}
			// add mint url to db
			await addMint(mintUrl)
			navigation.navigate('scan success', { mintUrl })
		} catch (e) {
			openPromptAutoClose({ msg: isErr(e) ? e.message : t('mintConnectionFail', { ns: NS.mints }) })
		}
	}

	return (
		<View style={[globals(color).container, styles.container]}>
			<View />
			<View style={styles.infoWrap}>
				<MintBoardIcon width={s(40)} height={s(40)} color={hi[highlight]} />
				<Text style={globals(color).modalHeader}>
					{t('confirmMint')}
				</Text>
				<Txt
					txt={t('confirmMintHint')}
					styles={[styles.descText]}
				/>
				<Txt
					txt={mintUrl}
					styles={[styles.hint, { color: color.TEXT_SECONDARY }]}
				/>
			</View>
			<ActionButtons
				topBtnTxt={t('confirm')}
				topBtnAction={() => void handleNewMint()}
				bottomBtnTxt={t('cancel')}
				bottomBtnAction={() => navigation.goBack()}
			/>
		</View>
	)
}

const styles = ScaledSheet.create({
	container: {
		alignItems: 'center',
		justifyContent: 'space-between',
		padding: '20@s',
	},
	descText: {
		marginBottom: '10@vs',
		textAlign: 'center',
	},
	hint: {
		fontSize: '12@vs',
		textAlign: 'center',
	},
	infoWrap: {
		alignItems: 'center',
	}
})