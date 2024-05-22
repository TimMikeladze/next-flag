import { IsFeatureEnabledOptions } from '../types';
import { getFeatures } from './getFeatures';
import { isEnabled } from './isEnabled';

export const isFeatureEnabled = async (
  feature: string | string[],
  options: IsFeatureEnabledOptions = {}
): Promise<boolean> => {
  const features = await getFeatures(options);
  return isEnabled(feature, features);
};
