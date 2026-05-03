import { verticalScale, fontScale } from "@styles";
import { CloseIcon } from "@comps/Icons";
import Txt from "@comps/Txt";
import { TrueSheet } from "@lodev09/react-native-true-sheet";
import type { ReactNode, RefObject } from "react";
import { Text, TouchableOpacity, View, StyleSheet } from "react-native";

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
      <View style={[styles.container, { backgroundColor }]}>
        <View style={styles.header}>
          <Txt txt={title} bold center styles={[styles.title]} />
          <TouchableOpacity
            activeOpacity={0.65}
            accessibilityRole="button"
            accessibilityLabel={closeAccessibilityLabel}
            style={styles.closeBtn}
            onPress={() => {
              void sheetRef.current?.dismiss();
            }}
          >
            <CloseIcon width={18} height={18} color={closeIconColor} />
          </TouchableOpacity>
        </View>

        {children}
      </View>
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
    <TouchableOpacity
      activeOpacity={0.7}
      style={styles.optionContainer}
      onPress={onPress}
      testID={testID}
      accessibilityRole="button"
    >
      <View style={styles.iconContainer}>{icon}</View>
      <View style={styles.txtWrap}>
        <Text style={[styles.actionText, { color: textColor }]}>{title}</Text>
        <Text style={[styles.descriptionText, { color: descriptionColor }]}>{description}</Text>
      </View>
    </TouchableOpacity>
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
