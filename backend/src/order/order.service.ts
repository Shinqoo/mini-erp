import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class OrderService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new order with items.
   * @param userId ID of the user placing the order
   * @param items Array of { productId, quantity }
   */
  async createOrder(
    userId: number,
    items: { productId: number; quantity: number }[]
  ) {
    if (!items || items.length === 0) {
      throw new BadRequestException('Order must contain at least one item');
    }

    // Validate and calculate total
    const productIds = items.map(i => i.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    if (products.length !== items.length) {
      throw new BadRequestException('Some products were not found');
    }

    let totalAmount = new Decimal(0);
    const orderItemsData = items.map(item => {
      const product = products.find(p => p.id === item.productId);
      if (!product) throw new BadRequestException(`Product ${item.productId} not found`);
      if (product.stock < item.quantity) {
        throw new BadRequestException(`Not enough stock for product ${product.name}`);
      }

      const subtotal = new Decimal(product.price).mul(item.quantity);
      totalAmount = totalAmount.add(subtotal);

      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: product.price,
        subtotal,
      };
    });

    // Create the order and order items
    const order = await this.prisma.order.create({
      data: {
        userId,
        totalAmount,
        status: OrderStatus.PENDING, // ✅ default or explicitly set
        items: {
          create: orderItemsData,
        },
      },
      include: {
        items: true,
      },
    });

    // Decrease product stock
    for (const item of items) {
      await this.prisma.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
    }

    return order;
  }

  /**
   * Get all orders with related user and items
   */
  async getAllOrders() {
    return this.prisma.order.findMany({
      include: {
        user: true,
        items: { include: { product: true } },
        payment: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getOrdersByCustomerId(customerId: number) {
    return this.prisma.order.findMany({
      where: { userId: customerId },
      include: {
        user: true,
        items: { include: { product: true } },
        payment: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get a single order by ID
   */
  async getOrderById(orderId: number) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        items: { include: { product: true } },
        payment: true,
      },
    });

    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  /**
   * Update order status (e.g., PROCESSING, SHIPPED, COMPLETED)
   */
  async updateOrderStatus(orderId: number, status: OrderStatus) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');

    return this.prisma.order.update({
      where: { id: orderId },
      data: { status },
    });
  }

  /**
   * Cancel an order
   */
  async cancelOrder(orderId: number) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) throw new NotFoundException('Order not found');
    if (order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('Order already cancelled');
    }

    // Restore product stock
    for (const item of order.items) {
      await this.prisma.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } },
      });
    }

    return this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.CANCELLED,
        cancelledAt: new Date(),
      },
    });
  }

  /**
   * Delete an order (admin use only)
   */
  async deleteOrder(orderId: number) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');

    return this.prisma.order.delete({ where: { id: orderId } });
  }
}
