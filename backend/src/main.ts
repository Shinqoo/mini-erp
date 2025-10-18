import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import fastifyRawBody from 'fastify-raw-body';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );

  // Enable raw body for Stripe webhooks
  await app.getHttpAdapter().getInstance().register(fastifyRawBody, {
    field: 'rawBody',           // add raw body buffer to req.rawBody
    global: false,              // only for selected routes
    routes: ['/payments/webhook'],
  });

  app.enableCors({
    origin: ['http://localhost:8080'], // frontend origin
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true, // if you ever use cookies/auth headers
  });

  await app.listen(3000);
  console.log('🚀 Server running on http://localhost:3000');
}
bootstrap();
