
type Hex = 'hex'
type Base64 = 'base64'
type Utf8 = 'utf8'
type Uint8Arr = 'uint8Arr'
type Buf = 'buf'
type Format = Base64 | Hex | Utf8
type BytesFormat = Exclude<Format, Utf8> | Uint8Arr | Buf

export type { Base64, Buf, BytesFormat, Format, Hex, Uint8Arr, Utf8}
