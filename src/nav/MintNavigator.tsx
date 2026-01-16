import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { MintHomeScreen, AddMintScreen, MintSettingsScreen } from "@screens/Mints";
import { MintStackParamList } from "@src/nav/navTypes";

const MintStack = createNativeStackNavigator<MintStackParamList>();

function MintNavigator() {
  return (
    <MintStack.Navigator screenOptions={{ headerShown: false, animation: "fade" }}>
      <MintStack.Screen name="MintHome" component={MintHomeScreen} />
      <MintStack.Screen name="MintAdd" component={AddMintScreen} />
      <MintStack.Screen name="MintSettings" component={MintSettingsScreen} />
    </MintStack.Navigator>
  );
}

export default MintNavigator;
