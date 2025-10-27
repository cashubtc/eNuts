import { createNativeStackNavigator } from "@react-navigation/native-stack";
import HistoryPage from "@screens/History";
import HistoryEntryDetails from "@screens/History/Details";
import { useThemeContext } from "@src/context/Theme";
import type { HistoryStackParamList } from "@src/nav/navTypes";

const HistoryStack = createNativeStackNavigator<HistoryStackParamList>();

const animationDuration = 250;

export default function HistoryNavigator() {
  const { color } = useThemeContext();

  return (
    <HistoryStack.Navigator
      screenOptions={{
        headerShown: false,
        animation: "fade",
        animationDuration,
        navigationBarColor: color.BACKGROUND,
      }}
    >
      <HistoryStack.Screen name="HistoryMain" component={HistoryPage} />
      <HistoryStack.Screen
        name="HistoryEntryDetails"
        component={HistoryEntryDetails}
      />
    </HistoryStack.Navigator>
  );
}
