import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  HttpCode,
  Body,
  HttpStatus,
  UploadedFiles,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { MeasuresService } from './measures.service';
import { PromptBody, PromptBodyWithImages } from './dto/prompt.dto';

@Controller()
export class MeasuresController {
  constructor(private readonly measuresService: MeasuresService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo foi enviado');
    }

    return {
      message: 'Arquivo enviado e processado com sucesso',
      fileName: file.originalname,
    };
  }

  @Post('prompt')
  @HttpCode(HttpStatus.OK)
  getPromptResponse(@Body() body: PromptBody) {
    return this.measuresService.getPromptResponse(body.prompt);
  }

  @UseInterceptors(FilesInterceptor('images', 10))
  @HttpCode(HttpStatus.OK)
  @Post('prompt-with-image')
  getPromoptResponseWithImages(
    @UploadedFiles() images: Array<Express.Multer.File>,
    @Body() body: PromptBodyWithImages,
  ) {
    console.log(images);
    return this.measuresService.getPromoptResponseWithImages(
      body.prompt,
      images,
    );
  }
}
