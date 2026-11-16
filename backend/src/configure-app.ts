import { INestApplication, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter';

export const FRONTEND_URL_PADRAO = 'http://localhost:3000';

/**
 * Configuração transversal da aplicação HTTP. Usada tanto pelo `main.ts`
 * quanto pelos testes e2e, para que os testes exercitem exatamente os mesmos
 * pipes, filtros e cabeçalhos que rodam em produção.
 */
export function configureApp(app: INestApplication): INestApplication {
  app.use(
    helmet({
      // A API também roda em HTTP puro (desenvolvimento, Docker Compose em rede
      // local). Com `upgrade-insecure-requests`, o navegador tentaria buscar os
      // assets do Swagger UI via HTTPS e a página /docs quebraria.
      contentSecurityPolicy: {
        directives: { upgradeInsecureRequests: null },
      },
    }),
  );
  app.enableCors({ origin: process.env.FRONTEND_URL || FRONTEND_URL_PADRAO });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new PrismaExceptionFilter());
  app.enableShutdownHooks();
  return app;
}

/** Documentação OpenAPI servida em `/docs` (JSON em `/docs-json`). */
export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('NAVE API')
    .setDescription(
      'API do Sistema NAVE: triagem, encaminhamentos, agenda, prontuários ' +
        'com controle de visibilidade, doações e bazares de uma ONG de apoio ' +
        'a mulheres e crianças em situação de violência familiar. ' +
        'Autentique-se em POST /auth/login e use o token no botão "Authorize".',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const documento = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, documento);
}
