import { arrayBufferToHex, hexStringToArrayBuffer } from "../utils/Helper";
import { TagParser } from "../utils/TagParser";

declare const nfc: any;
declare const ndef: any;

export class MobileNFCService {
  private MAX_TRIES = 10;
  private TRIES = 0;
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
        this.TRIES = 0;
        this.startScan();
      } catch (error) {
        this.stopScan();
        reject(error);
      }
    });
  }

  private ndefListener = (nfcEvent: any) => {
    try {
      if (this._command && this.TRIES === 0) {
        const message = [
          ndef.record(ndef.TNF_MIME_MEDIA, "application/octet-stream", [], hexStringToArrayBuffer(this._command))
        ];
        nfc.write(message, () => console.log('NFC write successful'), (err: any) => console.error('NFC write failed', err));
        this._command = undefined;
        this.TRIES++;
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
    nfc.addNdefListener(
      this.ndefListenerCallback,
      () => console.log('NFC Listener added'),
      (err: any) => console.error('Failed to add NFC Listener', err)
    );
  };

  private stopScan = () => {
    if (this.ndefListenerCallback) {
      nfc.removeNdefListener(
        this.ndefListenerCallback,
        () => console.log('NFC Listener removed'),
        (err: any) => console.error('Failed to remove NFC Listener', err)
      );
    }
  };

  cancel() {
    this.isCanceled = true;
    this.stopScan();
    this._reject && this._reject('canceled');
  }
}