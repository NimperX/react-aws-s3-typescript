import shortId from 'short-uuid';
import { dateYMD, xAmzDate } from './Date';
import { IConfig, DeleteResponse, UploadResponse } from './types';
import { throwError } from './ErrorThrower';
import GetUrl from './Url';
import Policy from './Policy';
import Signature from './Signature';
import AWS from 'aws-sdk';

class ReactS3Client {
  private config: IConfig;
  constructor(config: IConfig) {
    this.config = config;
  }
  public async uploadFile(file: File, newFileName?: string): Promise<UploadResponse> {
    throwError(this.config, file);
    let fileExtension: string;
    const fd = new FormData();

    if (file.type == null) {
      fileExtension = '';
    } else {
      fileExtension = file.type.split('/')[1];
    }

    const fileName = `${newFileName || shortId.generate()}.${fileExtension}`;
    const key = `${this.config.dirName ? this.config.dirName + '/' : ''}${fileName}`;
    const url: string = GetUrl(this.config);
    fd.append('key', key);
    fd.append('acl', 'public-read');
    fd.append('Content-Type', file.type);
    fd.append('x-amz-meta-uuid', '14365123651274');
    fd.append('x-amz-server-side-encryption', 'AES256');
    fd.append('X-Amz-Credential', `${this.config.accessKeyId}/${dateYMD}/${this.config.region}/s3/aws4_request`);
    fd.append('X-Amz-Algorithm', 'AWS4-HMAC-SHA256');
    fd.append('X-Amz-Date', xAmzDate);
    fd.append('x-amz-meta-tag', '');
    fd.append('Policy', Policy.getPolicy(this.config));
    fd.append('X-Amz-Signature', Signature.getSignature(this.config, dateYMD, Policy.getPolicy(this.config)));
    fd.append('file', file);

    const data = await fetch(url, { method: 'post', body: fd });
    if (!data.ok) return Promise.reject(data);
    return Promise.resolve({
      bucket: this.config.bucketName,
      key: `${this.config.dirName ? this.config.dirName + '/' : ''}${fileName}`,
      location: `${url}/${this.config.dirName ? this.config.dirName + '/' : ''}${fileName}`,
      status: data.status,
    });
  }

  public async deleteFile(key: string) {
    const awsConfig = (({ region, accessKeyId, secretAccessKey }) => ({ region, accessKeyId, secretAccessKey }))(
      this.config,
    );
    AWS.config.update(awsConfig);

    const s3 = new AWS.S3({
      apiVersion: '2006-03-01',
      params: {
        Bucket: this.config.bucketName,
      },
    });

    s3.deleteObject(
      {
        Bucket: this.config.bucketName,
        Key: key,
      },
      (err, data) => {
        if (err) return Promise.reject(err);

        return Promise.resolve({
          message: 'File deleted',
          key,
          data,
        });
      },
    );
  }
}

export default ReactS3Client;
