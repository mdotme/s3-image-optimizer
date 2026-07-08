export interface MinioEventRecord {
  eventVersion: string;
  eventSource: string;
  awsRegion: string;
  eventTime: string;
  eventName: string;
  userIdentity: {
    principalId: string;
  };
  requestParameters: {
    principalId: string;
    region: string;
    sourceIPAddress: string;
  };
  responseElements: {
    "x-amz-id-2": string;
    "x-amz-request-id": string;
    "x-minio-deployment-id"?: string;
    "x-minio-origin-endpoint"?: string;
  };
  s3: {
    s3SchemaVersion: string;
    configurationId: string;
    bucket: {
      name: string;
      ownerIdentity: {
        principalId: string;
      };
      arn: string;
    };

    object: {
      /*
       * The URL-encoded object key (e.g., "images/photo.jpg")
       */
      key: string;
      /*
       * File size in bytes
       */
      size: number;
      /*
       * MD5 Checksum / unique file hash
       */
      eTag: string;
      contentType: string;
      sequencer: string;

      userMetadata?: {
        "X-Amz-Meta-Optimize-Image"?: string;
        "X-Amz-Meta-Quality"?: string;
        "X-Amz-Meta-Width"?: string;
        "X-Amz-Meta-Height"?: string;
        "X-Amz-Meta-Output-Object-Key"?: string;
        "X-Amz-Meta-Filter"?: Bun.Image.Filter;
        [key: string]: string | undefined;
      };
    };
  };
  source: {
    host: string;
    port: string;
    userAgent: string;
  };
}

export interface MinioEvent {
  EventName: string;
  Key: string;
  Records: MinioEventRecord[];
}
