import { NextFlag } from 'next-flag';
import { revalidateTag, unstable_cache } from 'next/cache';
import { NextRequest } from 'next/server';

export const nf = new NextFlag({
  paths: [
    {
      repository: 'TimMikeladze/next-flag',
      issue: 3,
      conditions: {
        'only-if-admin': (context) => context.isAdmin,
      },
    },
  ],
  async requestToContext(req: NextRequest) {
    return {
      isAdmin: false,
    };
  },
  cache: {
    revalidateTag,
    unstable_cache,
  },
});
