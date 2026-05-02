import React from 'react';
import { View, StyleSheet } from 'react-native';
import Pad from './Pad';
import { useProjectStore, selectKit } from '../../state/projectStore';
import { AudioPlaybackService } from '../../audio/AudioPlaybackService';

const PAD_COLORS = [
  '#E57373', '#81C784', '#64B5F6', '#FFD54F',
  '#BA68C8', '#4DB6AC', '#FF8A65', '#90A4AE',
  '#F06292', '#AED581', '#4FC3F7', '#FFB74D',
  '#9575CD', '#4DD0E1', '#FF7043', '#A1887F',
];

const PAD_NAMES = [
  'Kick', 'Snare', 'Hi-Hat', 'Clap',
  'Tom 1', 'Tom 2', 'Ride', 'Crash',
  'Open HH', 'Closed HH', 'Cowbell', 'Tambourine',
  'Shaker', 'Claves', 'Maracas', 'Whistle',
];

export default function PadGrid(): React.JSX.Element {
  const kit = useProjectStore(selectKit);

  const handlePadPress = (index: number, velocity: number) => {
    const pad = kit.pads[index];
    if (!pad) return;
    const sampleId = pad.sampleId || `sample-${pad.id}`;
    AudioPlaybackService.playSample(sampleId, velocity);
  };

  const pads = kit.pads.length >= 8 ? kit.pads : PAD_NAMES.map((name, i) => ({
    id: `pad-${i}`,
    name,
    color: PAD_COLORS[i % PAD_COLORS.length],
    sampleId: `sample-${i}`,
  }));

  return (
    <View style={styles.grid}>
      {pads.slice(0, 16).map((pad, index) => (
        <Pad
          key={pad.id}
          id={pad.id}
          name={pad.name}
          color={pad.color}
          onPress={(velocity) => handlePadPress(index, velocity)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    padding: 8,
  },
});
