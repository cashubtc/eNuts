import { useThemeContext } from '@src/context/Theme'
import { StyleSheet, View } from 'react-native'
import {
	Menu,
	MenuOption,
	MenuOptions,
	MenuTrigger,
} from 'react-native-popup-menu'

import { MenuDotsIcon } from './Icons'
import Separator from './Separator'
import Txt from './Txt'

export interface IPopupOptionProps {
	txt: string
	onSelect: () => void
	icon: React.ReactNode
	hasSeparator?: boolean
	disabled?: boolean
}

interface IPopupProps {
	opts: IPopupOptionProps[],
	optsWidth?: number
}

export default function Popup({ opts, optsWidth }: IPopupProps) {
	const { color } = useThemeContext()
	return (
		<Menu>
			<MenuTrigger style={styles.menuTrigger}>
				<MenuDotsIcon color={color.TEXT} />
			</MenuTrigger>
			<MenuOptions
				customStyles={{
					optionsContainer: {
						backgroundColor: color.INPUT_BG,
						borderRadius: 10,
						width: optsWidth ?? 180,
					},
				}}
			>
				{opts.map((o, i) => (
					<PopupOption
						key={i}
						onSelect={o.onSelect}
						txt={o.txt}
						icon={o.icon}
						hasSeparator={i < opts.length - 1}
						disabled={o.disabled}
					/>
				))}
			</MenuOptions>
		</Menu>
	)
}

function PopupOption({ txt, onSelect, icon, hasSeparator, disabled }: IPopupOptionProps) {
	const { color } = useThemeContext()
	return (
		<>
			<MenuOption onSelect={onSelect} disabled={disabled}>
				<View style={styles.optWrap}>
					<Txt txt={txt} styles={[{ color: disabled ? color.TEXT_SECONDARY : color.TEXT }]} />
					{icon}
				</View>
			</MenuOption>
			{hasSeparator && <Separator style={[{ marginBottom: 0 }]} />}
		</>
	)
}

const styles = StyleSheet.create({
	optWrap: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		padding: 10
	},
	menuTrigger: {
		paddingVertical: 10,
		paddingLeft: 10
	}
})