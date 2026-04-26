import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { VehiculeModule } from './infrastructure/modules/vehicule.module';
import { FileUploadModule } from './infrastructure/modules/file-upload.module';

@Module({
  imports: [VehiculeModule, FileUploadModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
