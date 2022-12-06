import shortId from 'short-uuid';
import { dateYMD, xAmzDate } from './Date';
import { IConfig, ListFileErrorResponse, ListFileResponse, UploadResponse } from './types';
import { throwUploadError } from './ErrorThrower';
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
    throwUploadError(this.config, file);
    let fileExtension: string = '';
    const fd = new FormData();

    if (file.name) {
      fileExtension = file.name.split('.').pop() || '';
    }

    if (!fileExtension && file.type != null) {
      fileExtension = file.type.split('/').pop() || '';
    }

    const fileName = `${newFileName || shortId.generate()}${fileExtension && '.' + fileExtension}`;
    // remove duplicate forward slashes
    const dirName = (this.config.dirName ? this.config.dirName + '/' : '').replace(/([^:]\/)\/+/g, '$1');
    const key = `${dirName}${fileName}`;
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
      key,
      location: `${url}/${key}`,
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

  public async listFiles() {
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
    const url: string = GetUrl(this.config);

    try {
      const req = await s3
        .listObjects({
          Bucket: this.config.bucketName,
        })
        .promise();

      if (req.$response.error) {
        return Promise.reject<ListFileErrorResponse>({
          err: req.$response.error.name,
          errMessage: req.$response.error.message,
          data: req.$response.error,
        });
      }

      if (!req.$response.data) {
        return Promise.reject<ListFileErrorResponse>({
          err: 'Something went wrong!',
          errMessage: 'Unknown error occured. Please try again',
          data: null,
        });
      }

      return Promise.resolve<ListFileResponse>({
        message: 'Objects listed succesfully',
        data: {
          ...req.$response.data,
          Contents: req.$response.data.Contents?.map((e) => ({ ...e, publicUrl: `${url}/${e.Key}` })),
        },
      });
    } catch (err) {
      return Promise.reject<ListFileErrorResponse>({
        err: 'Something went wrong!',
        errMessage: 'Unknown error occured. Please try again',
        data: err,
      });
    }
  }
}

export default ReactS3Client;
