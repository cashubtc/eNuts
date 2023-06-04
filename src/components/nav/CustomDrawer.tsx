import { ContactsIcon, SettingsIcon } from '@comps/Icons'
import { DrawerContentComponentProps, DrawerContentScrollView } from '@react-navigation/drawer'
import { ThemeContext } from '@src/context/Theme'
import { highlight as hi, light } from '@styles/colors'
import { skipRoute } from '@util'
import { useContext } from 'react'
import { Image,StyleSheet, Text, View  } from 'react-native'
import { TouchableOpacity } from 'react-native-gesture-handler'
// import { useState } from 'react'
// import { interpolateNode } from 'react-native-reanimated'

export default function CustomDrawer(props: DrawerContentComponentProps) {
	const { color, highlight } = useContext(ThemeContext)
	const { state, navigation } = props
	const getIcon = (route: string, color: string) => {
		if (route === 'Settings') { return <SettingsIcon width={18} height={18} color={color} /> }
		return <ContactsIcon width={18} height={18} color={color} />
	}
	// const [translateX, setTranslateX] = useState(new Animated.Value(0))
	//const translateX = useSharedValue(0)
	// const scale = interpolateNode(translateX, {
	// 	inputRange: [0, 1],
	// 	outputRange: [1, 0.8],
	// })
	return (
		<View style={styles.container}>
			{/* Header */}
			<View style={[
				styles.view,
				{ backgroundColor: color.DRAWER, borderColor: color.BORDER },
				styles.marginTop,
				styles.drawerHeader
			]}>
				<Image
					style={styles.logo}
					// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
					source={color.BACKGROUND === light.custom.BACKGROUND ?
						require('../../../assets/icon_transparent_dark.png')
						:
						require('../../../assets/icon_transparent.png')
					}
				/>
				<Image
					style={styles.appName}
					// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
					source={color.BACKGROUND === light.custom.BACKGROUND ?
						require('../../../assets/appName_dark.png')
						:
						require('../../../assets/appName.png')
					}
				/>
			</View>
			{/* Pages */}
			<DrawerContentScrollView
				{...props}
				style={[
					styles.view,
					{ backgroundColor: color.DRAWER, borderColor: color.BORDER },
					styles.marginVertical
				]}
			>
				{state.routes.map((route, i) => {
					const isFocused = state.index === i
					const c = isFocused ? hi[highlight] : color.TEXT
					const onPress = () => {
						const event = navigation.emit({
							type: 'drawerItemPress',
							target: route.key,
							canPreventDefault: true,
						})
						if (!isFocused && !event.defaultPrevented) {
							navigation.navigate(route.name)
						}
					}
					return (
						skipRoute(route.name) &&
						<TouchableOpacity
							key={route.key}
							onPress={onPress}
							accessibilityRole='button'
							style={styles.drawerItem}
						>
							{getIcon(route.name, c)}
							<Text style={[styles.routeName, { color: c }]}>
								{route.name}
							</Text>
						</TouchableOpacity>
					)
				})}
			</DrawerContentScrollView>
			{/* Footer */}
			<View style={[styles.view, { backgroundColor: color.DRAWER, borderColor: color.BORDER }, styles.marginBottom]}>
				<Text style={[styles.routeName, { color: color.TEXT }]}>
					v0.0.1-alpha
				</Text>
			</View>
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	view: {
		borderWidth: 1,
		borderRadius: 15,
		marginHorizontal: 15,
		padding: 15,
	},
	drawerHeader: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	marginTop: {
		marginTop: 60,
	},
	marginBottom: {
		marginBottom: 15,
	},
	marginVertical: {
		marginVertical: 15,
	},
	drawerItem: {
		flexDirection: 'row',
		alignItems: 'center',
		padding: 10,
		marginTop: -20,
		marginBottom: 15,
	},
	routeName: {
		fontSize: 16,
		paddingHorizontal: 15,
		marginBottom: 2,
		fontWeight: '500'
	},
	logo: {
		width: 40,
		height: 40,
		resizeMode: 'contain',
		marginHorizontal: 10,
		opacity: .7,
	},
	appName: {
		width: 80,
		height: 30,
		resizeMode: 'contain',
		opacity: .7,
	}
})