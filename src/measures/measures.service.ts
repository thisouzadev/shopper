import {
  BadRequestException,
  ConflictException,
  Injectable,
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
}
