import { Module } from '@nestjs/common';
import { MeasuresService } from './measures.service';
import { MeasuresController } from './measures.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { EnvModule } from 'src/env/env.module';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { FileModule } from 'src/file/file.module';
import { FileUtil } from 'src/file/file.util';

@Module({
  imports: [
    PrismaModule,
    EnvModule,
    MulterModule.registerAsync({
      imports: [FileModule],
      useFactory: (fileUtil: FileUtil) => ({
        fileFilter: fileUtil.imageFileFilter,
        storage: diskStorage({
          destination: 'uploads',
          filename: fileUtil.editFileName,
        }),
      }),
      inject: [FileUtil],
    }),
  ],

  providers: [MeasuresService],
  controllers: [MeasuresController],
})
export class MeasuresModule {}
