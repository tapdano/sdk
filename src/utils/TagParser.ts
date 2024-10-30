import { calculatePublicKey, calculatePublicKeySecp256k1 } from "./Helper";

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
        if (this.TagVersion.startsWith('02')) {
          this.PublicKey = calculatePublicKeySecp256k1(this.PrivateKey).toUpperCase();
        } else {
          this.PublicKey = calculatePublicKey(this.PrivateKey).toUpperCase();
        }
      } else {
        let publicKeyLen = ((this.TagVersion.startsWith('02')) ? 65 : 32) * 2;
        this.PublicKey = input.slice(16, 16 + publicKeyLen).toUpperCase();
      }
      let pos = (this.TagVersion.startsWith('02')) ? 146 : 80;
      let policyIdLen = 28 * 2;
      this.PolicyId = input.slice(pos, pos + policyIdLen).toUpperCase(); pos =+ policyIdLen;
      if (!this.PinLocked) {
        let twoFactorKeyLen = ((this.TagVersion.startsWith('02')) ? 16 : 32) * 2;
        this.TwoFactorKey = input.slice(pos, pos + twoFactorKeyLen).toUpperCase(); pos =+ twoFactorKeyLen;
        let lastSignatureLen = ((this.TagVersion.startsWith('02')) ? 72 : 64) * 2;
        this.LastSignature = input.slice(pos, pos + lastSignatureLen).toUpperCase();
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