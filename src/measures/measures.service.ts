import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EnvService } from 'src/env/env.service';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as fs from 'fs';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class MeasuresService {
  private genAI: any;
  private geminiPro: any;
  private geminiProVision: any;

  constructor(
    private readonly config: EnvService,
    private prisma: PrismaService,
  ) {
    this.genAI = new GoogleGenerativeAI(this.config.get('GEMINI_API_KEY'));
    this.geminiPro = this.genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
    this.geminiProVision = this.genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
    });
  }

  async getPromoptResponseWithImages(
    prompt: string,
    images: Array<Express.Multer.File>,
    customerCode: string,
    measureDatetime: string,
    measureType: string,
  ) {
    if (!images || !customerCode || !measureDatetime || !measureType) {
      throw new BadRequestException({
        error_code: 'INVALID_DATA',
        error_description:
          'Os dados fornecidos no corpo da requisição são inválidos',
      });
    }

    const currentMonthStart = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1,
    );
    const currentMonthEnd = new Date(
      new Date().getFullYear(),
      new Date().getMonth() + 1,
      0,
    );

    const existingMeasure = await this.prisma.measure.findFirst({
      where: {
        customerCode,
        measureType,
        measureDatetime: {
          gte: currentMonthStart,
          lte: currentMonthEnd,
        },
      },
    });

    if (existingMeasure) {
      throw new ConflictException({
        error_code: 'DOUBLE_REPORT',
        error_description: 'Leitura do mês já realizada',
      });
    }
    const imageParts = [];
    const imageUrls = [];

    for (const image of images) {
      imageParts.push(this.fileToGenerativePart(image.path, image.mimetype));

      const imageUrl = `http://localhost:3333/uploads/${image.filename}`;
      imageUrls.push(imageUrl);
    }

    const result = await this.geminiProVision.generateContent([
      prompt,
      ...imageParts,
    ]);

    const response = await result.response;
    const text = await response.text();
    console.log(text);
    const measureValue = Number(text);

    const measure = await this.prisma.measure.create({
      data: {
        customerCode,
        measureDatetime: new Date(measureDatetime),
        measureType,
        measureValue,
        imageUrl: imageUrls.join(', '),
      },
    });

    console.log('Measure saved:', measure);

    return {
      image_url: imageUrls.join(', '),
      measure_value: measure.measureValue,
      measure_uuid: measure.id,
    };
  }

  fileToGenerativePart(path: string, mimeType: string) {
    return {
      inlineData: {
        data: Buffer.from(fs.readFileSync(path)).toString('base64'),
        mimeType,
      },
    };
  }

  async confirmMeasure(
    measure_uuid: string,
    confirmed_value: number,
  ): Promise<{ success: boolean }> {
    if (!measure_uuid || typeof confirmed_value !== 'number') {
      throw new BadRequestException({
        error_code: 'INVALID_DATA',
        error_description:
          'Dados fornecidos no corpo da requisição são inválidos',
      });
    }

    const measure = await this.prisma.measure.findUnique({
      where: { id: measure_uuid },
    });

    if (!measure) {
      throw new NotFoundException({
        error_code: 'MEASURE_NOT_FOUND',
        error_description: 'Leitura não encontrada',
      });
    }

    if (measure.hasConfirmed) {
      throw new ConflictException({
        error_code: 'CONFIRMATION_DUPLICATE',
        error_description: 'Leitura já confirmada',
      });
    }

    await this.prisma.measure.update({
      where: { id: measure_uuid },
      data: {
        measureValue: confirmed_value,
        hasConfirmed: true,
      },
    });

    return { success: true };
  }

  async getMeasuresByCustomer(customerCode: string, measureType?: string) {
    if (measureType && !['WATER', 'GAS'].includes(measureType.toUpperCase())) {
      throw new BadRequestException({
        error_code: 'INVALID_TYPE',
        error_description: 'Tipo de medição não permitida',
      });
    }

    const filter = {
      customerCode,
      ...(measureType ? { measureType: measureType.toUpperCase() } : {}),
    };

    const measures = await this.prisma.measure.findMany({
      where: filter,
    });

    if (measures.length === 0) {
      throw new NotFoundException({
        error_code: 'MEASURES_NOT_FOUND',
        error_description: 'Nenhuma leitura encontrada',
      });
    }

    return measures;
  }
}
