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
  private isIOS: boolean = false;

  constructor() {
    this.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }

  async executeCommand(command?: string): Promise<TagParser> {
    return new Promise<TagParser>(async (resolve, reject) => {
      try {
        this._resolve = resolve;
        this._reject = reject;
        this.isCanceled = false;
        this._command = command;
        this.isFirstRead = (command != undefined);
        this.TRIES = 0;
        await this.startScan();
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
        nfc.write(message, async () => {
          this.stopScan();
          if (this.isCanceled) return;
          this.isFirstRead = false;
          if (this.isIOS) {
            alert("Please tap again to read the response.");
          }
          await this.startScan();
        }, (error: any) => {
          this.stopScan();
          this._reject && this._reject(error);
        });
        return;
      }

      let ndefMessage = null;
      if (this.isIOS) {
        ndefMessage = nfcEvent.ndefMessage || (nfcEvent.tag && nfcEvent.tag.ndefMessage);
      } else {
        ndefMessage = nfcEvent.tag && nfcEvent.tag.ndefMessage;
      }

      let readContent: string = '';
      for (let i = 0; i < ndefMessage.length; i++) {
        const record = ndefMessage[i];
        if (record.tnf == 5) {
          readContent = arrayBufferToHex(record.payload);
          break;
        }
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

  private startScan = async () => {
    this.stopScan();
    if (this.isIOS) {
      const keepSessionOpen = this._command != undefined;
      const nfcEvent = await nfc.scanTag({ keepSessionOpen });
      await this.ndefListener(nfcEvent);
    } else {
      this.ndefListenerCallback = this.ndefListener.bind(this);
      nfc.addNdefListener(this.ndefListenerCallback);
    }
  };

  private stopScan = () => {
    if (this.isIOS) {
      nfc.cancelScan();
    } else {
      if (this.ndefListenerCallback) {
        nfc.removeNdefListener(this.ndefListenerCallback);
      }
    }
  };

  cancel() {
    this.isCanceled = true;
    this.stopScan();
    this._reject && this._reject('canceled');
  }
}