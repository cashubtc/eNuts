import Button from '@comps/Button'
import { ExclamationIcon } from '@comps/Icons'
import { useThemeContext } from '@src/context/Theme'
import { NS } from '@src/i18n'
import { globals } from '@styles'
import { useTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'

import MyModal from '.'

interface IPromptModalProps {
	header: string
	txt?: string
	hideIcon?: boolean
	visible?: boolean
	submitTxt: string
	submit: () => void
	close: () => void
}

export function PromptModal({
	header,
	txt,
	hideIcon,
	visible,
	submitTxt,
	submit,
	close,
}: IPromptModalProps) {
	const { t } = useTranslation([NS.common])
	const { color } = useThemeContext()
	return (
		<MyModal type='error' animation='fade' visible={visible}>
			{!hideIcon &&
				<View style={styles.promptIcon}>
					<ExclamationIcon width={60} height={60} color={color.TEXT} />
				</View>
			}
			<Text style={globals(color).modalHeader}>
				{header}
			</Text>
			{txt &&
				<Text style={globals(color).modalTxt}>
					{txt}
				</Text>
			}
			<Button txt={submitTxt} onPress={submit} />
			<View style={{ marginVertical: 10 }} />
			<Button
				txt={t('cancel')}
				onPress={close}
				outlined
			/>
		</MyModal>
	)
}

const styles = StyleSheet.create({
	promptIcon: {
		marginBottom: 20,
	},
})