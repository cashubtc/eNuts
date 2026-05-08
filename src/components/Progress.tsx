import { AppText, ProgressFill, ProgressTrack } from "@styles";
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
        <AppText
          style={[{ textAlign: "center", marginBottom: 20 }]}
          testID={`${`${progress * 100}% - ${doneCount}/${contactsCount}`}-txt`}
        >{`${progress * 100}% - ${doneCount}/${contactsCount}`}</AppText>
      )}
    </>
  );
}
