import {
  Controller,
  Post,
  Body,
  Req,
  UseGuards,
  HttpCode,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { RefundService } from '../refund/refund.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import Stripe from 'stripe';

@Controller('payments')
export class PaymentController {
  private readonly logger = new Logger(PaymentController.name);

  constructor(
    private readonly paymentService: PaymentService,
    private readonly refundService: RefundService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post('create-intent')
  async createPaymentIntent(
    @Req() req,
    @Body() body: { orderId: number },
  ) {
    const userId = req.user.userId;
    return this.paymentService.createPaymentIntent(body.orderId, userId);
  }

  @Post('webhook')
  @HttpCode(200)
  async handleStripeWebhook(@Req() req: any) {
    const sig = req.headers['stripe-signature'];
    this.logger.log(`🔥 Stripe Webhook received: ${req.rawBody ? 'has rawBody' : 'missing rawBody'}`);

    if (!req.rawBody) {
      throw new BadRequestException('Missing raw body for Stripe webhook');
    }

    let event: Stripe.Event;
    try {
      // ✅ Verify webhook signature
      event = this.paymentService.constructStripeEvent(
        req.rawBody as Buffer,
        sig,
      );
    } catch (err: any) {
      this.logger.error(`❌ Webhook signature verification failed: ${err.message}`);
      throw new BadRequestException(`Webhook Error: ${err.message}`);
    }

    this.logger.log(`✅ Received Stripe webhook: ${event.type}`);

    // ✅ Handle both payment and refund events
    if (event.type.startsWith('charge.') || event.type.startsWith('refund.')) {
      await this.refundService.handleStripeEvent(event);
    } else {
      await this.paymentService.handleStripeEvent(event);
    }

    return { received: true };
  }
}
