import { FastifyRequest, FastifyReply } from 'fastify';

export function rawBodyMiddleware(req: FastifyRequest, reply: FastifyReply, done: () => void) {
  // We only want the raw body for Stripe webhooks
  if (req.url === '/payments/webhook') {
    let data = '';
    req.raw.on('data', (chunk) => {
      data += chunk;
    });
    req.raw.on('end', () => {
      (req as any).rawBody = Buffer.from(data);
      done();
    });
  } else {
    done();
  }
}
