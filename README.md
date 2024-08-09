# TapDano

TapDano is an npm package designed for both web and mobile (Ionic/Cordova) environments, enabling interaction with smartcards that utilize the TapDano firmware.

The firmware (JavaCard Applet) can be found at [TapDano Applet](https://github.com/tapdano/applet).

This package supports multiple communication methods, including **WebNFC** for Android devices and **WebAuthn** for iOS and desktop environments with NFC USB readers.

## Installation

To install the TapDano package, use npm:

```bash
npm i tapdano
```

## Usage

Here's a basic example of how to use the TapDano package:

```javascript
import { TapDanoService } from 'tapdano';

const tapDanoService = new TapDanoService();

const tag = await tapDanoService.readTag();
```

## Available Methods

### `constructor(config?: TapDanoServiceConfig)`
- **Parameters**: 
  - `config.method` (optional): Specify the communication method. Accepts `'auto'`, `'WebNFC'`, or `'WebAuthn'`.

### `readTag(): Promise<TagParser>`
Reads data from the smartcard.
- **Returns**: `Promise<TagParser>`

### `burnTag(action: 'new' | 'restore', type: 'soulbound' | 'extractable', privateKey?: string): Promise<TagParser>`
Burns a new Tag the smartcard.
- **Parameters**:
  - `action`: Specify the action, either `'new'` or `'restore'`.
  - `type`: Specify the type, either `'soulbound'` or `'extractable'`.
  - `privateKey` (optional): Provide a private key when restoring.
- **Returns**: `Promise<TagParser>`

### `signData(data: string): Promise<TagParser>`
Signs data using the smartcard.
- **Parameters**:
  - `data`: Hexadecimal string of data to be signed.
- **Returns**: `Promise<TagParser>`

### `formatTag(): Promise<TagParser>`
Reset the smartcard.
- **Returns**: `Promise<TagParser>`

### `lockTag(): Promise<TagParser>`
Locks the smartcard. It is used to permanently lock the private key extraction from an "extractable" Tag.
- **Returns**: `Promise<TagParser>`

### `pinLock(pin: string): Promise<TagParser>`
Temporarily locks the smartcard with a PIN.
- **Parameters**:
  - `pin`: A 4-character PIN string.
- **Returns**: `Promise<TagParser>`

### `pinUnlock(pin: string): Promise<TagParser>`
Unlocks the smartcard using a PIN.
- **Parameters**:
  - `pin`: A 4-character PIN string.
- **Returns**: `Promise<TagParser>`

### `setPolicyId(policyId: string): Promise<TagParser>`
Sets a policy ID on the smartcard. Used after minting a Soulbound NFT, to link the PolicyId to the Tag and facilitate loading the Asset when reading the smartcard.
- **Parameters**:
  - `policyId`: A 28-character hexadecimal string representing the policy ID.
- **Returns**: `Promise<TagParser>`

### `executeRawCommand(command?: string): Promise<TagParser>`
Executes a raw APDU command on the smartcard.
- **Parameters**:
  - `command` (optional): The raw APDU command to be sent.
- **Returns**: `Promise<TagParser>`

### `cancel()`
Cancels any ongoing operation on the smartcard.

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.