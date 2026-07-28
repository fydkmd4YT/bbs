import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors } from '@/hooks/useColors';
import { usePrayer, PRAYER_KEYS, PRAYER_NAMES, type PrayerKey } from '@/context/PrayerContext';

const REMINDER_OPTIONS = [0, 5, 10, 15, 20, 30];

function ReminderRow({ prayerKey }: { prayerKey: PrayerKey }) {
  const colors = useColors();
  const { settings, updateReminder } = usePrayer();
  const current = settings[prayerKey];

  return (
    <View style={[styles.reminderRow, { borderBottomColor: colors.border }]}>
      <Text style={[styles.reminderPrayerName, { color: colors.foreground }]}>
        {PRAYER_NAMES[prayerKey]}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipScroll}
        contentContainerStyle={styles.chipContainer}
      >
        {REMINDER_OPTIONS.map((opt) => {
          const isSelected = current === opt;
          return (
            <TouchableOpacity
              key={opt}
              onPress={() => updateReminder(prayerKey, opt)}
              activeOpacity={0.7}
              style={[
                styles.chip,
                {
                  backgroundColor: isSelected ? colors.primary : colors.muted,
                  borderColor: isSelected ? colors.primary : colors.border,
                  borderRadius: colors.radius / 1.5,
                },
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: isSelected ? colors.primaryForeground : colors.mutedForeground },
                ]}
              >
                {opt === 0 ? 'Kapalı' : `${opt} dk`}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const gradientColors: [string, string, string] =
    colors.background === '#0D0520'
      ? ['#1A0535', '#0D0520', '#110A28']
      : ['#EDE5FF', '#FAF5FF', '#F5EFFF'];

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
        <Text style={[styles.pageTitle, { color: colors.foreground }]}>Ayarlar</Text>

        {/* Reminder Settings */}
        <View style={[styles.card, { backgroundColor: colors.card, borderRadius: colors.radius, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.mutedForeground }]}>
            Hatirlatici Suresi
          </Text>
          <Text style={[styles.cardSubtitle, { color: colors.mutedForeground }]}>
            Namaz vaktinden kac dakika once bildirim almak istiyorsunuz?
          </Text>
          {PRAYER_KEYS.map((key) => (
            <ReminderRow key={key} prayerKey={key} />
          ))}
        </View>

        {/* About */}
        <View
          style={[
            styles.card,
            styles.aboutCard,
            { backgroundColor: colors.card, borderRadius: colors.radius, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.cardTitle, { color: colors.mutedForeground }]}>Hakkinda</Text>
          <View style={styles.logoWrap}>
            <Image
              source={require('@/assets/images/icon.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <Text style={[styles.appName, { color: colors.foreground }]}>Ezan Vakti</Text>
          <Text style={[styles.teamName, { color: colors.primary }]}>Bombom Team</Text>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <Text style={[styles.versionText, { color: colors.mutedForeground }]}>Surum 1.0.0</Text>
          <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
            Konum bazli namaz vakitleri. Turkiye Diyanet takvimi kullanilmaktadir.
          </Text>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { paddingHorizontal: 20 },
  pageTitle: {
    fontSize: 28,
    fontFamily: 'Inter_700Bold',
    marginBottom: 20,
  },
  card: {
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
  },
  cardTitle: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    marginBottom: 16,
    lineHeight: 18,
  },
  reminderRow: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  reminderPrayerName: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 8,
  },
  chipScroll: { flexGrow: 0 },
  chipContainer: { gap: 8, paddingRight: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
  aboutCard: {
    alignItems: 'center',
  },
  logoWrap: {
    marginVertical: 16,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 22,
  },
  appName: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    marginBottom: 4,
  },
  teamName: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 16,
  },
  divider: {
    width: '60%',
    height: StyleSheet.hairlineWidth,
    marginBottom: 16,
  },
  versionText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 8,
  },
});
