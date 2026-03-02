// frontend/src/utils/encryption.js
import CryptoJS from 'crypto-js';

export async function encryptFile(file, password) {
  const arrayBuffer = await file.arrayBuffer();
  const wordArray = CryptoJS.lib.WordArray.create(arrayBuffer);
  const encrypted = CryptoJS.AES.encrypt(wordArray, password).toString();
  return new Blob([encrypted]);
}

export async function decryptFile(encryptedBlob, password) {
  const reader = new FileReader();
  const text = await new Promise(resolve => {
    reader.onload = () => resolve(reader.result);
    reader.readAsText(encryptedBlob);
  });
  const decrypted = CryptoJS.AES.decrypt(text, password);
  return new Blob([decrypted.toString(CryptoJS.enc.Utf8)]);
}
