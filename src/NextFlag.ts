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
import { isEnabled } from './client/isEnabled';

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

    if (!this.secret) {
      console.warn(
        'NEXT_FLAG_WEBHOOK_SECRET not provided. It is suggested to configure a GitHub Webhook in order to activate NextJS caching. Without caching, the GitHub API will be queried for every feature flag check.'
      );
    }

    this.getEnvironment =
      options.getEnvironment || NextFlag.getDefaultEnvironment;

    this.octokit = new Octokit({
      auth: this.token,
    });

    this.unstable_cache = options.cache?.unstable_cache;
    this.revalidateTag = options.cache?.revalidateTag;

    this.paths = options.paths.map((x) => {
      if (!NextFlag.isValidRepo(x.repository)) {
        throw new Error('Invalid repo');
      }
      return {
        project: NextFlag.pathToProject(x),
        repository: x.repository.toLowerCase(),
        issue: x.issue,
      };
    });

    if (!this.paths.length) {
      throw new Error('At least one path must be provided');
    }

    if (this.paths.length > 1) {
      const set = new Set(this.paths.map((path) => path.project));
      if (set.size !== this.paths.length) {
        throw new Error('Each path must have a unique project');
      }
    }
  }

  private static getDefaultEnvironment(): string {
    return (
      process.env.VERCEL_ENV ||
      process.env.ENV ||
      process.env.STAGE ||
      process.env.NODE_ENV
    )?.toLowerCase() as string;
  }

  private static pathToProject(path: NextFlagOptionsPath) {
    if (path.project) {
      return path.project;
    }
    return `${path.repository.toLowerCase()}/${path.issue}`;
  }

  private static isValidRepo(repo: string) {
    return repo.split('/').length === 2;
  }

  private static getRepoOwner(repo: string) {
    return repo.split('/')[0];
  }

  private static getRepoName(repo: string) {
    return repo.split('/')[1];
  }

  private async getCachedFeatures(project: string) {
    const fn = async (pathProject: string) => {
      const foundPath = this.paths.find((path) => path.project === pathProject);
      if (!foundPath) {
        throw new Error('Path not found');
      }
      const owner = NextFlag.getRepoOwner(foundPath.repository);
      const repo = NextFlag.getRepoName(foundPath.repository);
      const { data } = await this.octokit.rest.issues.get({
        owner,
        repo,
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
      return fn(project);
    }

    // eslint-disable-next-line camelcase
    const unstable_cache = (this.unstable_cache ||
      (await import('next/cache').then(
        (x) => x.unstable_cache
      ))) as UnstableCache;

    return unstable_cache(fn, [project], {
      tags: [project],
    })(project);
  }

  public async GET(req: NextRequest) {
    const project = req.nextUrl.searchParams.get('project') as string;

    return NextResponse.json(await this.getFeatures(project));
  }

  public async isFeatureEnabled(
    feature: string | string[],
    project?: string
  ): Promise<boolean> {
    const features = await this.getFeatures(
      project || process.env.NEXT_PUBLIC_NEXT_FLAG_PROJECT
    );
    return isEnabled(feature, features);
  }

  public async getFeatures(project?: string): Promise<GetFeatures> {
    if (this.paths.length > 1 && !project) {
      throw new Error(
        'project must be provided when multiple paths are defined'
      );
    }
    if (project && !this.paths.find((path) => path.project === project)) {
      throw new Error('project not found');
    }
    const path = this.paths.find((x) => x.project === project) || this.paths[0];

    if (!path.project) {
      throw new Error('path not found');
    }

    const res = await this.getCachedFeatures(path.project);

    const environment = await this.getEnvironment();

    const features = Object.keys(res).reduce((acc, curr) => {
      const feature = res[curr].enabled;
      if (!feature) {
        return acc;
      }
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

  public async POST(req: NextRequest) {
    return this.githubWebhook(req);
  }

  private async githubWebhook(req: NextRequest) {
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

    const foundPath = this.paths.find(
      (path) =>
        path.repository.toLowerCase() ===
          body.repository.full_name.toLowerCase() &&
        path.issue === body.issue.number
    );

    if (!foundPath) {
      return NextResponse.json({ error: 'Path not found' }, { status: 404 });
    }

    if (!foundPath.project) {
      throw new Error('Path project not found');
    }

    const revalidateTag = (this.revalidateTag ||
      (await import('next/cache').then(
        (x) => x.revalidateTag
      ))) as RevalidateTag;

    revalidateTag(foundPath.project);

    return NextResponse.json({ success: true });
  }
}
