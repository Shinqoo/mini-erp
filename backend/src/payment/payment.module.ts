import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { RefundModule } from '../refund/refund.module';

@Module({
  imports: [PrismaModule, NotificationsModule, RefundModule],
  providers: [PaymentService],
  controllers: [PaymentController],
})
export class PaymentModule {}
