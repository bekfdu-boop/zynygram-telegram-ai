export interface DiagnosticEvent {
  time: string;
  type: string;
  details: Record<string, unknown>;
}

export interface BusinessConnectionInfo {
  id: string;
  userId?: number | string;
  username?: string;
  isEnabled?: boolean;
  canReply?: boolean;
  updatedAt: string;
}

class DiagnosticsTracker {
  private events: DiagnosticEvent[] = [];
  private maxEvents = 50;
  public businessConnections = new Map<string, BusinessConnectionInfo>();

  public record(type: string, details: Record<string, unknown>): void {
    const event: DiagnosticEvent = {
      time: new Date().toISOString(),
      type,
      details,
    };
    this.events.unshift(event);
    if (this.events.length > this.maxEvents) {
      this.events.pop();
    }
  }

  public setBusinessConnection(
    id: string,
    data: {
      userId?: number | string;
      username?: string;
      isEnabled?: boolean;
      canReply?: boolean;
    },
  ): void {
    this.businessConnections.set(id, {
      id,
      ...data,
      updatedAt: new Date().toISOString(),
    });
  }

  public getRecentEvents(): DiagnosticEvent[] {
    return [...this.events];
  }

  public getConnections(): BusinessConnectionInfo[] {
    return Array.from(this.businessConnections.values());
  }
}

export const diagnostics = new DiagnosticsTracker();
export default diagnostics;
