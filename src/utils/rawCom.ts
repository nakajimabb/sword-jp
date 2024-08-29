import { DictIndex, decodeTextFromUint8Array } from './Sword';

export function getRawEntry(uint8Array: Uint8Array, dictIndexes: DictIndex[], encoding: string) {
  const rawTexts: Map<string, string> = new Map();
  dictIndexes.forEach((dictIndex) => {
    const startPos = dictIndex.start;
    const endPos = startPos + dictIndex.length;
    const u8arr = uint8Array.slice(startPos, endPos);
    const rawText = decodeTextFromUint8Array(u8arr, encoding);
    rawTexts.set(dictIndex.osisRef, rawText);
  });

  return rawTexts;
}
