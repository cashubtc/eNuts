import { useThemeContext } from "@src/context/Theme";
import { ProgressFill, ProgressTrack, highlight as hi } from "@styles";

import Txt from "./Txt";

interface IProgressProps {
  progress: number;
  withIndicator?: boolean;
  contactsCount?: number;
  doneCount?: number;
}

export default function Progress({
  progress,
  withIndicator,
  contactsCount,
  doneCount,
}: IProgressProps) {
  const { color, highlight } = useThemeContext();
  return (
    <>
      <ProgressTrack style={{ backgroundColor: color.INPUT_BG }}>
        <ProgressFill style={{ width: `${progress * 100}%`, backgroundColor: hi[highlight] }} />
      </ProgressTrack>
      {withIndicator && (
        <Txt
          txt={`${progress * 100}% - ${doneCount}/${contactsCount}`}
          styles={[{ textAlign: "center", marginBottom: 20 }]}
        />
      )}
    </>
  );
}
