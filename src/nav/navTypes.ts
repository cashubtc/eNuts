import { CompositeScreenProps } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "@src/model/nav";

export type MintStackParamList = {
  MintHome: undefined;
  MintAdd: undefined;
  MintSettings: { mintUrl: string };
};

type MintStackScreenProps<T extends keyof MintStackParamList> =
  NativeStackScreenProps<MintStackParamList, T>;

export type MintHomeScreenProps = CompositeScreenProps<
  MintStackScreenProps<"MintHome">,
  NativeStackScreenProps<RootStackParamList>
>;

export type MintAddScreenProps = CompositeScreenProps<
  MintStackScreenProps<"MintAdd">,
  NativeStackScreenProps<RootStackParamList>
>;

export type MintSettingsScreenProps = CompositeScreenProps<
  MintStackScreenProps<"MintSettings">,
  NativeStackScreenProps<RootStackParamList>
>;
