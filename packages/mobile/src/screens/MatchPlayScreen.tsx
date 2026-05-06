import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Button, ScrollView } from 'react-native';

interface MatchEvent {
  type: string;
  description: string;
  position?: string;
}

interface MatchResult {
  winner: 'A' | 'B' | 'draw';
  scoreA: number;
  scoreB: number;
  events: MatchEvent[];
}

export const MatchPlayScreen = ({ route }: any) => {
  const { userId, token } = route.params;
  const [status, setStatus] = useState<'searching' | 'found' | 'playing' | 'finished'>('searching');
  const [matchInfo, setMatchId] = useState<any>(null);
  const [result, setResult] = useState<MatchResult | null>(null);

  useEffect(() => {
    const url = `http://localhost:3000/v1/notifications/stream?token=${token}`;
    const eventSource = new (global as any).EventSource(url);

    eventSource.addEventListener('match.found', (event: any) => {
      const data = JSON.parse(event.data);
      setMatchId(data);
      setStatus('found');
    });

    eventSource.addEventListener('match.start', (event: any) => {
      setStatus('playing');
    });

    eventSource.addEventListener('match.result', (event: any) => {
      const data = JSON.parse(event.data);
      setResult(data);
      setStatus('finished');
    });

    return () => eventSource.close();
  }, [token]);

  return (
    <View style={styles.container}>
      {status === 'searching' && (
        <View style={styles.centered}>
          <Text style={styles.title}>Finding Opponent...</Text>
        </View>
      )}

      {status === 'found' && matchInfo && (
        <View style={styles.centered}>
          <Text style={styles.title}>Match Found!</Text>
          <Text style={styles.subtitle}>VS {matchInfo.opponent.username}</Text>
          <Text>Your Power: {matchInfo.lineupPowerA}</Text>
          <Text>Their Power: {matchInfo.lineupPowerB}</Text>
          <Text style={styles.timer}>Starting in 3...</Text>
        </View>
      )}

      {status === 'playing' && (
        <View style={styles.centered}>
          <Text style={styles.title}>Battle in Progress!</Text>
          <Text>Calculating results...</Text>
        </View>
      )}

      {status === 'finished' && result && (
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.title}>Match Over</Text>
          <Text style={styles.winner}>
            {result.winner === 'draw' ? "It's a Draw!" : `Winner: Lineup ${result.winner}`}
          </Text>
          <Text style={styles.score}>Score: {result.scoreA} - {result.scoreB}</Text>
          
          <Text style={styles.sectionHeader}>Play-by-Play</Text>
          {result.events.map((ev, index) => (
            <View key={index} style={styles.eventCard}>
              <Text>{ev.description}</Text>
            </View>
          ))}
          
          <Button title="Back to Collection" onPress={() => {}} />
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  scroll: { padding: 20 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 10 },
  subtitle: { fontSize: 22, color: '#666', marginBottom: 20 },
  timer: { fontSize: 24, color: '#ff6b6b', marginTop: 20, fontWeight: 'bold' },
  winner: { fontSize: 26, fontWeight: 'bold', color: '#4dabf7', textAlign: 'center', marginVertical: 10 },
  score: { fontSize: 20, textAlign: 'center', marginBottom: 20 },
  sectionHeader: { fontSize: 18, fontWeight: 'bold', marginTop: 20, marginBottom: 10 },
  eventCard: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
});
