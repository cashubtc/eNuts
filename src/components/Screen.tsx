import TopNav from '@nav/TopNav'
import { useThemeContext } from '@src/context/Theme'
import { globals } from '@styles'
import { View } from 'react-native'

interface IContainerProps {
	children: React.ReactNode
	screenName?: string
	withBackBtn?: boolean
	withCancelBtn?: boolean
	handlePress?: () => void
	mintBalance?: number
	handleMintBalancePress?: () => void
	disableMintBalance?: boolean
	noIcons?: boolean
}

export default function Screen({
	children,
	screenName,
	withBackBtn,
	withCancelBtn,
	handlePress,
	mintBalance,
	handleMintBalancePress,
	disableMintBalance,
	noIcons
}: IContainerProps) {
	const { color } = useThemeContext()
	return (
		<View style={globals(color).container}>
			<TopNav
				screenName={screenName || ''}
				withBackBtn={withBackBtn}
				cancel={withCancelBtn}
				handlePress={handlePress}
				mintBalance={mintBalance}
				handleMintBalancePress={handleMintBalancePress}
				disableMintBalance={disableMintBalance}
				noIcons={noIcons}
			/>
			{children}
		</View>
	)
}