import Button from '@comps/Button'
import { ExclamationIcon } from '@comps/Icons'
import { useThemeContext } from '@src/context/Theme'
import { globals } from '@styles'
import { StyleSheet, Text, View } from 'react-native'

import MyModal from '.'

interface IPromptModalProps {
	header: string
	txt?: string
	hideIcon?: boolean
	visible: boolean
	close: () => void
}

export function PromptModal({ header, txt, hideIcon, visible, close }: IPromptModalProps) {
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
				</Text>}
			<Button txt='OK' onPress={close} />
		</MyModal>
	)
}

const styles = StyleSheet.create({
	promptIcon: {
		marginBottom: 20,
	},
})