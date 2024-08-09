import { arrayBufferToHex, hexStringToArrayBuffer } from "../utils/Helper";
import { TagParser } from "../utils/TagParser";

export class WebNFCService {
  private MAX_TRIES = 10;
  private TRIES = 0;
  private ndefReader: NDEFReader | null = null;
  private isFirstRead = true;
  private _command: string | undefined;
  private _resolve: ((value: TagParser | PromiseLike<TagParser>) => void) | undefined = undefined;
  private _reject: ((reason?: any) => void) | undefined = undefined;
  private isCanceled = false;

  async executeCommand(command?: string): Promise<TagParser> {
    return new Promise<TagParser>(async (resolve, reject) => {
      try {
        this._resolve = resolve;
        this._reject = reject;
        this.isCanceled = false;
        this._command = command;
        if (!('NDEFReader' in window)) {
          throw new Error('NDEFReader is not supported on this device');
        }
        this.isFirstRead = (command != undefined);
        this.TRIES = 0;
        this.startScan();
      } catch (error) {
        this.stopScan();
        reject(error);
      }
    });
  }

  private readHandler = async (event: NDEFReadingEvent) => {
    try {
      if (this.isFirstRead) {
        await this.ndefReader?.write({
          records: [{ recordType: "unknown", data: hexStringToArrayBuffer(this._command as string).buffer }],
        });
        if (this.isCanceled) return;
        this.isFirstRead = false;
        this.startScan();
        return;
      }

      let readContent: string = '';
      if (event.message.records.length > 0) {
        const record = event.message.records[0];
        if (record.recordType === "text") {
          const textDecoder = new TextDecoder(record.encoding);
          readContent = textDecoder.decode(record.data);
        } else if (record.recordType === "unknown") {
          readContent = record.data?.buffer ? arrayBufferToHex(record.data?.buffer) : '';
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
    this.ndefReader = new NDEFReader();
    this.ndefReader?.addEventListener("reading", this.readHandler as unknown as EventListenerOrEventListenerObject);
    await this.ndefReader?.scan();
  }

  private stopScan = async () => {
    if (this.ndefReader && this.readHandler) {
      this.ndefReader.removeEventListener("reading", this.readHandler as unknown as EventListenerOrEventListenerObject);
    }
    if (this.ndefReader) {
      this.ndefReader = null;
    }
  }

  cancel() {
    this.isCanceled = true;
    this.stopScan();
    this._reject && this._reject('canceled');
  }
}