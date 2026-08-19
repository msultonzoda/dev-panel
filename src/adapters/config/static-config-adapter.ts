import type {
  ConfigAdapter,
  BuildInfo,
} from '@/types';

export interface StaticConfigOptions {
  environment?: string;
  buildInfo?: BuildInfo;
  runtimeConfig?: Record<string, unknown>;
}

export class StaticConfigAdapter implements ConfigAdapter {
  private readonly env: string;
  private readonly build: BuildInfo;
  private readonly runtime: Record<
    string,
    unknown
  >;

  constructor(options: StaticConfigOptions = {}) {
    this.env =
      options.environment ?? 'development';
    this.build = options.buildInfo ?? {
      version: '0.0.0',
    };
    this.runtime = options.runtimeConfig ?? {};
  }

  getEnvironment(): string {
    return this.env;
  }

  getBuildInfo(): BuildInfo {
    return this.build;
  }

  getRuntimeConfig(): Record<string, unknown> {
    return this.runtime;
  }
}
