import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

export interface R2UploadConfig {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
}

export interface UploadRequest {
  key: string;
  body: Buffer;
  contentType: string;
}

export class R2ImageUploader {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(config: R2UploadConfig) {
    this.bucket = config.bucket;
    this.client = new S3Client({
      region: "auto",
      endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }

  async upload(request: UploadRequest): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: request.key,
        Body: request.body,
        ContentType: request.contentType,
        CacheControl: "public, max-age=31536000, immutable",
      }),
    );
  }

  static fromEnv(env: NodeJS.ProcessEnv): R2ImageUploader {
    const required = [
      "R2_ACCOUNT_ID",
      "R2_ACCESS_KEY_ID",
      "R2_SECRET_ACCESS_KEY",
      "R2_BUCKET_NAME",
    ] as const;
    for (const key of required) {
      if (!env[key] || env[key]?.trim() === "") {
        throw new Error(`Missing required environment variable: ${key}`);
      }
    }
    return new R2ImageUploader({
      accountId: env.R2_ACCOUNT_ID!,
      accessKeyId: env.R2_ACCESS_KEY_ID!,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY!,
      bucket: env.R2_BUCKET_NAME!,
    });
  }
}
