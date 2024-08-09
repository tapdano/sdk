import nacl from 'tweetnacl';

export function hexStringToArrayBuffer(hex: string): Uint8Array {
  return new Uint8Array(hex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
}

export function arrayBufferToHex(arrayBuffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(arrayBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export function intToHexString(num: Number) {
  return num.toString(16).padStart(2, '0').toUpperCase();
}

export function calculatePublicKey(privateKey: string): string {
  const privateKeyBytes = hexStringToArrayBuffer(privateKey);
  const keyPair = nacl.sign.keyPair.fromSeed(privateKeyBytes);
  return Buffer.from(keyPair.publicKey).toString('hex');
}