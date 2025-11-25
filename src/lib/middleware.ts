import type { NextApiRequest, NextApiResponse } from 'next';
import { promisify } from 'util';

/**
 * Runs Express-style middleware in Next.js API routes
 */
export function runMiddleware(
  req: NextApiRequest,
  res: NextApiResponse,
  fn: Function
): Promise<any> {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}

/**
 * Promise-based file unlink
 */
export const unlinkAsync = promisify(require('fs').unlink);
