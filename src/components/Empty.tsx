import type { RootStackParamList } from "@model/nav";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Stack, useAppThemeTokens } from "@styles";
import { Image } from "expo-image";
import { useTranslation } from "react-i18next";

import { TxtButton } from "./Button";
import Txt from "./Txt";

interface IEmptyProps {
  txt: string;
  hint?: string;
  hintComponent?: React.ReactNode;
  hasOk?: boolean;
  pressable?: boolean;
  onPress?: () => void;
  nav?:
    | NativeStackNavigationProp<RootStackParamList, "nostrReceive", "MyStack">
    | NativeStackNavigationProp<RootStackParamList, "qr scan", "MyStack">;
}

export default function Empty({
  txt,
  hint,
  hintComponent,
  hasOk,
  pressable,
  onPress,
  nav,
}: IEmptyProps) {
  const { t } = useTranslation();
  const theme = useAppThemeTokens();
  return (
    <Stack paddingHorizontal={20} alignItems="center">
      <Image
        style={{ width: 300, height: 300, opacity: 0.4 }}
        source={require("@assets/mixed_forest.png")}
        contentFit="contain"
      />
      {pressable && onPress ? (
        <>
          {hintComponent}
          <TxtButton txt={txt} onPress={onPress} />
        </>
      ) : (
        <>
          <Txt
            txt={txt}
            bold
            center
            styles={[
              { fontSize: 18, opacity: 0.8, color: theme.text, marginBottom: hasOk ? 10 : 0 },
            ]}
          />
          {hint && hint.length > 0 && (
            <Txt txt={hint} center styles={[{ color: theme.textSecondary, fontSize: 12 }]} />
          )}
        </>
      )}
      {hasOk && <TxtButton txt={t("backToDashboard")} onPress={() => nav?.navigate("dashboard")} />}
    </Stack>
  );
}
