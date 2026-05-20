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

// Configuration should be moved to a shared config file or env in production
const API_BASE_URL = 'http://localhost:3000';

export const MatchPlayScreen = ({ route, navigation }: any) => {
  const { userId, token } = route.params;
  const [status, setStatus] = useState<'searching' | 'found' | 'playing' | 'finished' | 'error'>('searching');
  const [matchInfo, setMatchInfo] = useState<any>(null);
  const [result, setResult] = useState<MatchResult | null>(null);

  useEffect(() => {
    const url = `${API_BASE_URL}/v1/notifications/stream?token=${token}`;
    const eventSource = new (global as any).EventSource(url);

    const safeParse = (event: any, callback: (data: any) => void) => {
      try {
        const data = JSON.parse(event.data);
        callback(data);
      } catch (err) {
        console.error('Failed to parse SSE event data', err);
        setStatus('error');
      }
    };

    eventSource.addEventListener('match.found', (event: any) => {
      safeParse(event, (data) => {
        setMatchInfo(data);
        setStatus('found');
      });
    });

    eventSource.addEventListener('match.start', (event: any) => {
      setStatus('playing');
    });

    eventSource.addEventListener('match.result', (event: any) => {
      safeParse(event, (data) => {
        setResult(data);
        setStatus('finished');
      });
    });

    eventSource.onerror = (err: any) => {
      console.error('SSE connection error', err);
      setStatus('error');
    };

    return () => eventSource.close();
  }, [token]);

  return (
    <View style={styles.container}>
      {status === 'error' && (
        <View style={styles.centered}>
          <Text style={styles.title}>Something went wrong</Text>
          <Button title="Go Back" onPress={() => navigation.goBack()} />
        </View>
      )}

      {status === 'searching' && (
        <View style={styles.centered}>
          <Text style={styles.title}>Finding Opponent...</Text>
        </View>
      )}

      {status === 'found' && matchInfo && (
        <View style={styles.centered}>
          <Text style={styles.title}>Match Found!</Text>
          <Text style={styles.subtitle}>VS {matchInfo.opponent.username}</Text>
          <Text>Your Power: {matchInfo.lineupAId === userId ? matchInfo.lineupPowerA : matchInfo.lineupPowerB}</Text>
          <Text>Opponent Power: {matchInfo.lineupAId === userId ? matchInfo.lineupPowerB : matchInfo.lineupPowerA}</Text>
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
          
          <Button title="Back to Collection" onPress={() => navigation.navigate('Collection')} />
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
