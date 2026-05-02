import { ProgressFill, ProgressTrack } from "@styles";

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
  return (
    <>
      <ProgressTrack>
        <ProgressFill style={{ width: `${progress * 100}%` }} />
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
