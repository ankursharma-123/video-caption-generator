import type { NextApiRequest, NextApiResponse } from 'next';
import { getRenderProgress } from '@/lib/progress';
import { ERROR_MESSAGES } from '@/lib/constants';
import type { ProgressResponse, ErrorResponse } from '@/lib/types';

export { setRenderProgress, resetRenderProgress } from '@/lib/progress';


export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<ProgressResponse | ErrorResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: ERROR_MESSAGES.METHOD_NOT_ALLOWED });
  }

  const progress = getRenderProgress();
  res.status(200).json({ progress });
}
