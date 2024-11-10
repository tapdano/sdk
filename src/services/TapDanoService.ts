import { WebNFCService } from './WebNFCService';
import { WebAuthnService } from './WebAuthnService';
import { MobileNDEFService } from './MobileNDEFService';
import { MobileRawService } from './MobileRawService';
import { TagParser } from '../utils/TagParser';
import { calculatePublicKey, calculatePublicKeySecp256k1, getPlatform, intToHexString } from '../utils/Helper';

type CommunicationMethod = 'auto' | 'MobileNDEF' | 'MobileRaw' | 'WebNFC' | 'WebAuthn';

interface TapDanoServiceConfig {
  method: CommunicationMethod;
}

export class TapDanoService {
  private method: CommunicationMethod;
  private NFCService: MobileNDEFService | MobileRawService | WebAuthnService | WebNFCService;

  constructor(config?: TapDanoServiceConfig) {
    this.method = config?.method || 'auto';
    if (this.method === 'auto') {
      if ('nfc' in window) {
        if (getPlatform() == 'Android') {
          this.method = 'MobileRaw';
        } else {
          this.method = 'MobileNDEF';
        }
      } else if ('NDEFReader' in window) {
        this.method = 'WebNFC';
      } else {
        this.method = 'WebAuthn';
      }
    }
    if (this.method === 'MobileNDEF') {
      this.NFCService = new MobileNDEFService();
    } else if (this.method === 'MobileRaw') {
      this.NFCService = new MobileRawService();
    } else if (this.method === 'WebNFC') {
      this.NFCService = new WebNFCService();
    } else {
      this.NFCService = new WebAuthnService();
    }
  }

  async readTag(): Promise<TagParser> {
    return this.NFCService.executeCommand();
  }

  async burnTag(action: 'new' | 'restore', type: 'soulbound' | 'extractable', privateKey?: string, version?: string): Promise<TagParser> {
    let cmd = '00A10000';
    cmd += (action == 'new') ? '02' : (version == '02' ? '99' : '66'); //data length
    cmd += (action == 'new') ? '01' : '02'; //action
    if (type == 'soulbound')   cmd += '01';
    if (type == 'extractable') cmd += '02';
    if (action === 'restore') {
      cmd += privateKey;
      cmd += (version == '02' ? calculatePublicKeySecp256k1(privateKey as string) : calculatePublicKey(privateKey as string));
    }
    return this.NFCService.executeCommand(cmd);
  }

  async signData(data: string): Promise<TagParser> {
    let cmd = '00A20000' + intToHexString(data.length / 2);
    cmd += data;
    return this.NFCService.executeCommand(cmd);
  }

  async formatTag(): Promise<TagParser> {
    let cmd = '00A30000';
    return this.NFCService.executeCommand(cmd);
  }

  async lockTag(): Promise<TagParser> {
    let cmd = '00A40000';
    return this.NFCService.executeCommand(cmd);
  }

  async pinLock(pin: string): Promise<TagParser> {
    let cmd = '00A5000004';
    cmd += pin;
    return this.NFCService.executeCommand(cmd);
  }

  async pinUnlock(pin: string): Promise<TagParser> {
    let cmd = '00A6000004';
    cmd += pin;
    return this.NFCService.executeCommand(cmd);
  }

  async setPolicyId(policyId: string): Promise<TagParser> {
    let cmd = '00A700001C';
    cmd += policyId;
    return this.NFCService.executeCommand(cmd);
  }

  async executeRawCommand(command?: string) {
    return this.NFCService.executeCommand(command);
  }

  cancel() {
    this.NFCService.cancel();
  }
}