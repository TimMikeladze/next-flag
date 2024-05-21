import crypto from 'crypto';
import { NextFlagWebhookBody } from './types';

export const verifyWebhookSignature = async (
  req: Request,
  secret: string
): Promise<NextFlagWebhookBody | false> => {
  const sigHeaderName = 'x-hub-signature-256';
  const sigHashAlg = 'sha256';
  const body = await req.text();
  const sig = Buffer.from(req.headers.get(sigHeaderName) || '', 'utf8');
  const hmac = crypto.createHmac(sigHashAlg, secret);
  const digest = Buffer.from(
    `${sigHashAlg}=${hmac.update(body).digest('hex')}`,
    'utf8'
  );

  if (sig.length !== digest.length || !crypto.timingSafeEqual(digest, sig)) {
    return false;
  }

  return JSON.parse(body);
};
