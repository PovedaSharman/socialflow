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
  claimStripeWebhookEvent,
  isStripeBillingConfigured,
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

    const claimed = await claimStripeWebhookEvent(event.id);
    if (!claimed) {
      return { ok: true, duplicate: true };
    }

    // Maybe it comes from another stripe webhook
    if (
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      event?.data?.object?.metadata?.service !== 'gitroom' &&
      event.type !== 'invoice.payment_succeeded'
    ) {
      return { ok: true };
    }

    try {
      switch (event.type) {
        case 'invoice.payment_succeeded':
          return this._stripeService.paymentSucceeded(event);
        case 'customer.subscription.created':
          return this._stripeService.createSubscription(event);
        case 'customer.subscription.updated':
          return this._stripeService.updateSubscription(event);
        case 'customer.subscription.deleted':
          return this._stripeService.deleteSubscription(event);
        default:
          return { ok: true };
      }
    } catch (e) {
      throw new HttpException(e, 500);
    }
  }
}
