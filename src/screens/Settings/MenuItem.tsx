import Separator from "@comps/Separator";
import Txt from "@comps/Txt";
import { globals, useAppThemeTokens } from "@styles";
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
  const theme = useAppThemeTokens();
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
            styles={[{ color: theme.accent, fontWeight: "bold", marginBottom: 25 }]}
          />
        )}
        <TouchableOpacity onPress={onPress} disabled={disabled} style={styles.setting}>
          {icon}
          <Txt
            txt={txt}
            styles={[styles.settingTxt, { color: disabled ? theme.textSecondary : theme.text }]}
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
