import { Controller, Post, Body, UseGuards, Logger } from '@nestjs/common';
import { RefundService } from './refund.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('refunds')
export class RefundController {
  private readonly logger = new Logger(RefundController.name);

  constructor(private readonly refundService: RefundService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async createRefund(
    @Body() body: { paymentId: number; amount?: number; reason?: string },
  ) {
    this.logger.log(`Refund request for paymentId=${body.paymentId}`);
    return this.refundService.createRefund(body.paymentId, body.amount, body.reason);
  }
}
