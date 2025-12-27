import {
  ApprovalData,
  RiskAssessment,
  RevocationRecommendation,
  ApprovalReport,
  ReportFormat,
} from '../types.js';
import { formatDate, formatTokenAmount } from '../utils/formatting.js';
import { shortenAddress } from '../utils/address.js';
import * as fs from 'fs/promises';
import * as path from 'path';

export class ReportGenerator {
  generateReport(
    walletAddress: string,
    approvals: ApprovalData[],
    riskAssessments: RiskAssessment[],
    recommendations: RevocationRecommendation[]
  ): ApprovalReport {
    const totalRiskScore = this.calculateTotalRiskScore(riskAssessments);
    const riskLevel = this.determineOverallRiskLevel(totalRiskScore);
    
    const approvalDetails = approvals.map((approval, index) => ({
      approval,
      riskAssessment: riskAssessments[index],
      recommendation: recommendations.find(
        r => r.tokenAddress === approval.tokenAddress && 
             r.spenderAddress === approval.spenderAddress
      ),
    }));

    return {
      walletAddress,
      generatedAt: new Date().toISOString(),
      summary: {
        totalApprovals: approvals.length,
        highRiskCount: riskAssessments.filter(r => r.riskLevel === 'critical' || r.riskLevel === 'high').length,
        mediumRiskCount: riskAssessments.filter(r => r.riskLevel === 'medium').length,
        lowRiskCount: riskAssessments.filter(r => r.riskLevel === 'low').length,
        totalRiskScore,
        overallRiskLevel: riskLevel,
      },
      approvals: approvalDetails,
      recommendations: recommendations.filter(r => r.shouldRevoke),
    };
  }

  private calculateTotalRiskScore(assessments: RiskAssessment[]): number {
    if (assessments.length === 0) return 0;
    const sum = assessments.reduce((acc, a) => acc + a.riskScore, 0);
    return Math.round(sum / assessments.length);
  }

  private determineOverallRiskLevel(
    score: number
  ): 'low' | 'medium' | 'high' | 'critical' {
    if (score >= 80) return 'critical';
    if (score >= 60) return 'high';
    if (score >= 40) return 'medium';
    return 'low';
  }

  formatReport(report: ApprovalReport, format: ReportFormat): string {
    switch (format) {
      case 'json':
        return this.formatAsJson(report);
      case 'text':
        return this.formatAsText(report);
      case 'csv':
        return this.formatAsCsv(report);
      default:
        return this.formatAsJson(report);
    }
  }

  private formatAsJson(report: ApprovalReport): string {
    return JSON.stringify(report, null, 2);
  }

  private formatAsText(report: ApprovalReport): string {
    const lines: string[] = [];
    
    lines.push('═'.repeat(60));
    lines.push('APPROVAL GUARD - RISK ASSESSMENT REPORT');
    lines.push('═'.repeat(60));
    lines.push('');
    lines.push(`Wallet: ${report.walletAddress}`);
    lines.push(`Generated: ${formatDate(new Date(report.generatedAt))}`);
    lines.push('');
    lines.push('─'.repeat(60));
    lines.push('SUMMARY');
    lines.push('─'.repeat(60));
    lines.push(`Total Approvals: ${report.summary.totalApprovals}`);
    lines.push(`Overall Risk Level: ${report.summary.overallRiskLevel.toUpperCase()}`);
    lines.push(`Total Risk Score: ${report.summary.totalRiskScore}/100`);
    lines.push('');
    lines.push(`  Critical/High Risk: ${report.summary.highRiskCount}`);
    lines.push(`  Medium Risk: ${report.summary.mediumRiskCount}`);
    lines.push(`  Low Risk: ${report.summary.lowRiskCount}`);
    lines.push('');
    
    if (report.recommendations.length > 0) {
      lines.push('─'.repeat(60));
      lines.push('REVOCATION RECOMMENDATIONS');
      lines.push('─'.repeat(60));
      lines.push('');
      
      report.recommendations
        .sort((a, b) => b.priority - a.priority)
        .forEach((rec, index) => {
          lines.push(`${index + 1}. ${rec.tokenSymbol} → ${shortenAddress(rec.spenderAddress)}`);
          lines.push(`   Priority: ${rec.priority === 3 ? 'HIGH' : rec.priority === 2 ? 'MEDIUM' : 'LOW'}`);
          lines.push(`   Reason: ${rec.reason}`);
          lines.push('');
        });
    }
    
    if (report.approvals.length > 0) {
      lines.push('─'.repeat(60));
      lines.push('DETAILED APPROVALS');
      lines.push('─'.repeat(60));
      lines.push('');
      
      report.approvals.forEach((item, index) => {
        const { approval, riskAssessment } = item;
        lines.push(`[${index + 1}] ${approval.tokenSymbol}`);
        lines.push(`    Token: ${shortenAddress(approval.tokenAddress)}`);
        lines.push(`    Spender: ${shortenAddress(approval.spenderAddress)}`);
        lines.push(`    Allowance: ${approval.isUnlimited ? 'UNLIMITED' : formatTokenAmount(approval.allowance, approval.tokenDecimals)}`);
        lines.push(`    Risk: ${riskAssessment.riskLevel.toUpperCase()} (${riskAssessment.riskScore}/100)`);
        if (riskAssessment.factors.length > 0) {
          lines.push(`    Factors: ${riskAssessment.factors.join(', ')}`);
        }
        lines.push('');
      });
    }
    
    lines.push('═'.repeat(60));
    lines.push('END OF REPORT');
    lines.push('═'.repeat(60));
    
    return lines.join('\n');
  }

  private formatAsCsv(report: ApprovalReport): string {
    const headers = [
      'Token Symbol',
      'Token Address',
      'Spender Address',
      'Allowance',
      'Is Unlimited',
      'Risk Level',
      'Risk Score',
      'Risk Factors',
      'Should Revoke',
      'Revoke Reason',
    ];
    
    const rows = report.approvals.map(item => {
      const { approval, riskAssessment, recommendation } = item;
      return [
        approval.tokenSymbol,
        approval.tokenAddress,
        approval.spenderAddress,
        approval.isUnlimited ? 'UNLIMITED' : approval.allowance.toString(),
        approval.isUnlimited ? 'true' : 'false',
        riskAssessment.riskLevel,
        riskAssessment.riskScore.toString(),
        riskAssessment.factors.join('; '),
        recommendation?.shouldRevoke ? 'true' : 'false',
        recommendation?.reason || '',
      ];
    });
    
    const escapeCsvValue = (value: string): string => {
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    };
    
    const csvLines = [
      headers.map(escapeCsvValue).join(','),
      ...rows.map(row => row.map(escapeCsvValue).join(',')),
    ];
    
    return csvLines.join('\n');
  }

  async saveReport(
    report: ApprovalReport,
    format: ReportFormat,
    outputPath?: string
  ): Promise<string> {
    const content = this.formatReport(report, format);
    
    const extension = format === 'text' ? 'txt' : format;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = outputPath || `approval-report-${timestamp}.${extension}`;
    
    const resolvedPath = path.resolve(filename);
    await fs.writeFile(resolvedPath, content, 'utf-8');
    
    return resolvedPath;
  }
}
