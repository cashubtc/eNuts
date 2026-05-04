import { AppText, verticalScale, fontScale, PressableSurface, Stack } from "@styles";
import { CloseIcon } from "@comps/Icons";
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import type { ReactNode, RefObject } from "react";
import { StyleSheet } from "react-native";
interface IDashboardActionSheetProps {
  sheetRef: RefObject<TrueSheet | null>;
  title: string;
  closeAccessibilityLabel: string;
  backgroundColor: string;
  closeIconColor: string;
  children: ReactNode;
}
export default function DashboardActionSheet({
  sheetRef,
  title,
  closeAccessibilityLabel,
  backgroundColor,
  closeIconColor,
  children,
}: IDashboardActionSheetProps) {
  return (
    <TrueSheet
      ref={sheetRef}
      detents={["auto"]}
      backgroundColor={backgroundColor}
      cornerRadius={26}
      grabberOptions={{ color: closeIconColor }}
    >
      <Stack style={[styles.container, { backgroundColor }]}>
        <Stack style={styles.header}>
          <AppText style={[styles.title]} weight="medium" align="center" testID={`${title}-txt`}>
            {title}
          </AppText>
          <PressableSurface
            activeOpacity={0.65}
            accessibilityRole="button"
            accessibilityLabel={closeAccessibilityLabel}
            style={styles.closeBtn}
            onPress={() => {
              void sheetRef.current?.dismiss();
            }}
          >
            <CloseIcon width={18} height={18} color={closeIconColor} />
          </PressableSurface>
        </Stack>

        {children}
      </Stack>
    </TrueSheet>
  );
}
interface IDashboardActionSheetOptionProps {
  icon: ReactNode;
  title: string;
  description: string;
  textColor: string;
  descriptionColor: string;
  onPress: () => void;
  testID: string;
}
export function DashboardActionSheetOption({
  icon,
  title,
  description,
  textColor,
  descriptionColor,
  onPress,
  testID,
}: IDashboardActionSheetOptionProps) {
  return (
    <PressableSurface
      activeOpacity={0.7}
      style={styles.optionContainer}
      onPress={onPress}
      testID={testID}
      accessibilityRole="button"
    >
      <Stack style={styles.iconContainer}>{icon}</Stack>
      <Stack style={styles.txtWrap}>
        <AppText style={[styles.actionText, { color: textColor }]}>{title}</AppText>
        <AppText style={[styles.descriptionText, { color: descriptionColor }]}>
          {description}
        </AppText>
      </Stack>
    </PressableSurface>
  );
}
const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 34,
    paddingBottom: 24,
  },
  header: {
    minHeight: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  title: {
    fontSize: fontScale(20),
    lineHeight: verticalScale(25),
  },
  closeBtn: {
    position: "absolute",
    right: 0,
    top: 0,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  optionContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
  },
  iconContainer: {
    minWidth: "11%",
  },
  txtWrap: {
    width: "90%",
  },
  actionText: {
    fontSize: fontScale(14),
    fontWeight: "500",
    marginBottom: 4,
  },
  descriptionText: {
    fontSize: fontScale(12),
  },
});
