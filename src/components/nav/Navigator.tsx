import type { INavigatorProps, RootStackParamList } from "@model/nav";
import { useNavigation } from "@react-navigation/core";
import {
  createNativeStackNavigator,
  type NativeStackNavigationProp,
} from "@react-navigation/native-stack";
import AuthPage from "@screens/Auth";
import Dashboard from "@screens/Dashboard";
import { Disclaimer } from "@screens/Disclaimer";
import HistoryPage from "@screens/History";
import DetailsPage from "@screens/History/Details";
import MintInfoPage from "@screens/Mints/Info";
import MintNavigator from "@src/nav/MintNavigator";
import MintProofsPage from "@screens/Mints/Proofs";
import OnboardingScreen from "@screens/Onboarding";
import ProcessingScreen from "@screens/Payment/Processing";
import ProcessingErrorScreen from "@screens/Payment/ProcessingError";
import InvoiceScreen from "@screens/Payment/Receive/Invoice";
import SelectAmountScreen from "@screens/Payment/SelectAmount";
import SelectMintScreen from "@screens/Payment/SelectMint";
import CoinSelectionScreen from "@screens/Payment/Send/CoinSelection";
import EncodedTokenPage from "@screens/Payment/Send/EncodedToken";
import InputfieldScreen from "@screens/Payment/Send/Inputfield";
import SelectMintToSwapToScreen from "@screens/Payment/Send/SelectMintToSwapTo";
import SelectTargetScreen from "@screens/Payment/Send/SelectTarget";
import SuccessPage from "@screens/Payment/Success";

import MintConfirmScreen from "@screens/QRScan/MintConfirm";
import QRProcessingScreen from "@screens/QRScan/QRProcessing";
import ScanSuccessScreen from "@screens/QRScan/ScanSuccess";
import MnemonicScreen from "@screens/Restore/Mnemonic";
import RecoverScreen from "@screens/Restore/Recover";
import RecoveringScreen from "@screens/Restore/Recovering";
import RestoreWarningScreen from "@screens/Restore/RestoreWarning";
import SeedScreen from "@screens/Restore/Seed";
import SelectRecoveryMintScreen from "@screens/Restore/SelectRecoveryMint";
import Settings from "@screens/Settings";
import AdvancedFunctionScreen from "@screens/Settings/Advanced";
import DisplaySettings from "@screens/Settings/Display";
import LanguageSettings from "@screens/Settings/Language";
import { useThemeContext } from "@src/context/Theme";
import { useEffect } from "react";
import { View } from "react-native";
import SendSelectAmountScreen from "@screens/Payment/SendSelectAmount";
import MintSelectAmountScreen from "@screens/Payment/MintSelectAmount";

const Stack = createNativeStackNavigator<RootStackParamList>();

const animationDuration = 250;

export default function Navigator({
  pinHash,
  bgAuth,
  shouldOnboard,
  setBgAuth,
  hasSeed,
  sawSeedUpdate,
}: INavigatorProps) {
  const { color } = useThemeContext();

  const nav =
    useNavigation<
      NativeStackNavigationProp<RootStackParamList, "success", "MyStack">
    >();

  const getInitialRoute = () => {
    // initial onboarding
    if (shouldOnboard) {
      return "onboarding";
    }
    // a pin has been setup previously
    if (pinHash || bgAuth) {
      return "auth";
    }
    // no previous pin setup && onboarding done
    if (!hasSeed && !sawSeedUpdate) {
      return "Seed";
    }
    return "dashboard";
  };

  useEffect(() => {
    if (!bgAuth || !pinHash.length) {
      return;
    }
    setBgAuth?.(false);
    nav.navigate("auth", { pinHash });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bgAuth]);

  return (
    <View
      style={{
        position: "absolute",
        height: "100%",
        width: "100%",
        backgroundColor: color.BACKGROUND,
      }}
    >
      <Stack.Navigator
        initialRouteName={getInitialRoute()}
        screenOptions={{
          headerShown: false,
          animation: "fade",
          animationDuration,
          navigationBarColor: color.BACKGROUND,
        }}
      >
        <Stack.Screen name="selectMint" component={SelectMintScreen} />
        <Stack.Screen name="selectTarget" component={SelectTargetScreen} />
        <Stack.Screen
          name="selectMintToSwapTo"
          component={SelectMintToSwapToScreen}
        />
        <Stack.Screen name="meltInputfield" component={InputfieldScreen} />
        <Stack.Screen name="selectAmount" component={SelectAmountScreen} />
        <Stack.Screen
          name="SendSelectAmount"
          component={SendSelectAmountScreen}
        />
        <Stack.Screen
          name="MintSelectAmount"
          component={MintSelectAmountScreen}
        />
        <Stack.Screen name="coinSelection" component={CoinSelectionScreen} />
        <Stack.Screen
          name="processing"
          component={ProcessingScreen}
          options={{ gestureEnabled: false }}
        />
        <Stack.Screen
          name="qr processing"
          component={QRProcessingScreen}
          options={{ gestureEnabled: false }}
        />
        <Stack.Screen name="mint confirm" component={MintConfirmScreen} />
        <Stack.Screen name="scan success" component={ScanSuccessScreen} />
        <Stack.Screen
          name="processingError"
          component={ProcessingErrorScreen}
        />
        <Stack.Screen name="mintInvoice" component={InvoiceScreen} />
        <Stack.Screen
          name="onboarding"
          component={OnboardingScreen}
          options={{
            animation: "default",
            animationDuration,
          }}
        />
        <Stack.Screen
          name="dashboard"
          component={Dashboard}
          options={{
            animation: "default",
            animationDuration,
            gestureEnabled: false,
          }}
        />
        <Stack.Screen name="disclaimer" component={Disclaimer} />
        <Stack.Screen
          name="auth"
          component={AuthPage}
          initialParams={{ pinHash, sawSeedUpdate }}
          options={{ gestureEnabled: false }}
        />
        {/* sendable token created page */}
        <Stack.Screen
          name="encodedToken"
          component={EncodedTokenPage}
          options={{
            animation: "slide_from_bottom",
            animationDuration,
            gestureEnabled: false,
          }}
        />
        <Stack.Screen
          name="success"
          component={SuccessPage}
          options={{ gestureEnabled: false }}
        />
        <Stack.Screen name="Mint" component={MintNavigator} />
        <Stack.Screen name="mint info" component={MintInfoPage} />
        <Stack.Screen name="mint proofs" component={MintProofsPage} />
        <Stack.Screen name="history" component={HistoryPage} />
        <Stack.Screen name="history entry details" component={DetailsPage} />
        <Stack.Screen name="Settings" component={Settings} />
        <Stack.Screen name="Display settings" component={DisplaySettings} />
        <Stack.Screen name="Language settings" component={LanguageSettings} />
        <Stack.Screen
          name="Advanced settings"
          component={AdvancedFunctionScreen}
        />
        <Stack.Screen
          name="Seed"
          component={SeedScreen}
          initialParams={{
            sawSeedUpdate: sawSeedUpdate,
            comingFromOnboarding: false,
            hasSeed: hasSeed,
          }}
        />
        <Stack.Screen name="Recover" component={RecoverScreen} />
        <Stack.Screen name="Mnemonic" component={MnemonicScreen} />
        <Stack.Screen name="Recovering" component={RecoveringScreen} />
        <Stack.Screen
          name="Select recovery mint"
          component={SelectRecoveryMintScreen}
        />
        <Stack.Screen name="Restore warning" component={RestoreWarningScreen} />
      </Stack.Navigator>
    </View>
  );
}
