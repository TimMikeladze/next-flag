// cache is only required if you're package linking next-flag during local development
// eslint-disable-next-line camelcase
import { revalidateTag, unstable_cache } from 'next/cache';
import { NextFlag } from 'next-flag';

export const nf = new NextFlag({
  // cache is only required if you're package linking next-flag during local development
  cache: {
    revalidateTag,
    // eslint-disable-next-line camelcase
    unstable_cache,
  },
  paths: [
    {
      owner: 'TimMikeladze',
      repo: 'next-flag',
      issue: 3,
    },
  ],
});
