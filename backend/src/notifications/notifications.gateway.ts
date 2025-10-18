import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/',
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(NotificationsGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  /**
   * Broadcast a message to all connected clients
   */
  broadcast(event: string, data: any) {
    this.server.emit(event, data);
    this.logger.log(`📢 Broadcast event "${event}" with data: ${JSON.stringify(data)}`);
  }

  notifyOrderUpdate(orderId: number, status: string) {
    this.broadcast('orderUpdate', { orderId, status });
  }

  notifyPaymentUpdate(orderId: number, paymentStatus: string) {
    this.broadcast('paymentUpdate', { orderId, paymentStatus });
  }

  notifyRefundUpdate(refundId: number, status: string) {
    this.broadcast('refundUpdate', { refundId, status });
  }
}
