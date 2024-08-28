import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { EnvService } from './env/env.service';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as express from 'express';
async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableCors({
    origin: '*',
    methods: 'GET, HEAD, PUT, PATCH, POST, DELETE',
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });
  const config = new DocumentBuilder()
    .setTitle('shopper')
    .setDescription('API documentation')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  app.use('/uploads', express.static(join(__dirname, '..', 'uploads')));
  const configService = app.get(EnvService);
  const port = configService.get('PORT');
  await app.listen(port);
  console.log(`Server running on port ${port}`);
}
bootstrap();
