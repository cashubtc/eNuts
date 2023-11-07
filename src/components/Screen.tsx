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
	mintBalance?: string
	handleMintBalancePress?: () => void
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
				noIcons={noIcons}
			/>
			{children}
		</View>
	)
}