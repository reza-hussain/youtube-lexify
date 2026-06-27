import { Controller, Post, Get, Body, UseGuards, Request } from '@nestjs/common';
import { FeedbackService } from './feedback.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  submit(
    @Request() req: any,
    @Body() body: { rating: number; category: string; message: string; anonymous: boolean },
  ) {
    return this.feedbackService.submit(req.user.id, body);
  }

  @Get('featured')
  getFeatured() {
    return this.feedbackService.getFeatured();
  }
}
