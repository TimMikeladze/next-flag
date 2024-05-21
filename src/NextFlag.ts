// eslint-disable-next-line camelcase
import { NextRequest, NextResponse } from 'next/server';
import { Octokit } from '@octokit/rest';
import {
  GetFeatures,
  NextFlagOptions,
  NextFlagOptionsPath,
  RevalidateTag,
  UnstableCache,
} from './types';
import { verifyWebhookSignature } from './webhook';
import { parseMarkdown } from './parser';

export class NextFlag {
  private secret: string;

  private token: string;

  private paths: NextFlagOptionsPath[];

  private octokit: Octokit;

  private revalidateTag: RevalidateTag | undefined;

  private unstable_cache: UnstableCache | undefined;

  private getEnvironment: () => Promise<string> | string;

  constructor(options: NextFlagOptions) {
    this.secret =
      options.github?.secret ||
      (process.env.NEXT_FLAG_WEBHOOK_SECRET as string);
    this.token =
      options.github?.token || (process.env.NEXT_FLAG_GITHUB_TOKEN as string);

    this.getEnvironment =
      options.getEnvironment || NextFlag.getDefaultEnvironment;

    this.octokit = new Octokit({
      auth: this.token,
    });

    this.unstable_cache = options.cache?.unstable_cache;
    this.revalidateTag = options.cache?.revalidateTag;

    this.paths = options.paths.map((x) => ({
      key: NextFlag.pathToKey(x),
      owner: x.owner.toLowerCase(),
      repo: x.repo.toLowerCase(),
      issue: x.issue,
    }));

    if (!this.paths.length) {
      throw new Error('At least one path must be provided');
    }

    if (this.paths.length > 1) {
      const set = new Set(this.paths.map((path) => path.key));
      if (set.size !== this.paths.length) {
        throw new Error('Each path must have a unique key');
      }
    }
  }

  public static getDefaultEnvironment(): string {
    return (
      process.env.VERCEL_ENV ||
      process.env.ENV ||
      process.env.STAGE ||
      process.env.NODE_ENV
    )?.toLowerCase() as string;
  }

  public static pathToKey(path: NextFlagOptionsPath) {
    if (path.key) {
      return path.key;
    }
    return `${path.owner.toLowerCase()}/${path.repo.toLowerCase()}/${path.issue}`;
  }

  async getCachedFeatures(key: string) {
    const fn = async (pathKey: string) => {
      const foundPath = this.paths.find((path) => path.key === pathKey);
      if (!foundPath) {
        throw new Error('Path not found');
      }
      const { data } = await this.octokit.rest.issues.get({
        owner: foundPath.owner,
        repo: foundPath.repo,
        issue_number: foundPath.issue,
      });
      if (!data.body) {
        throw new Error('Issue body not found');
      }
      const features = parseMarkdown(data.body);
      return { ...features };
    };

    // No webhook enabled, therefore no caching.
    if (!this.secret) {
      return fn(key);
    }

    // eslint-disable-next-line camelcase
    const unstable_cache = (this.unstable_cache ||
      (await import('next/cache').then(
        (x) => x.unstable_cache
      ))) as UnstableCache;

    return unstable_cache(fn, [key], {
      tags: [key],
    })(key);
  }

  async GET(req: NextRequest) {
    const key = req.nextUrl.searchParams.get('key') as string;

    return NextResponse.json(await this.getFeatures(key));
  }

  async isEnabled(feature: string | string[], key?: string): Promise<boolean> {
    const features = await this.getFeatures(key);
    if (features.length === 0) {
      return false;
    }
    const array = Array.isArray(feature) ? feature : [feature];
    return array.every((x) => features.includes(x));
  }

  async getFeatures(key?: string): Promise<GetFeatures> {
    if (this.paths.length > 1 && !key) {
      throw new Error('key must be provided when multiple paths are defined');
    }
    if (key && !this.paths.find((path) => path.key === key)) {
      throw new Error('key not found');
    }
    const path = this.paths.find((x) => x.key === key) || this.paths[0];

    if (!path.key) {
      throw new Error('path not found');
    }

    const res = await this.getCachedFeatures(path.key);

    const environment = await this.getEnvironment();

    const features = Object.keys(res).reduce((acc, curr) => {
      const feature = res[curr].enabled;
      const hasEnvironments = Object.keys(res[curr].environments).length > 0;
      if (!feature && !hasEnvironments) {
        return acc;
      }
      if (feature && !hasEnvironments) {
        acc.add(curr);
        return acc;
      }
      const foundEnvironment = res[curr].environments[environment];
      if (!foundEnvironment) {
        return acc;
      }
      if (foundEnvironment.enabled) {
        acc.add(curr);
        return acc;
      }
      return acc;
    }, new Set());

    return Array.from(features) as GetFeatures;
  }

  async POST(req: NextRequest) {
    return this.githubWebhook(req);
  }

  async githubWebhook(req: NextRequest) {
    if (!this.secret) {
      return NextResponse.json(
        { error: 'Secret not found. GitHub webhook disabled.' },
        { status: 401 }
      );
    }

    const body = await verifyWebhookSignature(req, this.secret);
    if (!body) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const foundPath = this.paths.find((path) => {
      const owner = body.repository.full_name.split('/')[0].toLowerCase();
      const repo = body.repository.full_name.split('/')[1].toLowerCase();

      return (
        path.owner.toLowerCase() === owner &&
        path.repo.toLowerCase() === repo &&
        path.issue === body.issue.number
      );
    });

    if (!foundPath) {
      return NextResponse.json({ error: 'Path not found' }, { status: 404 });
    }

    if (!foundPath.key) {
      throw new Error('Path key not found');
    }

    const revalidateTag = (this.revalidateTag ||
      (await import('next/cache').then(
        (x) => x.revalidateTag
      ))) as RevalidateTag;

    revalidateTag(foundPath.key);

    return NextResponse.json({ success: true });
  }
}
