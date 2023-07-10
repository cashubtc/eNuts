import Button from '@comps/Button'
import usePrompt from '@comps/hooks/Prompt'
import { ChevronRightIcon } from '@comps/Icons'
import MyModal from '@comps/modal'
import Separator from '@comps/Separator'
import Toaster from '@comps/Toaster'
import Txt from '@comps/Txt'
import TopNav from '@nav/TopNav'
import { ThemeContext } from '@src/context/Theme'
import { globals } from '@styles'
import { isErr, openUrl } from '@util'
import { getTranslationLangCode } from '@util/localization'
import { useContext, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

import { version } from '../../../../package.json'

export default function AboutSettings() {
	const { t } = useTranslation(getTranslationLangCode())
	const { color, highlight } = useContext(ThemeContext)
	const { prompt, openPromptAutoClose } = usePrompt()
	const [visible, setVisible] = useState(false)
	const [url, setUrl] = useState('')
	const handlePress = (url: string) => {
		setVisible(true)
		setUrl(url)
	}
	const handleContinue = async () => {
		setVisible(false)
		await openUrl(url)?.catch(e => openPromptAutoClose({ msg: isErr(e) ? e.message : t('common.deepLinkErr') }))
	}
	return (
		<View style={[styles.container, { backgroundColor: color.BACKGROUND }]}>
			<TopNav screenName={t('topNav.about')} withBackBtn />
			<View style={[globals(color).wrapContainer, styles.wrap]}>
				<AboutRow
					txt={t('common.readme')}
					handlePress={() => handlePress('https://github.com/cashubtc/eNuts#readme')}
					hasSeparator
				/>
				<AboutRow
					txt={t('common.githubIssues')}
					handlePress={() => handlePress('https://github.com/cashubtc/eNuts/issues')}
					hasSeparator
				/>
				<AboutRow
					txt={t('common.cashuRandD')}
					handlePress={() => handlePress('https://t.me/CashuBTC')}
					hasSeparator
				/>
				<AboutRow
					txt={t('common.enutsRandD')}
					handlePress={() => handlePress('https://t.me/eNutsWallet')}
				/>
			</View>
			<Txt txt={`eNuts v${version}`} styles={[styles.version]} />
			<MyModal type='bottom' animation='slide' visible={visible} close={() => setVisible(false)}>
				<Text style={globals(color, highlight).modalHeader}>
					{t('aboutToLeaveTo')}
				</Text>
				<Text style={globals(color, highlight).modalTxt}>
					&quot;{url}&quot;
				</Text>
				<Button txt={t('common.continue')} onPress={() => void handleContinue()} />
				<TouchableOpacity onPress={() => setVisible(false)}>
					<Text style={[globals(color, highlight).pressTxt, styles.cancel]}>
						{t('common.cancel')}
					</Text>
				</TouchableOpacity>
			</MyModal>
			{prompt.open && <Toaster success={prompt.success} txt={prompt.msg} />}
		</View>
	)
}

interface IAboutRowProps {
	txt: string
	handlePress: () => void
	hasSeparator?: boolean
}

function AboutRow({ txt, handlePress, hasSeparator }: IAboutRowProps) {
	const { color } = useContext(ThemeContext)
	return (
		<>
			<TouchableOpacity
				style={styles.aboutRow}
				onPress={handlePress}
			>
				<Text style={[styles.aboutTxt, { color: color.TEXT }]}>
					{txt}
				</Text>
				<ChevronRightIcon color={color.TEXT} />
			</TouchableOpacity>
			{hasSeparator && <Separator style={[{ marginVertical: 10 }]} />}
		</>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		paddingTop: 110,
	},
	wrap: {
		paddingVertical: 10,
		marginBottom: 20,
	},
	aboutRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingVertical: 10,
	},
	aboutTxt: {
		fontSize: 16,
	},
	version: {
		fontWeight: '500',
		textAlign: 'center',
	},
	cancel: {
		marginTop: 25,
	},
})