import Separator from "@comps/Separator";
import Txt from "@comps/Txt";
import { useThemeContext } from "@src/context/Theme";
import { globals, highlight as hi } from "@styles";
import { TouchableOpacity, View, StyleSheet } from "react-native";

interface IMenuItemProps {
  header?: string;
  txt: string;
  onPress: () => void;
  icon: React.ReactElement;
  hasSeparator?: boolean;
  disabled?: boolean;
}

export default function SettingsMenuItem({
  header,
  txt,
  icon,
  onPress,
  hasSeparator,
  disabled,
}: IMenuItemProps) {
  const { color, highlight } = useThemeContext();
  return (
    <>
      <View
        style={[
          globals().wrapRow,
          { paddingBottom: 15, flexDirection: "column", alignItems: "flex-start" },
        ]}
      >
        {header && (
          <Txt
            txt={header}
            styles={[{ color: hi[highlight], fontWeight: "bold", marginBottom: 25 }]}
          />
        )}
        <TouchableOpacity onPress={onPress} disabled={disabled} style={styles.setting}>
          {icon}
          <Txt
            txt={txt}
            styles={[styles.settingTxt, { color: disabled ? color.TEXT_SECONDARY : color.TEXT }]}
          />
        </TouchableOpacity>
      </View>
      {hasSeparator && <Separator style={[styles.separator]} />}
    </>
  );
}

const styles = StyleSheet.create({
  setting: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
  },
  settingTxt: {
    marginLeft: 15,
  },
  separator: {
    marginBottom: 15,
    marginTop: 3,
  },
});
