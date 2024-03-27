/**
 * Specifies QR code capacity limits for different error correction levels.
 */
export const qrCodeLimits = {
	L: { numeric: 7089, alphanumeric: 4296, binary: 2953 },
	M: { numeric: 5596, alphanumeric: 3391, binary: 2331 },
	Q: { numeric: 3993, alphanumeric: 2420, binary: 1663 },
	H: { numeric: 3057, alphanumeric: 1852, binary: 1273 }
} as const

export const QRType = '256'