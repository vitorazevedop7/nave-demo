import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configureApp, setupSwagger } from './configure-app';

const PORTA_PADRAO = 3001;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  configureApp(app);
  setupSwagger(app);

  const porta = Number(process.env.PORT) || PORTA_PADRAO;
  await app.listen(porta);
  Logger.log(
    `API ouvindo na porta ${porta} — documentação em /docs`,
    'Bootstrap',
  );
}

void bootstrap();
