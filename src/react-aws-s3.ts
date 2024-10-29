import shortId from 'short-uuid';
import { throwUploadError } from './ErrorThrower';
import GetUrl from './Url';
import { S3, PutObjectCommand, DeleteObjectCommand, ListObjectsCommand, S3Client } from '@aws-sdk/client-s3';
import {
  DeleteFileErrorResponse,
  DeleteFileResponse,
  IConfig,
  ListFilesErrorResponse,
  ListFilesResponse,
  UploadFileErrorResponse,
  UploadFileResponse,
} from './types';

class ReactS3Client {
  private config: IConfig;
  private s3Client: S3Client;

  constructor(config: IConfig) {
    this.config = config;
    this.s3Client = new S3Client({
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }

  public async uploadFile(file: File, newFileName?: string): Promise<UploadFileResponse | UploadFileErrorResponse> {
    throwUploadError(this.config, file);
    let fileExtension: string = '';

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

    try {
      const command = new PutObjectCommand({
        Bucket: this.config.bucketName,
        Key: key,
        Body: file,
        ACL: 'public-read',
        ContentType: file.type,
      });

      const response = await this.s3Client.send(command);

      return Promise.resolve({
        bucket: this.config.bucketName,
        key,
        location: `${url}/${key}`,
        status: response.$metadata.httpStatusCode || 400,
      });
    } catch (err) {
      return Promise.reject(err);
    }
  }

  public async deleteFile(key: string): Promise<DeleteFileResponse | DeleteFileErrorResponse> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.config.bucketName,
        Key: key,
      });

      const response = await this.s3Client.send(command);
      const statusCode = response.$metadata.httpStatusCode || 400;

      return Promise.resolve<DeleteFileResponse>({
        ok: statusCode >= 200 && statusCode < 300,
        message: 'File deleted',
        fileName: key,
        status: statusCode,
      });
    } catch (err) {
      return Promise.reject(err);
    }
  }

  public async listFiles(): Promise<ListFilesResponse | ListFilesErrorResponse> {
    const url: string = GetUrl(this.config);

    try {
      const command = new ListObjectsCommand({
        Bucket: this.config.bucketName,
      });

      const response = await this.s3Client.send(command);

      if (!response || response.$metadata.httpStatusCode !== 200) {
        return Promise.reject<ListFilesErrorResponse>({
          err: 'Something went wrong!',
          errMessage: 'Unknown error occured. Please try again',
          data: null,
        });
      }

      return Promise.resolve<ListFilesResponse>({
        message: 'Objects listed succesfully',
        data: {
          ...response,
          Contents: response.Contents?.map((e) => ({ ...e, publicUrl: `${url}/${e.Key}` })) || [],
        },
      });
    } catch (err) {
      return Promise.reject<ListFilesErrorResponse>({
        err: 'Something went wrong!',
        errMessage: 'Unknown error occured. Please try again',
        data: err,
      });
    }
  }
}

export default ReactS3Client;
