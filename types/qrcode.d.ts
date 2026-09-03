declare module "qrcode" {
  type ErrorCorrectionLevel = "L" | "M" | "Q" | "H";

  interface QRCodeOptions {
    errorCorrectionLevel?: ErrorCorrectionLevel;
    margin?: number;
    width?: number;
    color?: {
      dark?: string;
      light?: string;
    };
  }

  export function toBuffer(
    text: string,
    options?: QRCodeOptions,
  ): Promise<Buffer>;

  export function toDataURL(
    text: string,
    options?: QRCodeOptions,
  ): Promise<string>;
}
