import {
  Controller,
  HttpException,
  Post,
  RawBodyRequest,
  Req,
} from '@nestjs/common';
import { StripeService } from '@gitroom/nestjs-libraries/services/stripe.service';
import { ApiTags } from '@nestjs/swagger';
import {
  beginStripeWebhookProcessing,
  completeStripeWebhookProcessing,
  isStripeBillingConfigured,
  releaseStripeWebhookProcessing,
} from '@gitroom/nestjs-libraries/services/stripe.webhook.safety';

@ApiTags('Stripe')
@Controller('/stripe')
export class StripeController {
  constructor(private readonly _stripeService: StripeService) {}

  @Post('/')
  async stripe(@Req() req: RawBodyRequest<Request>) {
    if (!isStripeBillingConfigured(process.env)) {
      throw new HttpException(
        'Stripe billing is not configured for this mode',
        503
      );
    }

    const event = this._stripeService.validateRequest(
      req.rawBody,
      // @ts-ignore
      req.headers['stripe-signature'],
      process.env.STRIPE_SIGNING_KEY
    );

    const claim = await beginStripeWebhookProcessing(event.id);
    if (claim.status === 'duplicate_completed') {
      return { ok: true, duplicate: true };
    }
    if (claim.status === 'in_progress') {
      return { ok: true, duplicate: true, inProgress: true };
    }

    // Maybe it comes from another stripe webhook
    if (
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      event?.data?.object?.metadata?.service !== 'gitroom' &&
      event.type !== 'invoice.payment_succeeded'
    ) {
      await completeStripeWebhookProcessing(event.id);
      return { ok: true };
    }

    try {
      let result: unknown = { ok: true };
      switch (event.type) {
        case 'invoice.payment_succeeded':
          result = await this._stripeService.paymentSucceeded(event);
          break;
        case 'customer.subscription.created':
          result = await this._stripeService.createSubscription(event);
          break;
        case 'customer.subscription.updated':
          result = await this._stripeService.updateSubscription(event);
          break;
        case 'customer.subscription.deleted':
          result = await this._stripeService.deleteSubscription(event);
          break;
        default:
          result = { ok: true };
          break;
      }
      await completeStripeWebhookProcessing(event.id);
      return result;
    } catch (e) {
      await releaseStripeWebhookProcessing(event.id);
      throw new HttpException('Stripe webhook handling failed', 500);
    }
  }
}
