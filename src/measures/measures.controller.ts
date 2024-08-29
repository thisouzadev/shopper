import {
  Controller,
  Post,
  UseInterceptors,
  HttpCode,
  Body,
  HttpStatus,
  UploadedFiles,
  Patch,
  Get,
  Param,
  Query,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { MeasuresService } from './measures.service';
import { CreateMeasureDto } from './dto/create-measure.dto';
import { ConfirmMeasureDto } from './dto/confirm-measure.dto';

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

  @Patch('confirm')
  @HttpCode(HttpStatus.OK)
  async confirmMeasure(
    @Body() body: ConfirmMeasureDto,
  ): Promise<{ success: boolean }> {
    const { measure_uuid, confirmed_value } = body;
    return this.measuresService.confirmMeasure(measure_uuid, confirmed_value);
  }

  @Get(':customerCode/list')
  @HttpCode(HttpStatus.OK)
  async getMeasures(
    @Param('customerCode') customerCode: string,
    @Query('measure_type') measureType?: string,
  ) {
    const measures = await this.measuresService.getMeasuresByCustomer(
      customerCode,
      measureType,
    );

    return {
      customer_code: customerCode,
      measures: measures.map((measure) => ({
        measure_uuid: measure.id,
        measure_datetime: measure.measureDatetime,
        measure_type: measure.measureType,
        has_confirmed: measure.hasConfirmed,
        image_url: measure.imageUrl,
      })),
    };
  }
}
