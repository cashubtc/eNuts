import { useThemeContext } from "@src/context/Theme";
import { RadioCircle, globals, highlight as hi } from "@styles";

export default function RadioBtn({ selected }: { selected?: boolean }) {
  const { color, highlight } = useThemeContext();
  return (
    <RadioCircle
      style={[
        globals(color, highlight).radioBtn,
        { backgroundColor: selected ? hi[highlight] : "transparent" },
      ]}
    />
  );
}
