import React, { useState } from 'react';
import { View, Text, FlatList, Button, StyleSheet } from 'react-native';

interface Card {
  id: string;
  playerName: string;
  powerScore: number;
}

export const LineupCreateScreen = () => {
  const [lineupName, setLineupName] = useState('');
  const [selectedCards, setSelectedCards] = useState<Record<string, string>>({});
  const [availableCards, setAvailableCards] = useState<Card[]>([
    { id: '1', playerName: 'Mike Trout', powerScore: 95 },
    { id: '2', playerName: 'Shohei Ohtani', powerScore: 98 },
  ]);

  const aggregatePower = Object.values(selectedCards).reduce((sum, cardId) => {
    const card = availableCards.find(c => c.id === cardId);
    return sum + (card?.powerScore || 0);
  }, 0);

  const toggleCard = (position: string, cardId: string) => {
    setSelectedCards(prev => {
      const updated = { ...prev };
      if (updated[position] === cardId) {
        delete updated[position];
      } else {
        updated[position] = cardId;
      }
      return updated;
    });
  };

  const createLineup = async () => {
    try {
      const response = await fetch('http://localhost:3000/v1/lineups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: lineupName, slots: selectedCards }),
      });
      const data = await response.json();
      console.log('Lineup created:', data);
    } catch (error) {
      console.error('Error creating lineup:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Lineup</Text>
      <Text>Power: {aggregatePower}</Text>
      <FlatList
        data={availableCards}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text>{item.playerName} (Power: {item.powerScore})</Text>
            {Object.entries(selectedCards).map(([pos, id]) =>
              id === item.id ? <Text key={pos}>Selected for {pos}</Text> : null
            )}
          </View>
        )}
      />
      <Button title="Create Lineup" onPress={createLineup} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  card: { padding: 12, borderBottomWidth: 1 },
});
