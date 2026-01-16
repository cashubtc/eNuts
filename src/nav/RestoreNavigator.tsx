import { createNativeStackNavigator } from "@react-navigation/native-stack";
import SelectRecoveryMintScreen from "@screens/Restore/SelectRecoveryMint";
import RecoverScreen from "@screens/Restore/Recover";
import RecoveringScreen from "@screens/Restore/Recovering";
import { RestoreStackParamList } from "@src/nav/navTypes";

const RestoreStack = createNativeStackNavigator<RestoreStackParamList>();

function RestoreNavigator() {
  return (
    <RestoreStack.Navigator screenOptions={{ headerShown: false, animation: "fade" }}>
      <RestoreStack.Screen name="RecoverMints" component={SelectRecoveryMintScreen} />
      <RestoreStack.Screen name="Recover" component={RecoverScreen} />
      <RestoreStack.Screen name="Recovering" component={RecoveringScreen} />
    </RestoreStack.Navigator>
  );
}

export default RestoreNavigator;
