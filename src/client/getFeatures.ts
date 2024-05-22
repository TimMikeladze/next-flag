import { GetFeatures, GetFeaturesArgs } from '../types';

export const getFeatures = async (
  props: GetFeaturesArgs = {}
): Promise<GetFeatures> => {
  let url = props.endpoint || process.env.NEXT_PUBLIC_NEXT_FLAG_ENDPOINT;

  if (typeof window !== 'undefined') {
    if (!url) {
      url = '/api/next-flag';
    }
  } else if (!url) {
    throw new Error('NextFlag endpoint is required');
  }

  const project =
    props.project || (process.env.NEXT_PUBLIC_NEXT_FLAG_PROJECT as string);

  if (project) {
    url = `${url}?project=${project}`;
  }

  const res = await fetch(url, {
    cache: 'no-store',
    ...props.requestInit,
  });

  return res.json();
};
