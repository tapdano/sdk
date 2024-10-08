import { arrayBufferToHex, hexStringToArray } from "../utils/Helper";
import { TagParser } from "../utils/TagParser";

declare const nfc: any;
declare const ndef: any;

export class MobileNDEFService {
  private MAX_TRIES = 10;
  private TRIES = 0;
  private isFirstRead = true;
  private _command: string | undefined;
  private _resolve: ((value: TagParser | PromiseLike<TagParser>) => void) | undefined = undefined;
  private _reject: ((reason?: any) => void) | undefined = undefined;
  private isCanceled = false;
  private ndefListenerCallback: ((nfcEvent: any) => void) | undefined = undefined;

  async executeCommand(command?: string): Promise<TagParser> {
    return new Promise<TagParser>(async (resolve, reject) => {
      try {
        this._resolve = resolve;
        this._reject = reject;
        this.isCanceled = false;
        this._command = command;
        this.isFirstRead = (command != undefined);
        this.TRIES = 0;
        this.startScan();
      } catch (error) {
        this.stopScan();
        reject(error);
      }
    });
  }

  private ndefListener = async (nfcEvent: any) => {
    try {
      if (this.isFirstRead) {
        const message = [
          ndef.record(ndef.TNF_UNKNOWN, [], [], hexStringToArray(this._command as string))
        ];
        await nfc.write(message);
        if (this.isCanceled) return;
        this.isFirstRead = false;
        this.startScan();
        return;
      }

      let readContent: string = '';
      const record = nfcEvent.tag.ndefMessage[0];
      if (record) {
        readContent = arrayBufferToHex(record.payload);
      }

      if (this.isCanceled) return;
      this.stopScan();
      this._resolve && this._resolve(new TagParser(readContent));
    } catch (error) {
      if (this.isCanceled) return;
      this.TRIES++;
      if (this.TRIES >= this.MAX_TRIES) {
        this.stopScan();
        this._reject && this._reject(error);
      }
    }
  };

  private startScan = () => {
    this.stopScan();
    this.ndefListenerCallback = this.ndefListener.bind(this);
    nfc.addNdefListener(this.ndefListenerCallback);
  };

  private stopScan = () => {
    if (this.ndefListenerCallback) {
      nfc.removeNdefListener(this.ndefListenerCallback);
    }
  };

  cancel() {
    this.isCanceled = true;
    this.stopScan();
    this._reject && this._reject('canceled');
  }
}