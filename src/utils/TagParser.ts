import { calculatePublicKey } from "./Helper";

type TagType = "soulbound" | "extractable";

export class TagParser {
  TagID: string;
  TagVersion: string;
  Burned: boolean;
  Type?: TagType;
  ExtractLocked?: boolean;
  PinLocked?: boolean;
  PublicKey?: string;
  PrivateKey?: string;
  PolicyId?: string;
  TwoFactorKey?: string;
  LastSignature?: string;

  constructor(input: string) {
    this.TagID = input.slice(0, 4);
    this.TagVersion = input.slice(4, 8);
    this.Burned = input.slice(8, 10) === "01";
    if (this.Burned) {
      this.Type = this.parseType(input.slice(10, 12));
      this.ExtractLocked = input.slice(12, 14) === "01";
      this.PinLocked = input.slice(14, 16) === "01";
      if (this.Type == "extractable" && !this.ExtractLocked && !this.PinLocked) {
        this.PrivateKey = input.slice(16, 80).toUpperCase();
        this.PublicKey = calculatePublicKey(this.PrivateKey).toUpperCase();
      } else {
        this.PublicKey = input.slice(16, 80).toUpperCase();
      }
      this.PolicyId = input.slice(80, 136).toUpperCase();
      if (!this.PinLocked) {
        this.TwoFactorKey = input.slice(136, 200).toUpperCase();
        this.LastSignature = input.slice(200, 328).toUpperCase();
      }
    }
  }

  private parseType(type: string): TagType | undefined {
    switch (type) {
      case "01":
        return "soulbound";
      case "02":
        return "extractable";
      default:
        return undefined;
    }
  }
}