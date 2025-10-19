import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import Stripe from 'stripe';
import { PaymentStatus, OrderStatus } from '@prisma/client';

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

    await this.prisma.payment.upsert({
      where: { orderId: order.id },
      update: {
        paymentIntentId: paymentIntent.id,
        amount: order.totalAmount,
        status: 'PENDING',
      },
      create: {
        orderId: order.id,
        amount: order.totalAmount,
        method: 'STRIPE',
        status: 'PENDING',
        paymentIntentId: paymentIntent.id,
      },
    });

    this.logger.log(`💾 Payment created for order ${order.id} with intent ${paymentIntent.id}`);

    return { clientSecret: paymentIntent.client_secret };
  }

  async handleStripeEvent(event: Stripe.Event) {
    try {
      const pi = event.data.object as Stripe.PaymentIntent;

      // ✅ Extract and validate orderId from metadata
      const orderId = Number(pi.metadata?.orderId);
      if (!orderId || isNaN(orderId)) {
        this.logger.warn(
          `⚠️ Stripe event ${event.type} is missing a valid orderId in metadata. Metadata: ${JSON.stringify(pi.metadata)}`
        );
        return { received: true };
      }

      this.logger.log(`📦 Stripe Event: ${event.type} for Order #${orderId} (PI: ${pi.id})`);

      switch (event.type) {
        case "payment_intent.succeeded":
          this.logger.log(`💰 PaymentIntent succeeded for Order #${orderId}`);
          await this.markOrderPaid(orderId, pi.id);
          break;

        case "payment_intent.payment_failed":
          this.logger.warn(`❌ PaymentIntent failed for Order #${orderId}`);
          await this.markOrderFailed(orderId, pi.id);
          break;

        case "payment_intent.canceled":
          this.logger.warn(`🚫 PaymentIntent canceled for Order #${orderId}`);
          await this.markOrderFailed(orderId, pi.id);
          break;

        default:
          this.logger.log(`ℹ️ Unhandled Stripe event type: ${event.type}`);
      }

      return { received: true };
    } catch (err: any) {
      this.logger.error(`🔥 Error handling Stripe event: ${err.message}`, err.stack);
      return { received: true };
    }
  }

  private async markOrderPaid(orderId: number, paymentIntentId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      this.logger.warn(`⚠️ No order found for id=${orderId}`);
      return;
    }

    // ✅ Update payment row
    await this.prisma.payment.updateMany({
      where: { orderId },
      data: {
        status: PaymentStatus.PAID,
        updatedAt: new Date(),
      },
    });

    // ✅ Update order row
    await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.COMPLETED, // your order table likely has this enum
        paymentStatus: PaymentStatus.PAID,
        completedDate: new Date(),
      },
    });

    this.notificationsGateway.notifyPaymentUpdate(orderId, 'PAID');
    this.logger.log(`✅ Order ${orderId} marked as COMPLETED (payment succeeded)`);
  }

  private async markOrderFailed(orderId: number, paymentIntentId: string) {
    await this.prisma.payment.updateMany({
      where: { orderId },
      data: {
        status: PaymentStatus.FAILED,
        updatedAt: new Date(),
      },
    });

    await this.prisma.order.updateMany({
      where: { id: orderId },
      data: {
        status: OrderStatus.CANCELLED,
        paymentStatus: PaymentStatus.FAILED,
      },
    });

    this.notificationsGateway.notifyPaymentUpdate(orderId, 'FAILED');
    this.logger.log(`❌ Order ${orderId} marked as CANCELLED (payment failed)`);
  }

}
