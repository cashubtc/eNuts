import { LeftArrow } from "@comps/Icons";
import { useThemeContext } from "@src/context/Theme";
import { NS } from "@src/i18n";
import { AppText, Stack, globals, highlight as hi } from "@styles";
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
  const { color, highlight } = useThemeContext();

  return (
    <Stack
      flexDirection="row"
      alignItems="center"
      minHeight={48}
      paddingHorizontal={6}
      style={{ backgroundColor: color.BACKGROUND }}
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
            <LeftArrow color={hi[highlight]} />
          </TouchableOpacity>
        ) : null}
      </Stack>

      <Stack flex={1} justifyContent="center" paddingHorizontal={6}>
        {screenName ? (
          <AppText
            numberOfLines={1}
            weight="medium"
            style={[globals(color).navTxt, { fontSize: 17, lineHeight: 22 }]}
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
            <AppText weight="medium" style={globals(color, highlight).pressTxt}>
              {t("cancel")}
            </AppText>
          </TouchableOpacity>
        ) : null}
      </Stack>
    </Stack>
  );
}
