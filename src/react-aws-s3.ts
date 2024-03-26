import shortId from 'short-uuid';
import { IConfig, ListFileErrorResponse, ListFileResponse, UploadResponse } from './types';
import { throwUploadError } from './ErrorThrower';
import GetUrl from './Url';
import { S3Client, PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command   } from "@aws-sdk/client-s3"

class ReactS3Client {
  private config: IConfig;
  private client: S3Client;
  constructor(config: IConfig) {
    this.config = config;
    this.client = new S3Client(config);
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
    
    const command = new PutObjectCommand({
      Bucket: this.config.bucketName,
      Key: key,
      ACL: 'public-read',
      ContentType: file.type,
      ServerSideEncryption: 'AES256'
    })

    try {
      await this.client.send(command);
      return Promise.resolve({
        bucket: this.config.bucketName,
        key,
        location: `${url}/${key}`
      });
    } catch (err) {
      return Promise.reject(err);
    }
  }

  public async deleteFile(key: string) {
    const command = new DeleteObjectCommand({
      Bucket: this.config.bucketName,
      Key: key
    })

    try {
      await this.client.send(command);
      return Promise.resolve({
        message: 'File deleted',
        key
      });
    } catch (err) {
      return Promise.reject(err);
    }
  }

  public async listFiles() {
    const url: string = GetUrl(this.config);
    const command = new ListObjectsV2Command({
      Bucket: this.config.bucketName
    })

    try {
      const response = await this.client.send(command);

      return Promise.resolve<ListFileResponse>({
        message: 'Objects listed succesfully',
        data: {
          ...response,
          Contents: response.Contents?.map((e) => ({ ...e, publicUrl: `${url}/${e.Key}` })),
        },
      });
    } catch (err: any) {
      return Promise.reject<ListFileErrorResponse>({
        err: err.message || 'Something went wrong!',
        errMessage: err.message || 'Unknown error occured. Please try again',
        data: err,
      });
    }
  }
}

export default ReactS3Client;
