// eslint-disable-next-line camelcase
import { NextRequest, NextResponse } from 'next/server';
import { Octokit } from '@octokit/rest';
import {
  Context,
  GetFeatures,
  NextFlagOptions,
  NextFlagOptionsPath,
  RevalidateTag,
  UnstableCache,
} from './types';
import { verifyWebhookSignature } from './webhook';
import { parseMarkdown } from './parser';
import { isEnabled } from './client/isEnabled';
import { getDefaultEnvironment } from './client';

export class NextFlag {
  private secret: string;

  private token: string;

  private paths: NextFlagOptionsPath[];

  private octokit: Octokit;

  private revalidateTag: RevalidateTag | undefined;

  private unstable_cache: UnstableCache | undefined;

  private getEnvironment: () => Promise<string> | string;

  private standalone: boolean = false;

  private requestToContext: (req: NextRequest) => Promise<Context> | Context;

  private logging: boolean = false;

  constructor(options: NextFlagOptions) {
    this.standalone = options.standalone || false;
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

    this.getEnvironment = options.getEnvironment || getDefaultEnvironment;

    this.requestToContext = options.requestToContext || (async () => ({}));

    this.logging = options.logging || false;

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
        conditions: x.conditions || {},
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

  private async getCachedFeatures(project: string, environment: string) {
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

      if (this.logging) {
        console.log(
          `Fetching from GitHub features for ${project} in ${environment}`
        );
        console.log(JSON.stringify(features, null, 2));
      }

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

    return unstable_cache(fn, [project, environment], {
      tags: [project, environment],
    })(project);
  }

  public async GET(req: NextRequest) {
    const project = req.nextUrl.searchParams.get('project') as string;
    let environment = req.nextUrl.searchParams.get('environment') as string;

    // If not running in standalone mode, the environment must be sourced from the server environment.
    if (environment && !this.standalone) {
      environment = getDefaultEnvironment();
    }

    let context;
    if (this.requestToContext) {
      context = await this.requestToContext(req);
    }

    return NextResponse.json(
      await this.getFeatures({
        environment,
        project,
        context,
      })
    );
  }

  public async isFeatureEnabled(
    feature: string | string[],
    options: {
      context?: Context;
      environment?: string;
      project?: string;
    } = {}
  ): Promise<boolean> {
    const features = await this.getFeatures({
      environment: options.environment,
      project: options.project,
      context: options.context || {},
    });
    return isEnabled(feature, features);
  }

  public async getFeatures(
    options: {
      context?: Context;
      environment?: string;
      project?: string;
    } = {}
  ): Promise<GetFeatures> {
    const { environment, project } = options;

    const requestedProject = (
      project || (process.env.NEXT_PUBLIC_NEXT_FLAG_PROJECT as string)
    ).toLowerCase();

    const requestedEnvironment = (
      environment || (await this.getEnvironment())
    ).toLowerCase();

    if (this.paths.length > 1 && !requestedProject) {
      throw new Error(
        'project must be provided when multiple paths are defined'
      );
    }
    if (
      requestedProject &&
      !this.paths.find((path) => path.project === requestedProject)
    ) {
      throw new Error('project not found');
    }
    const path =
      this.paths.find((x) => x.project === requestedProject) || this.paths[0];

    if (!path.project) {
      throw new Error('path not found');
    }

    const cachedFeatures = await this.getCachedFeatures(
      path.project,
      requestedEnvironment
    );

    const features = Object.keys(cachedFeatures).reduce((acc, curr) => {
      const feature = cachedFeatures[curr].enabled;
      if (!feature) {
        return acc;
      }
      const hasEnvironments =
        Object.keys(cachedFeatures[curr].environments).length > 0;
      if (!feature && !hasEnvironments) {
        return acc;
      }
      if (feature && !hasEnvironments) {
        acc.add(curr);
        return acc;
      }
      const foundEnvironment =
        cachedFeatures[curr].environments[requestedEnvironment];
      if (!foundEnvironment) {
        return acc;
      }
      if (foundEnvironment.enabled) {
        acc.add(curr);
        return acc;
      }
      return acc;
    }, new Set());

    const enabledFeatures = Array.from(features) as GetFeatures;

    const enabledFeaturesWithConditions = [] as GetFeatures;

    await Promise.all(
      enabledFeatures.map(async (feature) => {
        const conditionsForPath = path.conditions || {};
        const conditionsForFeature = cachedFeatures[feature].conditions;
        const conditionKeys = Object.keys(conditionsForFeature);
        if (conditionKeys.length === 0) {
          enabledFeaturesWithConditions.push(feature);
          return;
        }

        const computedConditions = await Promise.all(
          conditionKeys.map(async (conditionKey) => {
            const condition = conditionsForFeature[conditionKey];
            if (!condition.enabled) {
              enabledFeaturesWithConditions.push(feature);
              return true;
            }
            const conditionFn = conditionsForPath[conditionKey];
            const result =
              (await conditionFn?.(options.context || {})) || false;
            return result;
          })
        );

        if (computedConditions.every((x) => x === true)) {
          enabledFeaturesWithConditions.push(feature);
        }
      })
    );

    return enabledFeaturesWithConditions;
  }

  public async POST(req: NextRequest) {
    return this.githubWebhook(req);
  }

  private async githubWebhook(req: NextRequest) {
    if (!this.secret) {
      return NextResponse.json(
        { error: 'Secret not found. GitHub webhook disabled.' },
        { status: 200 }
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
      return NextResponse.json({ error: 'Path not found' }, { status: 200 });
    }

    if (!foundPath.project) {
      throw new Error('Path project not found');
    }

    const revalidateTag = (this.revalidateTag ||
      (await import('next/cache').then(
        (x) => x.revalidateTag
      ))) as RevalidateTag;

    revalidateTag(foundPath.project);

    if (this.logging) {
      console.log('Revalidated cache for', foundPath.project);

      const markdown = body.issue.body;
      const features = parseMarkdown(markdown);

      console.log(JSON.stringify(features, null, 2));
    }

    return NextResponse.json({ success: true });
  }
}
