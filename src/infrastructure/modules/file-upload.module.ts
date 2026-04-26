import { Module } from '@nestjs/common';
import { CloudinaryProvider } from '../cloudinary/cloudinary.provider';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { FileUploadController } from '../controllers/file-upload.controller';

@Module({
  controllers: [FileUploadController],
  providers: [CloudinaryProvider, CloudinaryService],
  exports: [CloudinaryService],
})
export class FileUploadModule {}
