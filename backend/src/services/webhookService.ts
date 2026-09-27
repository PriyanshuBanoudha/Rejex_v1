import crypto from 'crypto';
import { Webhook } from '../models/Webhook';
import type { WebhookEvent } from '../models/Webhook';
import { config } from '../config';

/**
 * Fire a webhook event to all registered webhooks for the given eventId and event type.
 * Signs payload with HMAC-SHA256 using the webhook's secret.
 * Non-blocking: errors are logged but do not throw.
 */
export async function fireWebhook(
  eventId: string,
  eventType: WebhookEvent,
  payload: Record<string, unknown>
): Promise<void> {
  const webhooks = await Webhook.find({ eventId, events: eventType, active: true });
  if (webhooks.length === 0) return;

  const body = JSON.stringify({
    event: eventType,
    eventId,
    timestamp: new Date().toISOString(),
    data: payload,
  });

  const deliveries = webhooks.map(async (wh) => {
    const sig = crypto.createHmac('sha256', wh.secret).update(body).digest('hex');

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.WEBHOOK_TIMEOUT_MS);

    try {
      await fetch(wh.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Hackathon-Event': eventType,
          'X-Hackathon-Signature': `sha256=${sig}`,
          'X-Hackathon-Delivery': crypto.randomUUID(),
        },
        body,
        signal: controller.signal,
      });
    } catch (err) {
      console.error(`[Webhook] Delivery failed to ${wh.url}:`, err);
    } finally {
      clearTimeout(timeout);
    }
  });

  // Fire all without blocking response
  Promise.allSettled(deliveries);
}
