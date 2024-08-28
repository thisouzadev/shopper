import {
  Controller,
  Post,
  UseInterceptors,
  HttpCode,
  Body,
  HttpStatus,
  UploadedFiles,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { MeasuresService } from './measures.service';
import { CreateMeasureDto } from './dto/create-measure.dto';

@Controller()
export class MeasuresController {
  constructor(private readonly measuresService: MeasuresService) {}

  @UseInterceptors(FilesInterceptor('images', 10))
  @HttpCode(HttpStatus.OK)
  @Post('upload')
  getPromoptResponseWithImages(
    @UploadedFiles() images: Array<Express.Multer.File>,
    @Body() body: CreateMeasureDto,
  ) {
    console.log(images);
    const prompt = 'The numerical value only';
    return this.measuresService.getPromoptResponseWithImages(
      prompt,
      images,
      body.customer_code,
      body.measure_datetime,
      body.measure_type,
    );
  }
}
