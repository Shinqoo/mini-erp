import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { OrderStatus } from '@prisma/client';

@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  /**
   * Create a new order
   * Accessible by authenticated users
   */
  @UseGuards(JwtAuthGuard)
  @Post()
  async createOrder(
    @Request() req,
    @Body()
    body: {
      items: { productId: number; quantity: number }[];
    },
  ) {
    const userId = req.user?.userId;
    if (!userId) throw new BadRequestException('Invalid user');
    return this.orderService.createOrder(userId, body.items);
  }

  /**
   * Get all orders (admin only)
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get()
  async getAllOrders() {
    return this.orderService.getAllOrders();
  }

  /**
   * Get order by ID
   * Customers can only view their own orders
   */
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getOrderById(@Param('id') id: string, @Request() req) {
    const order = await this.orderService.getOrderById(Number(id));

    // If user is CUSTOMER, restrict access to their own order
    if (req.user.role !== 'ADMIN' && order.userId !== req.user.userId) {
      throw new BadRequestException('You are not allowed to view this order');
    }

    return order;
  }

  /**
   * Update order status (admin only)
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch(':id/status')
  async updateOrderStatus(
    @Param('id') id: string,
    @Body() body: { status: OrderStatus },
  ) {
    if (!body.status) throw new BadRequestException('Status is required');
    return this.orderService.updateOrderStatus(Number(id), body.status);
  }

  /**
   * Cancel an order (customer or admin)
   */
  @UseGuards(JwtAuthGuard)
  @Patch(':id/cancel')
  async cancelOrder(@Param('id') id: string, @Request() req) {
    const order = await this.orderService.getOrderById(Number(id));

    // Only owner or admin can cancel
    if (req.user.role !== 'ADMIN' && order.userId !== req.user.userId) {
      throw new BadRequestException('You cannot cancel this order');
    }

    return this.orderService.cancelOrder(Number(id));
  }

  /**
   * Delete an order (admin only)
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Delete(':id')
  async deleteOrder(@Param('id') id: string) {
    return this.orderService.deleteOrder(Number(id));
  }
}
