import { Module, Global } from '@nestjs/common';
import { InMemoryRealtimeService } from './in-memory-realtime.service';
import { RealtimeController } from './realtime.controller';

@Global()
@Module({
  providers: [
    InMemoryRealtimeService,
    { provide: 'RealtimeService', useExisting: InMemoryRealtimeService },
  ],
  controllers: [RealtimeController],
  exports: [InMemoryRealtimeService, 'RealtimeService'],
})
export class RealtimeModule {}
