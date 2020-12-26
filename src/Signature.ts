import { IConfig, DateYMD } from './types';
import Crypto from 'crypto-js';

export default class Signature {
  public static getSignature(config: IConfig, date: DateYMD, policyBase64: string): string {
    const getSignatureKey = (key: string, dateStamp: DateYMD, regionName: string): Crypto.lib.WordArray => {
      const kDate: Crypto.lib.WordArray = Crypto.HmacSHA256(dateStamp, 'AWS4' + key);
      const kRegion: Crypto.lib.WordArray = Crypto.HmacSHA256(regionName, kDate);
      const kService: Crypto.lib.WordArray = Crypto.HmacSHA256('s3', kRegion);
      const kSigning: Crypto.lib.WordArray = Crypto.HmacSHA256('aws4_request', kService);
      return kSigning;
    };
    const signature = (policyEncoded: string): string => {
      return Crypto.HmacSHA256(policyEncoded, getSignatureKey(config.secretAccessKey, date, config.region)).toString(
        Crypto.enc.Hex,
      );
    };
    return signature(policyBase64);
  }
}
