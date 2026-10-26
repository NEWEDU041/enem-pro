import axios, { AxiosError } from 'axios';

export interface SlackMessage {
  text?: string;
  blocks?: any[];
  attachments?: any[];
}

export interface AlertRule {
  type: 'error_rate' | 'p95_latency' | 'error_5xx';
  threshold: number;
  window_seconds: number;
  severity: 'critical' | 'high' | 'medium';
}

export class SlackAlertClient {
  private webhookUrl: string;
  private projectName: string;
  private environment: string;

  constructor(
    webhookUrl: string = process.env.SLACK_WEBHOOK_URL || '',
    projectName: string = 'unknown',
    environment: string = process.env.NODE_ENV || 'development'
  ) {
    this.webhookUrl = webhookUrl;
    this.projectName = projectName;
    this.environment = environment;
  }

  private getColorForSeverity(severity: string): string {
    const colors: { [key: string]: string } = {
      critical: '#ff0000',
      high: '#ff9900',
      medium: '#ffcc00',
      low: '#0099cc',
    };
    return colors[severity] || '#999999';
  }

  async sendAlert(
    title: string,
    message: string,
    severity: 'critical' | 'high' | 'medium' = 'critical',
    metadata?: Record<string, any>
  ): Promise<boolean> {
    if (!this.webhookUrl) {
      console.warn('⚠️  SLACK_WEBHOOK_URL not configured');
      return false;
    }

    try {
      const payload: SlackMessage = {
        attachments: [
          {
            color: this.getColorForSeverity(severity),
            title: `🚨 ${title}`,
            fields: [
              {
                title: 'Project',
                value: this.projectName,
                short: true,
              },
              {
                title: 'Environment',
                value: this.environment,
                short: true,
              },
              {
                title: 'Severity',
                value: severity.toUpperCase(),
                short: true,
              },
              {
                title: 'Timestamp',
                value: new Date().toISOString(),
                short: true,
              },
              {
                title: 'Details',
                value: message,
                short: false,
              },
              ...(metadata
                ? Object.entries(metadata).map(([key, value]) => ({
                    title: key,
                    value: typeof value === 'string' ? value : JSON.stringify(value),
                    short: true,
                  }))
                : []),
            ],
            footer: 'Sentry Error Tracking',
            ts: Math.floor(Date.now() / 1000),
          },
        ],
      };

      const response = await axios.post(this.webhookUrl, payload, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 5000,
      });

      if (response.status === 200) {
        console.log(`✅ Alert sent to Slack: ${title}`);
        return true;
      }
    } catch (error) {
      const axiosError = error as AxiosError;
      console.error(
        `❌ Failed to send Slack alert: ${axiosError.message}`,
        axiosError.response?.status
      );
      return false;
    }

    return false;
  }

  async sendErrorAlert(
    errorCount: number,
    errorRate: number,
    latencyP95: number,
    errors?: string[]
  ): Promise<boolean> {
    const criticalIssues: string[] = [];

    if (errorRate > 5) {
      criticalIssues.push(`Error rate: ${errorRate.toFixed(2)}% (threshold: 5%)`);
    }
    if (latencyP95 > 1000) {
      criticalIssues.push(`P95 latency: ${latencyP95.toFixed(0)}ms (threshold: 1000ms)`);
    }
    if (errorCount > 10) {
      criticalIssues.push(`Error count: ${errorCount} (threshold: 10/min)`);
    }

    if (criticalIssues.length === 0) {
      return false; // No critical issues
    }

    const message = criticalIssues.join('\n') + 
      (errors && errors.length > 0 ? `\n\nRecent errors:\n${errors.slice(0, 3).join('\n')}` : '');

    return this.sendAlert(
      'Critical Errors Detected',
      message,
      'critical',
      {
        'Error Count': errorCount,
        'Error Rate': `${errorRate.toFixed(2)}%`,
        'P95 Latency': `${latencyP95.toFixed(0)}ms`,
      }
    );
  }

  async sendTestAlert(): Promise<boolean> {
    return this.sendAlert(
      'Test Alert',
      'This is a test alert from Sentry integration. If you see this, the Slack webhook is working correctly! 🎉',
      'medium',
      {
        'Webhook Status': '✅ Connected',
        'Test Time': new Date().toISOString(),
      }
    );
  }
}
