import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { TelegramController } from './telegram.controller';
import { TelegramService } from './telegram.service';

@Module({
  controllers: [TelegramController],
  providers: [TelegramService, PrismaService],
})
export class TelegramModule {}
