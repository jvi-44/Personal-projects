import { readFileSync } from 'node:fs';
import ee from '@google/earthengine';

/** Thrown when the deployment has no Earth Engine credentials configured. */
export class NotConfiguredError extends Error {
  constructor() {
    super('Earth Engine is not configured on this server (set EE_PROJECT_ID and EE_SERVICE_ACCOUNT_JSON).');
  }
}

interface ServiceAccountKey {
  client_email: string;
  private_key: string;
  project_id?: string;
}

function readKey(): ServiceAccountKey | null {
  const file = process.env.EE_SERVICE_ACCOUNT_FILE;
  let raw = process.env.EE_SERVICE_ACCOUNT_JSON?.trim();
  if (!raw && file) raw = readFileSync(file, 'utf8');
  if (!raw) return null;
  // Accept raw JSON or base64-encoded JSON (handy for dashboards that mangle newlines).
  if (!raw.startsWith('{')) raw = Buffer.from(raw, 'base64').toString('utf8');
  const key = JSON.parse(raw) as ServiceAccountKey;
  if (!key.client_email || !key.private_key) throw new Error('Service-account JSON is missing client_email/private_key');
  return key;
}

export function eeStatus(): { configured: boolean; project?: string; account?: string } {
  try {
    const key = readKey();
    const project = process.env.EE_PROJECT_ID || key?.project_id;
    if (!key || !project) return { configured: false };
    // Only reveal the account's domain, not its full address.
    return { configured: true, project, account: key.client_email.replace(/^[^@]+/, '•••') };
  } catch {
    return { configured: false };
  }
}

let ready: Promise<typeof ee> | null = null;

/** Authenticate + initialise once per server instance. */
export function getEE(): Promise<typeof ee> {
  if (ready) return ready;
  const key = readKey();
  const project = process.env.EE_PROJECT_ID || key?.project_id;
  if (!key || !project) return Promise.reject(new NotConfiguredError());
  ready = new Promise((resolve, reject) => {
    ee.data.authenticateViaPrivateKey(
      key,
      () => ee.initialize(null, null, () => resolve(ee), (e: unknown) => reject(new Error(String(e))), null, project),
      (e: unknown) => reject(new Error(`Earth Engine auth failed: ${String(e)}`)),
    );
  });
  // Allow a retry on the next request if initialisation failed.
  ready.catch(() => {
    ready = null;
  });
  return ready;
}

/** Promisified `.evaluate()` for any ee.ComputedObject. */
export function evaluate<T>(obj: { evaluate: (cb: (v: T, err?: string) => void) => void }): Promise<T> {
  return new Promise((resolve, reject) => obj.evaluate((v, err) => (err ? reject(new Error(err)) : resolve(v))));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getMapUrl(image: any, vis: Record<string, unknown>): Promise<string> {
  return new Promise((resolve, reject) =>
    image.getMapId(vis, (map: { urlFormat?: string } | undefined, err?: string) =>
      err || !map?.urlFormat ? reject(new Error(err || 'getMapId returned no URL')) : resolve(map.urlFormat),
    ),
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getThumbUrl(image: any, params: Record<string, unknown>): Promise<string> {
  return new Promise((resolve, reject) =>
    image.getThumbURL(params, (url: string, err?: string) => (err || !url ? reject(new Error(err || 'no thumbnail')) : resolve(url))),
  );
}
