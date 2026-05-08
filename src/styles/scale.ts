import { Dimensions } from "react-native";

const GUIDELINE_BASE_WIDTH = 350;
const GUIDELINE_BASE_HEIGHT = 680;

const { width, height } = Dimensions.get("window");

export function scale(size: number) {
  return (width / GUIDELINE_BASE_WIDTH) * size;
}

export function verticalScale(size: number) {
  return (height / GUIDELINE_BASE_HEIGHT) * size;
}

export function moderateScale(size: number, factor = 0.5) {
  return size + (scale(size) - size) * factor;
}

export function moderateVerticalScale(size: number, factor = 0.5) {
  return size + (verticalScale(size) - size) * factor;
}

export const fontScale = verticalScale;
export const s = scale;
export const vs = verticalScale;
export const ms = moderateScale;
export const mvs = moderateVerticalScale;
