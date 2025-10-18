import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { PaymentStatus, RefundStatus } from '@prisma/client';
import Stripe from 'stripe';

@Injectable()
export class RefundService {
  private readonly stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-09-30.clover',
  });
  private readonly logger = new Logger(RefundService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsGateway,
  ) {}

  /**
   * Create a refund in Stripe and record it in the database
   */
  async createRefund(paymentId: number, amount?: number, reason?: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { order: true },
    });

    if (!payment) throw new NotFoundException('Payment not found');
    if (payment.status !== PaymentStatus.PAID) {
      throw new BadRequestException('Only PAID payments can be refunded');
    }

    // Convert refund amount to cents if provided
    const refundAmountCents = amount ? Math.round(amount * 100) : undefined;

    // Create refund in Stripe
    const stripeRefund = await this.stripe.refunds.create({
      payment_intent: payment.paymentIntentId!, // from your schema
      amount: refundAmountCents,
      reason: reason
        ? ('requested_by_customer' as Stripe.RefundCreateParams.Reason)
        : undefined,
    });

    // Record refund in DB
    const refund = await this.prisma.refund.create({
      data: {
        paymentId,
        amount: refundAmountCents ? refundAmountCents / 100 : payment.amount,
        reason,
        providerRefundId: stripeRefund.id,
        status: RefundStatus.PENDING,
      },
    });

    this.logger.log(`💸 Refund created for payment ${paymentId}, refund ID ${refund.id}`);
    this.notifications.server.emit('refundCreated', refund);

    return refund;
  }

  async updateRefundStatus(refundId: number, status: RefundStatus) {
    const refund = await this.prisma.refund.update({
      where: { id: refundId },
      data: { status, processedAt: new Date() },
    });

    this.logger.log(`🔁 Refund ${refundId} updated to status ${status}`);
    this.notifications.server.emit('refundStatusUpdated', refund);
    return refund;
  }

  async handleStripeEvent(event: Stripe.Event) {
    try {
      switch (event.type) {
        case 'charge.refunded': {
          const charge = event.data.object as Stripe.Charge;
          const paymentIntentId = charge.payment_intent as string;

          // Find payment linked to this paymentIntentId
          const payment = await this.prisma.payment.findFirst({
            where: { paymentIntentId },
            include: { order: true },
          });

          if (!payment) {
            this.logger.warn(`⚠️ No payment found for refunded intent ${paymentIntentId}`);
            return;
          }

          // Update payment + order status
          await this.prisma.payment.update({
            where: { id: payment.id },
            data: { status: PaymentStatus.REFUNDED },
          });

          await this.prisma.order.update({
            where: { id: payment.orderId },
            data: {
              status: 'REFUNDED',
              paymentStatus: 'REFUNDED',
            },
          });

          // Update related refund record if exists
          await this.prisma.refund.updateMany({
            where: { paymentId: payment.id },
            data: { status: RefundStatus.SUCCEEDED, processedAt: new Date() },
          });

          this.notifications.server.emit('paymentRefunded', {
            orderId: payment.orderId,
            paymentId: payment.id,
          });

          this.logger.log(`💰 Payment ${payment.id} refunded successfully`);
          break;
        }

        default:
          this.logger.log(`Unhandled Stripe event: ${event.type}`);
      }
    } catch (err) {
      this.logger.error('Error processing refund webhook', err);
    }
  }
}
