import { WebNFCService } from './WebNFCService';
import { WebAuthnService } from './WebAuthnService';
import { TagParser } from '../utils/TagParser';
import { calculatePublicKey, intToHexString } from '../utils/Helper';

type CommunicationMethod = 'auto' | 'WebNFC' | 'WebAuthn';

interface TapDanoServiceConfig {
  method: CommunicationMethod;
}

export class TapDanoService {
  private method: CommunicationMethod;
  private NFCService: WebAuthnService | WebNFCService;

  constructor(config?: TapDanoServiceConfig) {
    this.method = config?.method || 'auto';
    if (this.method === 'auto') {
      this.method = 'NDEFReader' in window ? 'WebNFC' : 'WebAuthn';
    }
    this.NFCService = this.method === 'WebNFC' ? new WebNFCService() : new WebAuthnService();
  }

  async readTag(): Promise<TagParser> {
    return this.NFCService.executeCommand();
  }

  async burnTag(action: 'new' | 'restore', type: 'soulbound' | 'extractable', privateKey?: string): Promise<TagParser> {
    let cmd = '00A10000';
    cmd += (action == 'new') ? '02' : '66'; //data length
    cmd += (action == 'new') ? '01' : '02'; //action
    if (type == 'soulbound')   cmd += '01';
    if (type == 'extractable') cmd += '02';
    if (action === 'restore') {
      cmd += privateKey;
      cmd += calculatePublicKey(privateKey as string);
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