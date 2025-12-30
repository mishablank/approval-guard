export { ApprovalService } from './approval-service';
export { RiskAnalysisService } from './risk-analysis-service';
export { RevocationService } from './revocation-service';
export { ReportGenerator } from './report-generator';
export { TokenMetadataService } from './token-metadata-service';
export { ApprovalFetcher } from './approval-fetcher';

import { ApprovalService } from './approval-service';
import { RiskAnalysisService } from './risk-analysis-service';
import { RevocationService } from './revocation-service';
import { ReportGenerator } from './report-generator';
import { TokenMetadataService } from './token-metadata-service';
import { ApprovalFetcher } from './approval-fetcher';
import { ApprovalCache } from '../cache';
import { HistoryTracker } from '../history';
import { RiskCalculator } from '../risk';
import type { PublicClient, WalletClient } from 'viem';

export interface ServiceDependencies {
  publicClient: PublicClient;
  walletClient?: WalletClient;
  cache?: ApprovalCache;
  historyTracker?: HistoryTracker;
}

export interface ServiceContainer {
  approvalService: ApprovalService;
  riskAnalysisService: RiskAnalysisService;
  revocationService: RevocationService;
  reportGenerator: ReportGenerator;
  tokenMetadataService: TokenMetadataService;
  approvalFetcher: ApprovalFetcher;
}

export function createServiceContainer(deps: ServiceDependencies): ServiceContainer {
  const { publicClient, walletClient, cache, historyTracker } = deps;

  // Create shared instances
  const tokenMetadataService = new TokenMetadataService(publicClient);
  const approvalFetcher = new ApprovalFetcher(publicClient, cache);
  const riskCalculator = new RiskCalculator();

  // Create services with injected dependencies
  const approvalService = new ApprovalService(
    publicClient,
    approvalFetcher,
    tokenMetadataService
  );

  const riskAnalysisService = new RiskAnalysisService(
    riskCalculator,
    historyTracker
  );

  const revocationService = new RevocationService(
    publicClient,
    walletClient
  );

  const reportGenerator = new ReportGenerator(
    riskAnalysisService,
    tokenMetadataService
  );

  return {
    approvalService,
    riskAnalysisService,
    revocationService,
    reportGenerator,
    tokenMetadataService,
    approvalFetcher,
  };
}

export class ServiceRegistry {
  private static instance: ServiceContainer | null = null;
  private static deps: ServiceDependencies | null = null;

  static initialize(deps: ServiceDependencies): ServiceContainer {
    this.deps = deps;
    this.instance = createServiceContainer(deps);
    return this.instance;
  }

  static getServices(): ServiceContainer {
    if (!this.instance) {
      throw new Error('ServiceRegistry not initialized. Call initialize() first.');
    }
    return this.instance;
  }

  static reset(): void {
    this.instance = null;
    this.deps = null;
  }

  static isInitialized(): boolean {
    return this.instance !== null;
  }

  static getDependencies(): ServiceDependencies | null {
    return this.deps;
  }
}
