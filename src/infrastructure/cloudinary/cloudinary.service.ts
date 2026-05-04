import { Inject, Injectable } from '@nestjs/common';
import { UploadApiResponse, v2 as CloudinaryType } from 'cloudinary';
import { CLOUDINARY } from './cloudinary.provider';
import * as streamifier from 'streamifier';

@Injectable()
export class CloudinaryService {
  constructor(
    @Inject(CLOUDINARY) private readonly cloudinary: typeof CloudinaryType,
  ) {}

  uploadFile(
    file: Express.Multer.File,
    folder: string,
  ): Promise<UploadApiResponse> {
    const isImage = file.mimetype.startsWith('image/');
    return new Promise((resolve, reject) => {
      const uploadStream = this.cloudinary.uploader.upload_stream(
        {
          folder: folder,
          resource_type: isImage ? 'image' : 'raw',
        },
        (error, result) => {
          if (error) return reject(new Error(error.message));
          if (!result) return reject(new Error('Upload échoué'));
          resolve(result);
        },
      );
      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
  }
}
