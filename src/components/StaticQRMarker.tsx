import { View } from "react-native";
import { s, ScaledSheet } from "react-native-size-matters";

export default function StaticQRMarker({
    size,
    color,
}: {
    size: number;
    color: string;
}) {
    return (
        <View style={{ height: size, width: size }}>
            <View style={[styles.main, { borderColor: color }, styles.tl]} />
            <View style={[styles.main, { borderColor: color }, styles.tr]} />
            <View style={[styles.main, { borderColor: color }, styles.bl]} />
            <View style={[styles.main, { borderColor: color }, styles.br]} />
        </View>
    );
}

const pos = 0;
const markerWidth = 8;
const radius = 30;
const size = s(50);

const styles = ScaledSheet.create({
    main: {
        position: "absolute",
        height: size,
        width: size,
    },
    tl: {
        top: pos,
        left: pos,
        borderTopWidth: markerWidth,
        borderLeftWidth: markerWidth,
        borderTopLeftRadius: radius,
    },
    tr: {
        top: pos,
        right: pos,
        borderTopWidth: markerWidth,
        borderRightWidth: markerWidth,
        borderTopRightRadius: radius,
    },
    bl: {
        bottom: pos,
        left: pos,
        borderBottomWidth: markerWidth,
        borderLeftWidth: markerWidth,
        borderBottomLeftRadius: radius,
    },
    br: {
        bottom: pos,
        right: pos,
        borderBottomWidth: markerWidth,
        borderRightWidth: markerWidth,
        borderBottomRightRadius: radius,
    },
});
