import { LeftArrow, SearchIcon } from "@comps/Icons";
import { useThemeContext } from "@src/context/Theme";
import { NS } from "@src/i18n";
import { globals, highlight as hi } from "@styles";
import { useTranslation } from "react-i18next";
import { Text, TouchableOpacity, View } from "react-native";
import { s, ScaledSheet, vs } from "react-native-size-matters";

interface TTopNavProps {
  screenName?: string;
  withBackBtn?: boolean;
  handlePress?: () => void;

  showSearch?: boolean;
  toggleSearch?: () => void;
  cancel?: boolean;
  handleCancel?: () => void;
  openProfile?: () => void;
  handleMintBalancePress?: () => void;
  disableMintBalance?: boolean;
  txt?: string;
  mintBalance?: number;
  loading?: boolean;
  noIcons?: boolean;
  rightAction?: React.ReactNode;
}

export default function TopNav({
  screenName,
  withBackBtn,
  handlePress,
  showSearch,
  toggleSearch,
  cancel,
  handleCancel,
  txt,
  rightAction,
}: TTopNavProps) {
  const { t } = useTranslation([NS.common]);
  const { color, highlight } = useThemeContext();
  return (
    <View style={[styles.topNav, { backgroundColor: color.BACKGROUND }]}>
      {/* Placeholder */}
      {!screenName && !withBackBtn && <View />}
      <View style={styles.wrap}>
        {withBackBtn && !txt?.length && (
          <TouchableOpacity
            onPress={handlePress}
            style={styles.backiconWrap}
            testID="back-btn-top-nav"
          >
            <LeftArrow color={hi[highlight]} />
          </TouchableOpacity>
        )}
        {screenName && <Text style={globals(color).navTxt}>{screenName}</Text>}
      </View>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        {rightAction}
        {showSearch && (
          <TouchableOpacity
            onPress={() => toggleSearch?.()}
            style={{
              paddingHorizontal: s(5),
              paddingVertical: vs(5),
            }}
          >
            <SearchIcon color={color.TEXT} />
          </TouchableOpacity>
        )}
        {(cancel || (txt && txt.length > 0)) && (
          <TouchableOpacity
            style={[styles.right, styles.cancel]}
            onPress={() => {
              if (txt?.length) {
                return handlePress?.();
              }
              handleCancel?.();
            }}
          >
            <Text style={globals(color, highlight).pressTxt}>
              {txt || t("cancel")}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = ScaledSheet.create({
  topNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: "10@vs",
    paddingHorizontal: "8@s",
  },
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: "12@s",
  },
  backiconWrap: {
    paddingRight: "20@s",
  },
  right: {
    paddingLeft: "20@s",
  },
  cancel: {
    paddingHorizontal: "20@s",
  },
});
