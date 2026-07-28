import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useColors } from '@/hooks/useColors';
import { usePrayer } from '@/context/PrayerContext';
import { PrayerCard } from '@/components/PrayerCard';

function getTurkishDate(): string {
  return new Date().toLocaleDateString('tr-TR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { prayers, nextPrayer, countdown, loading, locationName, userName } = usePrayer();

  const pulse = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.03, { duration: 1200 }),
        withTiming(1, { duration: 1200 }),
      ),
      -1,
      true,
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const gradientColors: [string, string, string] =
    colors.background === '#0D0520'
      ? ['#1A0535', '#0D0520', '#110A28']
      : ['#EDE5FF', '#FAF5FF', '#F5EFFF'];

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <LinearGradient colors={gradientColors} style={styles.flex}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: topPad + 16, paddingBottom: bottomPad + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={14} color={colors.mutedForeground} />
            <Text style={[styles.locationText, { color: colors.mutedForeground }]}>
              {locationName}
            </Text>
          </View>
          <Text style={[styles.dateText, { color: colors.foreground }]}>
            {getTurkishDate()}
          </Text>
          {userName ? (
            <View style={styles.greetingRow}>
              <Ionicons name="hand-right-outline" size={18} color={colors.primary} />
              <Text style={[styles.greetingText, { color: colors.primary }]}>
                Merhaba, {userName}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Next Prayer Hero */}
        {nextPrayer && (
          <Animated.View style={[pulseStyle, styles.heroWrap]}>
            <LinearGradient
              colors={['#7B2FBE', '#F5A623']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.heroCard, { borderRadius: colors.radius + 4 }]}
            >
              <Text style={styles.heroLabel}>Siradaki Namaz</Text>
              <Text style={styles.heroName}>{nextPrayer.name}</Text>
              <View style={styles.countdownRow}>
                <Ionicons name="time-outline" size={18} color="rgba(255,255,255,0.8)" />
                <Text style={styles.countdownText}>{countdown}</Text>
              </View>
              <Text style={styles.heroTime}>
                {nextPrayer.time.toLocaleTimeString('tr-TR', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false,
                })}
              </Text>
            </LinearGradient>
          </Animated.View>
        )}

        {/* Prayer List */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
            Bugunun Vakitleri
          </Text>
          {prayers.map((prayer) => (
            <PrayerCard key={prayer.key} prayer={prayer} />
          ))}
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: 20 },
  header: { marginBottom: 24 },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  locationText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
  dateText: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    marginBottom: 6,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  greetingText: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  heroWrap: { marginBottom: 4 },
  heroCard: {
    padding: 28,
    alignItems: 'center',
    shadowColor: '#7B2FBE',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 12,
  },
  heroLabel: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: 'rgba(255,255,255,0.8)',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  heroName: {
    fontSize: 52,
    fontFamily: 'Inter_700Bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  countdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  countdownText: {
    fontSize: 24,
    fontFamily: 'Inter_600SemiBold',
    color: 'rgba(255,255,255,0.92)',
    letterSpacing: 2,
  },
  heroTime: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
    color: 'rgba(255,255,255,0.65)',
  },
  section: { marginTop: 24 },
  sectionTitle: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 10,
  },
});
