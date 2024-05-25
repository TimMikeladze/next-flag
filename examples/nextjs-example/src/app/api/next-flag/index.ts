import { NextFlag } from 'next-flag';
import { revalidateTag, unstable_cache } from 'next/cache';

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
  async requestToContext(req) {
    return {
      isAdmin: false,
    };
  },
  cache: {
    revalidateTag,
    unstable_cache,
  },
});
