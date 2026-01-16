import { useThemeContext } from "@src/context/Theme";
import { globals, highlight as hi, mainColors } from "@styles";
import { getColor } from "@styles/colors";
import { View, type StyleProp, TouchableOpacity, type ViewStyle } from "react-native";
import { s, ScaledSheet } from "react-native-size-matters";

import Loading from "./Loading";
import Txt from "./Txt";

interface IButtonProps {
  txt: string;
  onPress: () => void;
  border?: boolean;
  outlined?: boolean;
  filled?: boolean;
  ghost?: boolean;
  destructive?: boolean;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  size?: "small" | "medium" | "large";
}

export default function Button({
  txt,
  onPress,
  border,
  outlined,
  filled,
  ghost,
  destructive,
  disabled,
  loading,
  icon,
  size = "medium",
}: IButtonProps) {
  const { color, highlight } = useThemeContext();

  // Define size variants
  const sizeStyles = {
    small: {
      paddingHorizontal: s(14),
      paddingVertical: s(12),
      fontSize: s(13),
      spinnerSize: 16,
    },
    medium: {
      paddingHorizontal: s(18),
      paddingVertical: s(18),
      fontSize: s(14),
      spinnerSize: 18,
    },
    large: {
      paddingHorizontal: s(22),
      paddingVertical: s(20),
      fontSize: s(16),
      spinnerSize: 20,
    },
  };

  const currentSize = sizeStyles[size];

  // Automatically disable button when loading
  const isDisabled = disabled || loading;

  return (
    <View style={styles.safeArea}>
      <TouchableOpacity
        accessibilityRole="button"
        testID={`${txt}-modal-button`}
        activeOpacity={0.5}
        disabled={isDisabled}
        style={[
          styles.touchableOpacity,
          {
            backgroundColor: hi[highlight],
            paddingHorizontal: currentSize.paddingHorizontal,
            paddingVertical: currentSize.paddingVertical,
          },
          border ? { borderWidth: 1, borderColor: mainColors.WHITE } : {},
          filled ? { backgroundColor: mainColors.WHITE } : {},
          destructive && !outlined && !ghost
            ? {
                backgroundColor: mainColors.ERROR,
              }
            : {},
          outlined
            ? {
                backgroundColor: "transparent",
                paddingHorizontal: currentSize.paddingHorizontal,
                paddingVertical: currentSize.paddingVertical,
                borderWidth: 1,
                borderColor: destructive ? mainColors.ERROR : hi[highlight],
              }
            : {},
          ghost
            ? {
                backgroundColor: "transparent",
                paddingHorizontal: currentSize.paddingHorizontal,
                paddingVertical: currentSize.paddingVertical,
              }
            : {},
          isDisabled && !loading ? { opacity: 0.3 } : {},
          loading ? { opacity: 0.7 } : {},
        ]}
        onPress={onPress}
      >
        {!loading && (
          <Txt
            txt={txt}
            bold
            center
            styles={[
              {
                color: getColor(highlight, color),
                fontSize: currentSize.fontSize,
              },
              filled || outlined || ghost ? { color: hi[highlight] } : {},
              destructive && (outlined || ghost)
                ? { color: mainColors.ERROR }
                : destructive
                  ? { color: mainColors.WHITE }
                  : {},
            ]}
          />
        )}
        {loading && (
          <View style={styles.loadingContainer}>
            <Loading
              size={currentSize.spinnerSize}
              color={
                filled || outlined || ghost
                  ? hi[highlight]
                  : destructive
                    ? mainColors.WHITE
                    : getColor(highlight, color)
              }
            />
          </View>
        )}
        {!loading && icon && <View style={styles.iconContainer}>{icon}</View>}
      </TouchableOpacity>
    </View>
  );
}

interface IIconBtnProps {
  icon: React.ReactNode;
  onPress: () => void;
  outlined?: boolean;
  disabled?: boolean;
  size?: number;
  testId?: string;
}

export function IconBtn({ icon, size, outlined, disabled, onPress, testId }: IIconBtnProps) {
  const { color, highlight } = useThemeContext();
  return (
    <View>
      <TouchableOpacity
        accessibilityRole="button"
        activeOpacity={0.5}
        style={[
          styles.iconBtn,
          {
            width: size || s(60),
            height: size || s(60),
            borderRadius: (size || s(60)) / 2,
            backgroundColor: outlined ? color.BACKGROUND : hi[highlight],
            borderColor: hi[highlight],
            // opacity: disabled ? .6 : 1
          },
        ]}
        onPress={onPress}
        disabled={disabled}
        testID={testId}
      >
        {icon}
      </TouchableOpacity>
    </View>
  );
}

interface ITxtBtnProps {
  txt: string;
  onPress: () => void;
  icon?: React.ReactNode;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>[];
  txtColor?: string;
}

export function TxtButton({ txt, onPress, icon, disabled, style, txtColor }: ITxtBtnProps) {
  const { color, highlight } = useThemeContext();
  return (
    <TouchableOpacity
      style={[styles.copyTxt, ...(style || [])]}
      onPress={onPress}
      disabled={disabled}
      testID={`${txt}-button`}
    >
      <Txt
        txt={txt}
        styles={[
          globals(color).pressTxt,
          { color: txtColor || hi[highlight], marginRight: icon ? s(10) : 0 },
        ]}
      />
      {icon ? icon : null}
    </TouchableOpacity>
  );
}

const styles = ScaledSheet.create({
  safeArea: {
    width: "100%",
  },
  touchableOpacity: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 50,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  iconContainer: {
    position: "absolute",
    right: "18@s",
    alignItems: "center",
    justifyContent: "center",
  },
  // icon button
  iconBtn: {
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  // txt button
  copyTxt: {
    paddingTop: "30@s",
    paddingBottom: "10@s",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
});
