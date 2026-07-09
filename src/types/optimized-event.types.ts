export interface OptimizedEventPayload {
  eventId: string;
  eventTime: string;
  durationMs: number;
  bucket: string;

  optimizedOptions: {
    quality: number;
    width?: number;
    height?: number;
    filter?:
      | "nearest"
      | "box"
      | "bilinear"
      | "linear" // alias for bilinear (Sharp)
      | "cubic"
      | "mitchell"
      | "lanczos2"
      | "lanczos3"
      | "mks2013"
      | "mks2021";
  };

  inputObject: {
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
    etag: string;
  };

  outputObject: {
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
    etag: string;
  };
}
