import { arrayBufferToHex } from "../utils/Helper";
import { TagParser } from "../utils/TagParser";

declare const nfc: any;
declare const ndef: any;

export class MobileRawService {
  private MAX_TRIES = 10;
  private TRIES = 0;
  private _command: string | undefined;
  private _resolve: ((value: TagParser | PromiseLike<TagParser>) => void) | undefined = undefined;
  private _reject: ((reason?: any) => void) | undefined = undefined;
  private isCanceled = false;

  async executeCommand(command: string = '0000'): Promise<TagParser> {
    return new Promise<TagParser>(async (resolve, reject) => {
      try {
        this._resolve = resolve;
        this._reject = reject;
        this.isCanceled = false;
        this._command = command;
        this.TRIES = 0;
        await this.startScan();
      } catch (error) {
        await this.stopScan();
        reject(error);
      }
    });
  }

  private listenerHandler = async () => {
    try {
      await nfc.connect('android.nfc.tech.IsoDep', 500);
      let response = await nfc.transceive(this._command as string);
      if (this.isCanceled) return;
      await nfc.close();
      await this.stopScan();
      this._resolve && this._resolve(new TagParser(arrayBufferToHex(response)));
    } catch (error) {
      if (this.isCanceled) return;
      this.TRIES++;
      if (this.TRIES >= this.MAX_TRIES) {
        await this.stopScan();
        this._reject && this._reject(error);
      }
    }
  };

  private startScan = async () => {
    await this.stopScan();
    nfc.addTagDiscoveredListener(this.listenerHandler);
  };

  private stopScan = async () => {
    try {
      nfc.removeTagDiscoveredListener(this.listenerHandler);
      await nfc.close();
    } catch (error) {
    }
  };

  cancel() {
    this.isCanceled = true;
    this.stopScan();
    this._reject && this._reject('canceled');
  }
}