import { LeftArrow } from "@comps/Icons";
import { useThemeContext } from "@src/context/Theme";
import { NS } from "@src/i18n";
import { globals, highlight as hi } from "@styles";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Text, TouchableOpacity, View } from "react-native";
import { ScaledSheet } from "react-native-size-matters";

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
    <View style={[styles.topNav, { backgroundColor: color.BACKGROUND }]}>
      <View style={styles.leftSlot}>
        {withBackBtn ? (
          <TouchableOpacity
            accessibilityRole="button"
            activeOpacity={0.7}
            onPress={handlePress}
            style={styles.backiconWrap}
            testID="back-btn-top-nav"
          >
            <LeftArrow color={hi[highlight]} />
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.titleSlot}>
        {screenName ? (
          <Text numberOfLines={1} style={[globals(color).navTxt, styles.title]}>
            {screenName}
          </Text>
        ) : null}
      </View>

      <View style={styles.rightSlot}>
        {rightAction}
        {cancel ? (
          <TouchableOpacity
            accessibilityRole="button"
            activeOpacity={0.7}
            style={styles.cancel}
            onPress={handleCancel}
          >
            <Text style={globals(color, highlight).pressTxt}>{t("cancel")}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const styles = ScaledSheet.create({
  topNav: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: "48@vs",
    paddingHorizontal: "6@s",
  },
  leftSlot: {
    width: "44@s",
    alignItems: "flex-start",
    justifyContent: "center",
  },
  titleSlot: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: "6@s",
  },
  title: {
    fontSize: "17@ms",
    lineHeight: "22@vs",
  },
  rightSlot: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    minWidth: "44@s",
  },
  backiconWrap: {
    width: "44@s",
    height: "44@s",
    alignItems: "center",
    justifyContent: "center",
  },
  cancel: {
    minHeight: "44@vs",
    justifyContent: "center",
    paddingHorizontal: "10@s",
  },
});
