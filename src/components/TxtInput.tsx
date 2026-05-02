import { InputFrame, useAppThemeTokens } from "@styles";
import { createRef, type LegacyRef, useEffect } from "react";
import {
  type KeyboardTypeOptions,
  type NativeSyntheticEvent,
  type StyleProp,
  TextInput,
  type TextInputSubmitEditingEventData,
  type TextStyle,
} from "react-native";

interface ITxtInputProps {
  autoCorrect?: boolean;
  keyboardType?: KeyboardTypeOptions;
  placeholder: string;
  onChangeText: (text: string) => void;
  onSubmitEditing?: (e: NativeSyntheticEvent<TextInputSubmitEditingEventData>) => void;
  innerRef?: LegacyRef<TextInput>;
  autoFocus?: boolean;
  ms?: number;
  maxLength?: number;
  value?: string;
  multiline?: boolean;
  numberOfLines?: number;
  style?: StyleProp<TextStyle>;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
}

export default function TxtInput({
  keyboardType,
  placeholder,
  onChangeText,
  onSubmitEditing,
  innerRef,
  autoFocus,
  ms,
  maxLength,
  value,
  multiline,
  numberOfLines,
  style,
  autoCorrect,
  autoCapitalize,
}: ITxtInputProps) {
  const theme = useAppThemeTokens();
  const inputRef = createRef<TextInput>();
  // auto-focus
  useEffect(() => {
    if (!autoFocus) {
      return;
    }
    const t = setTimeout(() => {
      inputRef.current?.focus();
      clearTimeout(t);
    }, ms || 200);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <InputFrame
      ref={innerRef || inputRef}
      keyboardType={keyboardType || "default"}
      placeholder={placeholder}
      placeholderTextColor={theme.placeholder as never}
      autoCorrect={autoCorrect}
      selectionColor={theme.accent}
      cursorColor={theme.accent}
      onChangeText={onChangeText}
      onSubmitEditing={onSubmitEditing}
      maxLength={maxLength}
      value={value}
      multiline={multiline}
      numberOfLines={numberOfLines}
      style={style}
      testID={`${placeholder}-input`}
      autoCapitalize={autoCapitalize}
    />
  );
}
