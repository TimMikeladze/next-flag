/* global RequestInit */

import { ReactNode } from 'react';

export interface Condition {
  enabled: boolean;
  name: string;
}

export interface Environment {
  conditions: Record<string, Condition>;
  enabled: boolean;
  name: string;
}

export interface Feature {
  enabled: boolean;
  environments: Record<string, Environment>;
  name: string;
  slug: string;
}

export interface FlatFeature {
  condition?: string;
  conditionEnabled?: boolean;
  environment?: string;

  environmentEnabled?: boolean;

  feature: string;

  featureEnabled?: boolean;

  slug: string;
}

export interface Features {
  [slug: string]: Feature;
}

export interface NextFlagOptionsPath {
  issue: number;
  project?: string;
  repository: string;
}

export type RevalidateTag = (key: string) => void;

export type UnstableCache = <T extends (...args: any[]) => Promise<any>>(
  cb: T,
  keyParts?: string[],
  options?: {
    revalidate?: number | false;
    tags?: string[];
  }
) => T;

export interface NextFlagOptions {
  cache?: {
    revalidateTag: RevalidateTag;
    unstable_cache: UnstableCache;
  };

  getEnvironment?: () => Promise<string> | string;

  github?: {
    secret: string;
    token?: string;
  };

  paths: NextFlagOptionsPath[];

  standalone?: boolean;
}

export type GetFeatures = string[];

export interface NextFlagWebhookBody {
  action: 'created' | 'edited';
  issue: {
    body: string;
    labels: {
      color: string;
      default: boolean;
      description: string;
      id: number;
      name: string;
      node_id: string;
      url: string;
    }[];
    number: number;
    state: 'open' | 'closed';
    title: string;
    user: {
      id: number;
      login: string;
      type: 'User';
    };
  };
  repository: {
    full_name: string;
    name: string;
  };
}

export interface UseNextFlagHookProps {
  endpoint?: string;
  environment?: string;

  project?: string;

  requestInit?: RequestInit;
}

export interface NextFlagProviderProps {
  children?: ReactNode;

  endpoint?: string;
  environment?: string;
  project?: string;

  requestInit?: RequestInit;
}

export interface IsFeatureEnabledOptions {
  endpoint?: string;
  environment?: string;

  project?: string;
  requestInit?: RequestInit;
}

export interface GetFeaturesArgs {
  endpoint?: string;
  environment?: string;

  project?: string;

  requestInit?: RequestInit;
}
