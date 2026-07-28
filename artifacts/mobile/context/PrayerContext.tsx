import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { Coordinates, PrayerTimes, CalculationMethod } from 'adhan';

export type PrayerKey = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';

export const PRAYER_NAMES: Record<PrayerKey, string> = {
  fajr: 'Sabah',
  dhuhr: 'Ogle',
  asr: 'Ikindi',
  maghrib: 'Aksam',
  isha: 'Yatsi',
};

export const PRAYER_KEYS: PrayerKey[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

export interface PrayerInfo {
  key: PrayerKey;
  name: string;
  time: Date;
  isPast: boolean;
  isNext: boolean;
}

export interface ReminderSettings {
  fajr: number;
  dhuhr: number;
  asr: number;
  maghrib: number;
  isha: number;
}

const DEFAULT_SETTINGS: ReminderSettings = {
  fajr: 10,
  dhuhr: 10,
  asr: 10,
  maghrib: 10,
  isha: 10,
};

const SETTINGS_KEY = '@prayer_reminder_settings';
export const USER_NAME_KEY = '@user_name';

interface PrayerContextType {
  prayers: PrayerInfo[];
  nextPrayer: PrayerInfo | null;
  countdown: string;
  settings: ReminderSettings;
  updateReminder: (key: PrayerKey, minutes: number) => void;
  loading: boolean;
  locationName: string;
  userName: string;
  setUserName: (name: string) => void;
}

const PrayerContext = createContext<PrayerContextType | null>(null);

interface RawTimes {
  fajr: Date;
  dhuhr: Date;
  asr: Date;
  maghrib: Date;
  isha: Date;
}

function computeTimes(lat: number, lng: number, date: Date): RawTimes {
  const coords = new Coordinates(lat, lng);
  const params = CalculationMethod.Turkey();
  const pt = new PrayerTimes(coords, date, params);
  return { fajr: pt.fajr, dhuhr: pt.dhuhr, asr: pt.asr, maghrib: pt.maghrib, isha: pt.isha };
}

function formatCountdown(diffMs: number): string {
  if (diffMs <= 0) return 'Vakit geldi';
  const totalSeconds = Math.floor(diffMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const ss = seconds.toString().padStart(2, '0');
  const mm = minutes.toString().padStart(2, '0');
  if (hours > 0) return `${hours}:${mm}:${ss}`;
  return `${mm}:${ss}`;
}

async function scheduleReminders(
  userName: string,
  lat: number,
  lng: number,
  settings: ReminderSettings,
): Promise<void> {
  if (Platform.OS === 'web' || !userName) return;
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') return;

    await Notifications.cancelAllScheduledNotificationsAsync();

    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    for (const date of [now, tomorrow]) {
      const times = computeTimes(lat, lng, date);
      for (const key of PRAYER_KEYS) {
        const minutes = settings[key];
        if (!minutes) continue;
        const notifTime = new Date(times[key].getTime() - minutes * 60 * 1000);
        if (notifTime <= now) continue;

        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Ezan Vakti',
            body: `${userName}, ${PRAYER_NAMES[key]} vaktine ${minutes} dakika kaldi`,
            sound: true,
          },
          trigger: { date: notifTime } as Notifications.DateTriggerInput,
        });
      }
    }
  } catch {}
}

export function PrayerProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [coords, setCoords] = useState({ lat: 41.0082, lng: 28.9784 });
  const [locationName, setLocationName] = useState('Istanbul');
  const [settings, setSettings] = useState<ReminderSettings>(DEFAULT_SETTINGS);
  const [prayers, setPrayers] = useState<PrayerInfo[]>([]);
  const [nextPrayer, setNextPrayer] = useState<PrayerInfo | null>(null);
  const [countdown, setCountdown] = useState('');
  const [userName, setUserNameState] = useState('');

  // Load persisted data
  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(SETTINGS_KEY),
      AsyncStorage.getItem(USER_NAME_KEY),
    ]).then(([storedSettings, storedName]) => {
      if (storedSettings) {
        try { setSettings(JSON.parse(storedSettings)); } catch {}
      }
      if (storedName) setUserNameState(storedName);
    });
  }, []);

  // Get location
  useEffect(() => {
    async function getLocation() {
      try {
        if (Platform.OS === 'web') {
          if (typeof navigator !== 'undefined' && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
              () => {},
            );
          }
          setLoading(false);
          return;
        }
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          setCoords({ lat: loc.coords.latitude, lng: loc.coords.longitude });
          try {
            const addresses = await Location.reverseGeocodeAsync({
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
            });
            if (addresses.length > 0) {
              const addr = addresses[0];
              const city = addr.city ?? addr.district ?? addr.region ?? '';
              if (city) setLocationName(city);
            }
          } catch {}
        }
      } catch {}
      setLoading(false);
    }
    getLocation();
  }, []);

  // Live countdown + prayer list (updates every second)
  useEffect(() => {
    const update = () => {
      const now = new Date();
      const todayTimes = computeTimes(coords.lat, coords.lng, now);
      const upcomingKey = PRAYER_KEYS.find((key) => todayTimes[key] > now);

      if (upcomingKey) {
        const infos: PrayerInfo[] = PRAYER_KEYS.map((key) => ({
          key,
          name: PRAYER_NAMES[key],
          time: todayTimes[key],
          isPast: todayTimes[key] < now,
          isNext: key === upcomingKey,
        }));
        setPrayers(infos);
        const next = infos.find((p) => p.key === upcomingKey)!;
        setNextPrayer(next);
        setCountdown(formatCountdown(next.time.getTime() - now.getTime()));
      } else {
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowTimes = computeTimes(coords.lat, coords.lng, tomorrow);
        const infos: PrayerInfo[] = PRAYER_KEYS.map((key) => ({
          key,
          name: PRAYER_NAMES[key],
          time: todayTimes[key],
          isPast: true,
          isNext: false,
        }));
        setPrayers(infos);
        const tomorrowFajr: PrayerInfo = {
          key: 'fajr',
          name: PRAYER_NAMES['fajr'],
          time: tomorrowTimes.fajr,
          isPast: false,
          isNext: true,
        };
        setNextPrayer(tomorrowFajr);
        setCountdown(formatCountdown(tomorrowTimes.fajr.getTime() - now.getTime()));
      }
    };

    update();
    setLoading(false);
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [coords]);

  // Schedule notifications whenever settings, coords, or userName change
  useEffect(() => {
    if (userName) {
      scheduleReminders(userName, coords.lat, coords.lng, settings);
    }
  }, [userName, coords, settings]);

  const updateReminder = useCallback((key: PrayerKey, minutes: number) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: minutes };
      AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const setUserName = useCallback((name: string) => {
    setUserNameState(name);
    AsyncStorage.setItem(USER_NAME_KEY, name);
  }, []);

  return (
    <PrayerContext.Provider
      value={{
        prayers,
        nextPrayer,
        countdown,
        settings,
        updateReminder,
        loading,
        locationName,
        userName,
        setUserName,
      }}
    >
      {children}
    </PrayerContext.Provider>
  );
}

export function usePrayer(): PrayerContextType {
  const ctx = useContext(PrayerContext);
  if (!ctx) throw new Error('usePrayer must be used within PrayerProvider');
  return ctx;
}
