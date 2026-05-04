import { Module } from '@nestjs/common';
import { InMemoryRealtimeService } from './in-memory-realtime.service';
import { RealtimeController } from './realtime.controller';

@Module({
  providers: [
    { provide: 'RealtimeService', useClass: InMemoryRealtimeService },
  ],
  controllers: [RealtimeController],
  exports: ['RealtimeService'],
})
export class RealtimeModule {}
