import { NextRequest } from 'next/server';

import { nf } from '.';

export const POST = (req: NextRequest) => nf.POST(req);

export const GET = (req: NextRequest) => nf.GET(req);
