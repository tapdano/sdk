import { arrayBufferToHex, hexStringToArrayBuffer } from "../utils/Helper";
import { TagParser } from "../utils/TagParser";

export class WebAuthnService {
  private MAX_TRIES = 3;
  private TRIES = 0;
  private _command: string | undefined;
  private _resolve: ((value: TagParser | PromiseLike<TagParser>) => void) | undefined = undefined;
  private _reject: ((reason?: any) => void) | undefined = undefined;
  private isCanceled = false;

  async executeCommand(command: string = '0000'): Promise<TagParser> {
    return new Promise<TagParser>(async (resolve, reject) => {
      this._resolve = resolve;
      this._reject = reject;
      this.isCanceled = false;
      this._command = command;
      this.TRIES = 0;
      this.execWebAuthN();
    });
  }

  private execWebAuthN = async () => {
    try {
      const ret = await navigator.credentials.get({
        publicKey: {
          allowCredentials: [{
            id: hexStringToArrayBuffer(this._command as string).buffer,
            type: "public-key",
            transports: ["nfc"]
          }],
          challenge: crypto.getRandomValues(new Uint8Array(32)),
          rpId: window.location.hostname,
          userVerification: "discouraged",
          timeout: 60000
        }
      });
      if (this.isCanceled) return;
      this._resolve && this._resolve(new TagParser(arrayBufferToHex((ret as any).response.signature)));
    } catch (e) {
      if (this.isCanceled) return;
      this.TRIES++;
      if (this.TRIES >= this.MAX_TRIES) {
        this._reject && this._reject(e);
      } else {
        this.execWebAuthN();
      }
    }
  };

  cancel() {
    this.isCanceled = true;
    this._reject && this._reject('canceled');
  }
}