import { LeftArrow } from "@comps/Icons";
import { NS } from "@src/i18n";
import { AppText, Stack, useAppThemeTokens } from "@styles";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { TouchableOpacity } from "react-native";

interface ITopNavProps {
  screenName?: string;
  withBackBtn?: boolean;
  handlePress?: () => void;
  cancel?: boolean;
  handleCancel?: () => void;
  rightAction?: ReactNode;
}

export default function TopNav({
  screenName,
  withBackBtn,
  handlePress,
  cancel,
  handleCancel,
  rightAction,
}: ITopNavProps) {
  const { t } = useTranslation([NS.common]);
  const theme = useAppThemeTokens();

  return (
    <Stack
      flexDirection="row"
      alignItems="center"
      minHeight={48}
      paddingHorizontal={6}
      backgroundColor="$background"
    >
      <Stack width={44} alignItems="flex-start" justifyContent="center">
        {withBackBtn ? (
          <TouchableOpacity
            accessibilityRole="button"
            activeOpacity={0.7}
            onPress={handlePress}
            style={{
              width: 44,
              height: 44,
              alignItems: "center",
              justifyContent: "center",
            }}
            testID="back-btn-top-nav"
          >
            <LeftArrow color={theme.accent} />
          </TouchableOpacity>
        ) : null}
      </Stack>

      <Stack flex={1} justifyContent="center" paddingHorizontal={6}>
        {screenName ? (
          <AppText
            numberOfLines={1}
            weight="medium"
            size="nav"
            style={{ fontSize: 17, lineHeight: 22 }}
          >
            {screenName}
          </AppText>
        ) : null}
      </Stack>

      <Stack flexDirection="row" alignItems="center" justifyContent="flex-end" minWidth={44}>
        {rightAction}
        {cancel ? (
          <TouchableOpacity
            accessibilityRole="button"
            activeOpacity={0.7}
            style={{ minHeight: 44, justifyContent: "center", paddingHorizontal: 10 }}
            onPress={handleCancel}
          >
            <AppText weight="medium" tone="accent" align="center">
              {t("cancel")}
            </AppText>
          </TouchableOpacity>
        ) : null}
      </Stack>
    </Stack>
  );
}
