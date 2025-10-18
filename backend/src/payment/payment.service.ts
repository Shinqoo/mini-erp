import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import Stripe from 'stripe';

@Injectable()
export class PaymentService {
  private readonly stripe: Stripe;
  private readonly webhookSecret: string;
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsGateway: NotificationsGateway,
  ) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2025-09-30.clover',
    });
    this.webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
  }

  // ✅ Unified event constructor
  constructStripeEvent(rawBody: Buffer, sig: string): Stripe.Event {
    return this.stripe.webhooks.constructEvent(rawBody, sig, this.webhookSecret);
  }

  // async createPaymentIntent(orderId: number, userId: number) {
  //   const order = await this.prisma.order.findUnique({ where: { id: orderId } });
  //   if (!order) throw new NotFoundException('Order not found');
  //   if (order.userId !== userId)
  //     throw new BadRequestException('Unauthorized order access');

  //   const paymentIntent = await this.stripe.paymentIntents.create({
  //     amount: Math.round(Number(order.totalAmount) * 100),
  //     currency: 'usd',
  //     metadata: { orderId: order.id.toString(), userId: userId.toString() },
  //     automatic_payment_methods: { enabled: true },
  //   });

  //   await this.prisma.order.update({
  //     where: { id: orderId },
  //     data: { paymentIntentId: paymentIntent.id },
  //   });

  //   return { clientSecret: paymentIntent.client_secret };
  // }

  async createPaymentIntent(orderId: number, userId: number) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new BadRequestException('Order not found');
    }

    const amountInCents = Number(order.totalAmount) * 100;

    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: Math.round(amountInCents),
      currency: 'usd',
      metadata: { orderId: order.id.toString() },
    });

    // 🧩 NEW: Save the Payment record in DB
    await this.prisma.payment.create({
      data: {
        orderId: order.id,
        amount: order.totalAmount,
        method: 'STRIPE', // or PaymentMethod.STRIPE if using enum
        status: 'PENDING', // PaymentStatus.PENDING
        paymentIntentId: paymentIntent.id,
      },
    });

    this.logger.log(`💾 Payment created for order ${order.id} with intent ${paymentIntent.id}`);

    return { clientSecret: paymentIntent.client_secret };
  }

  async handleStripeEvent(event: Stripe.Event) {
    try {
      const pi = event.data.object as Stripe.PaymentIntent;
      const orderId = Number(pi.metadata?.orderId);

      if (!orderId || isNaN(orderId)) {
        this.logger.warn(`⚠️ Stripe event ${event.type} missing valid orderId in metadata`);
        return { received: true };
      }

      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.markOrderPaid(orderId, pi.id);
          break;
        case 'payment_intent.payment_failed':
          await this.markOrderFailed(orderId, pi.id);
          break;
        default:
          this.logger.log(`Unhandled Stripe event type: ${event.type}`);
      }

      return { received: true };
    } catch (err) {
      this.logger.error('Error processing webhook', err);
      return { received: true };
    }
  }

  private async markOrderPaid(orderId: number, paymentIntentId: string) {
    if (!orderId || isNaN(orderId)) {
      this.logger.error(`❌ Cannot mark order as PAID — invalid orderId: ${orderId}`);
      return;
    }

    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      this.logger.warn(`⚠️ No order found for id=${orderId}`);
      return;
    }

    await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'PAID',
        paymentStatus: 'PAID',
        completedDate: new Date(),
        paymentIntentId,
      },
    });

    this.notificationsGateway.notifyPaymentUpdate(orderId, 'PAID');
    this.logger.log(`✅ Order ${orderId} marked as PAID and notification sent`);
  }

  private async markOrderFailed(orderId: number, paymentIntentId: string) {
    await this.prisma.order.updateMany({
      where: { id: orderId },
      data: { status: 'FAILED', paymentStatus: 'FAILED' },
    });
    this.notificationsGateway.notifyPaymentUpdate(orderId, 'FAILED');
    this.logger.log(`❌ Order ${orderId} marked as FAILED`);
  }
}
