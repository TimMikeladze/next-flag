import { NextFlag } from 'next-flag';
import { revalidateTag, unstable_cache } from 'next/cache';

export const nf = new NextFlag({
  paths: [
    {
      repository: 'TimMikeladze/next-flag',
      issue: 3,
    },
  ],
  cache: {
    revalidateTag,
    unstable_cache,
  },
});
