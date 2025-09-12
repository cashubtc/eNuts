import { createNativeStackNavigator } from "@react-navigation/native-stack";
import SeedScreen from "@screens/Restore/Seed";
import MnemonicScreen from "@screens/Restore/Mnemonic";
import SelectRecoveryMintScreen from "@screens/Restore/SelectRecoveryMint";
import RecoverScreen from "@screens/Restore/Recover";
import RecoveringScreen from "@screens/Restore/Recovering";
import { RestoreStackParamList } from "@src/nav/navTypes";

const RestoreStack = createNativeStackNavigator<RestoreStackParamList>();

function RestoreNavigator() {
  return (
    <RestoreStack.Navigator
      screenOptions={{ headerShown: false, animation: "fade" }}
    >
      <RestoreStack.Screen name="Seed" component={SeedScreen} />
      <RestoreStack.Screen name="Mnemonic" component={MnemonicScreen} />
      <RestoreStack.Screen
        name="RecoverMints"
        component={SelectRecoveryMintScreen}
      />
      <RestoreStack.Screen name="Recover" component={RecoverScreen} />
      <RestoreStack.Screen name="Recovering" component={RecoveringScreen} />
    </RestoreStack.Navigator>
  );
}

export default RestoreNavigator;
