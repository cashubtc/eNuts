import TopNav from '@nav/TopNav'
import { ThemeContext } from '@src/context/Theme'
import { globals } from '@styles'
import { useContext } from 'react'
import { View } from 'react-native'

interface IContainerProps {
	children: React.ReactNode
	screenName?: string
	withBackBtn?: boolean
	withCancelBtn?: boolean
	handlePress?: () => void
}

export default function Container({ children, screenName, withBackBtn, withCancelBtn, handlePress }: IContainerProps) {
	const { color } = useContext(ThemeContext)
	return (
		<View style={globals(color).container}>
			<TopNav
				screenName={screenName || ''}
				withBackBtn={withBackBtn}
				cancel={withCancelBtn}
				handlePress={handlePress}
			/>
			{children}
		</View>
	)
}