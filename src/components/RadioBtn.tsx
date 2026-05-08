import { RadioCircle } from "@styles";

export default function RadioBtn({ selected }: { selected?: boolean }) {
  return <RadioCircle backgroundColor={selected ? "$accent" : "transparent"} />;
}
