import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class PingService {
  private readonly logger = new Logger(PingService.name);
  
  // Every 14 minutes to prevent the 15-minute Render sleep timeout
  @Cron('*/14 * * * *')
  async handleCron() {
    this.logger.debug('Running self-ping to prevent Render sleep');
    
    // Using localhost since it's pinging itself internally
    const url = `http://localhost:${process.env.PORT || 3000}/`;
    
    try {
      const response = await fetch(url);
      if (response.ok) {
        this.logger.debug('Self-ping successful');
      } else {
        this.logger.warn(`Self-ping returned status: ${response.status}`);
      }
    } catch (error) {
      this.logger.error('Self-ping failed', error);
    }
  }
}
