export enum UploadType {
  SINGLE = 'single',
  MULTIPLE = 'multiple',
}

export enum AccessLevel {
  PRIVATE = 'private',
  PUBLIC = 'public',
}


export enum UploadPath {
  CATEGORY = 'category',
  PRODUCT='product'
}

export interface UploadFilesOptions {
  type: UploadType;
//   accessLevel: AccessLevel;
  uploadPath: UploadPath;
  maxFileSize: number;
}
