import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import type { PrayerInfo } from '@/context/PrayerContext';

interface Props {
  prayer: PrayerInfo;
}

type IconName = keyof (typeof MaterialCommunityIcons)['glyphMap'];

const PRAYER_ICONS: Record<string, IconName> = {
  fajr: 'weather-sunset-up',
  dhuhr: 'weather-sunny',
  asr: 'weather-partly-cloudy',
  maghrib: 'weather-sunset',
  isha: 'weather-night',
};

function formatTime(date: Date): string {
  return date.toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export function PrayerCard({ prayer }: Props) {
  const colors = useColors();

  const cardBg = prayer.isNext ? colors.accent : colors.card;
  const nameFg = prayer.isNext
    ? colors.accentForeground
    : prayer.isPast
      ? colors.mutedForeground
      : colors.foreground;
  const timeFg = prayer.isNext
    ? colors.accentForeground
    : prayer.isPast
      ? colors.mutedForeground
      : colors.primary;
  const iconColor = prayer.isNext
    ? colors.accentForeground
    : prayer.isPast
      ? colors.mutedForeground
      : colors.primary;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: cardBg,
          borderColor: prayer.isNext ? colors.accent : colors.border,
          borderRadius: colors.radius,
          opacity: prayer.isPast && !prayer.isNext ? 0.55 : 1,
        },
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: prayer.isNext ? 'rgba(0,0,0,0.15)' : colors.muted }]}>
        <MaterialCommunityIcons name={PRAYER_ICONS[prayer.key]} size={22} color={iconColor} />
      </View>
      <Text style={[styles.name, { color: nameFg }]}>{prayer.name}</Text>
      {prayer.isNext && (
        <View style={styles.badge}>
          <Text style={[styles.badgeText, { color: colors.accentForeground }]}>Sıradaki</Text>
        </View>
      )}
      <Text style={[styles.time, { color: timeFg }]}>{formatTime(prayer.time)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 8,
    borderWidth: 1,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  name: {
    flex: 1,
    fontSize: 17,
    fontFamily: 'Inter_600SemiBold',
  },
  badge: {
    backgroundColor: 'rgba(0,0,0,0.18)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginRight: 12,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
  },
  time: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    minWidth: 52,
    textAlign: 'right',
  },
});
