# react-aws-s3-typescript

Open source npm package to upload your files into AWS S3 Bucket directly using react(typescript template)

<a href="https://www.buymeacoffee.com/nimper" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 60px !important;width: 217px !important;" ></a>

## Table of Contents

- [Introduction](#introduction)
- [Features](#features)
- [Installing](#installing)
- [Example](#example)
    - [Upload a file to AWS S3 Bucket](#upload-a-file-to-aws-s3-bucket)
    - [Delete a file from AWS S3 Bucket](#delete-a-file-from-aws-s3-bucket)
- [S3 Config](#s3-config)
- [Credits](#credits)
- [License](#license)


## Introduction

Open source npm package to upload your media and other types of files directly into AWS S3 Bucket using react typescript template. You can upload and retrive the public url for the file and delete the files if needed.

You need to have an AWS account to use AWS S3 Bucket. If you already do not have an account, create an account [here](https://console.aws.amazon.com).

Readmore about AWS S3 buket: [https://docs.aws.amazon.com/s3/index.html](https://docs.aws.amazon.com/s3/index.html)

## Features

- Upload files to S3 bucket and retrive the public url
- Delete files from S3 bucket

## Installing

Using npm

```bash
$ npm install react-aws-s3-typescript
```

## Example

### Upload a file to AWS S3 Bucket

You can define a default directory for uploads using the s3Config object

```typescript
    /* AWS S3 config options */
    /* Highly recommended to declare the config object in an external file import it when needed */

    /* s3Config.ts */

    export const s3Config = {
        bucketName:  'bucket-name',
        dirName: 'directory-name',      /* Optional */
        region: 'ap-south-1',
        accessKeyId:'ABCD12EFGH3IJ4KLMNO5',
        secretAccessKey: 'a12bCde3f4+5GhIjKLm6nOpqr7stuVwxy8ZA9bC0',
        s3Url: 'https:/your-aws-s3-bucket-url/'     /* Optional */
    }

    /* End of s3Config.ts */
```

```typescript
    /* AWS S3 Client */
    /* uploadFile.ts */
    import ReactS3Client from 'react-aws-s3-typescript';
    import { s3Config } from './s3Config.ts';

    const uploadFile = async () => {
        /* Import s3 config object and call the constrcutor */
        const s3 = new ReactS3Client(s3Config);

        /* You can use the default directory defined in s3Config object
        * Or you can a define custom directory to upload when calling the
        * constructor using js/ts object destructuring.
        * 
        * const s3 = new ReactS3Client({
        *      ...s3Config,
        *      dirName: 'custom-directory'
        * });
        * 
        */

        const filename = 'filename-to-be-uploaded';     /* Optional */

        /* If you do not specify a file name, file will be uploaded using uuid generated 
        * by short-UUID (https://www.npmjs.com/package/short-uuid)
        */

        try {
            const res = await s3.uploadFile(file, filename);

            console.log(res);
            /*
            * {
            *   Response: {
            *     bucket: "bucket-name",
            *     key: "directory-name/filename-to-be-uploaded",
            *     location: "https:/your-aws-s3-bucket-url/directory-name/filename-to-be-uploaded"
            *   }
            * }
            */
        } catch (exception) {
            console.log(exception);
            /* handle the exception */
        }

    /* End of uploadFile.ts */
```

### List files of a AWS S3 Bucket

```typescript
    /* AWS S3 Client */
    /* listFiles.ts */
    import ReactS3Client from 'react-aws-s3-typescript';
    import { s3Config } from './s3Config.ts';

    const listFiles = async () => {
        /* Import s3 config object and call the constrcutor */
        const s3 = new ReactS3Client(s3Config);

        try {
            const fileList = await s3.listFiles();

            console.log(fileList);
            /*
            * {
            *   Response: {
            *     message: "Objects listed succesfully",
            *     data: {                   // List of Objects
            *       ...                     // Meta data
            *       Contents: []            // Array of objects in the bucket
            *     }
            *   }
            * }
            */
        } catch (exception) {
            console.log(exception);
            /* handle the exception */
        }
    }

    /* End of listFiles.ts */
```

### Delete a file from AWS S3 Bucket

```typescript
    /* AWS S3 Client */
    /* deleteFile.ts */
    import ReactS3Client from 'react-aws-s3-typescript';
    import { s3Config } from './s3Config.ts';

    const deleteFile = async () => {
        /* Import s3 config object and call the constrcutor */
        const s3 = new ReactS3Client(s3Config);

        /* Define the filepath from the root of the bucket to the file to be deleted */
        const filepath = 'directory-name/filename-to-be-deleted';

        try {
            await s3.deleteFile(filepath);

            console.log('File deleted');
        } catch (exception) {
            console.log(exception);
            /* handle the exception */
        }
    }

    /* End of deleteFile.ts */
```

__Important :__ Add `public-read` Canned ACL to the bucket to grant the public read access for files.

Read more: [https://docs.aws.amazon.com/AmazonS3/latest/dev/acl-overview.html#canned-acl](https://docs.aws.amazon.com/AmazonS3/latest/dev/acl-overview.html#canned-acl)

## S3 Config

These are the available config options for calling the S3 constructor `bucketName`, `region`, `accessKeyId` and `secretAccessKey` are required. Upload will default to __root path__, if `dirName` is not specified.

## Credits

This `react-aws-s3-typescript` package is heavily inspired by the [`react-aws-s3`](https://www.npmjs.com/package/react-aws-s3) package provided by [developer-amit](https://www.npmjs.com/~developer-amit).

## License

Released under [__MIT license__](https://opensource.org/licenses/MIT).

[Back to top](#table-of-contents)


