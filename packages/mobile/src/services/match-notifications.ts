// Mobile client: SSE connection to receive match:found events
// This is a stub demonstrating the pattern; mobile app is currently scaffolded only

export class MatchNotifications {
  private eventSource: EventSource | null = null;

  connect(userId: string, token: string): void {
    // Note: native EventSource doesn't support custom headers in all browsers
    // For production, consider WebSocket or append token as query param
    const url = `http://localhost:3000/v1/notifications/stream?token=${token}`;
    this.eventSource = new EventSource(url);

    this.eventSource.addEventListener('match.found', (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      this.showMatchFoundModal(data);
    });

    this.eventSource.addEventListener('match.result', (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      this.showMatchResult(data);
    });

    this.eventSource.onerror = (error: any) => {
      console.error('SSE connection error:', error);
      // Implement reconnection logic
    };
  }

  private showMatchFoundModal(data: any): void {
    // Display "Match Found" modal with opponent info and lineup power
    console.log('Match found!', data);
    // In real implementation: trigger UI modal/navigation
    // Example: navigation.navigate('/match-found', { state: { matchId: data.matchId, opponent: data.opponent } });
  }

  private showMatchResult(data: any): void {
    // Display "Match Result" screen with winner and breakdown
    console.log('Match result!', data);
    // Example: navigation.navigate('/match-result', { state: { result: data } });
  }

  disconnect(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }
}
