import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { InMemoryRealtimeService } from './in-memory-realtime.service';

@Controller('v1/notifications')
@UseGuards(JwtAuthGuard)
export class RealtimeController {
  constructor(private readonly realtimeService: InMemoryRealtimeService) {}

  @Get('stream')
  async stream(@Req() req: any, @Res() res: any): Promise<void> {
    const userId = req.user.id;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Send initial heartbeat
    res.write('event: heartbeat\ndata: {}\n\n');

    const callback = (event: any) => {
      const data = JSON.stringify(event.data);
      res.write(`event: ${event.event}\ndata: ${data}\n\n`);
    };

    this.realtimeService.subscribe(userId, callback);

    // Cleanup on close
    req.on('close', () => {
      this.realtimeService.unsubscribe(userId, callback);
    });
  }
}
