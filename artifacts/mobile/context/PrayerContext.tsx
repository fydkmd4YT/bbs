import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { Coordinates, PrayerTimes, CalculationMethod } from 'adhan';

export type PrayerKey = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';

export const PRAYER_NAMES: Record<PrayerKey, string> = {
  fajr: 'Sabah',
  dhuhr: 'Öğle',
  asr: 'İkindi',
  maghrib: 'Akşam',
  isha: 'Yatsı',
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

type RawTimes = Record<PrayerKey, Date>;

// --- Local adhan fallback ---
function computeLocal(lat: number, lng: number, date: Date): RawTimes {
  const coords = new Coordinates(lat, lng);
  const pt = new PrayerTimes(coords, date, CalculationMethod.Turkey());
  return { fajr: pt.fajr, dhuhr: pt.dhuhr, asr: pt.asr, maghrib: pt.maghrib, isha: pt.isha };
}

// --- Aladhan API (Diyanet method = 13) ---
async function fetchTimesFromAPI(lat: number, lng: number, date: Date): Promise<RawTimes> {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  const res = await fetch(
    `https://api.aladhan.com/v1/timings/${dd}-${mm}-${yyyy}?latitude=${lat}&longitude=${lng}&method=13`,
  );
  if (!res.ok) throw new Error('API error');
  const json = await res.json();
  if (json.code !== 200) throw new Error('API error');
  const t = json.data.timings as Record<string, string>;

  const parse = (s: string) => {
    const clean = s.replace(/\s*\(.*?\)/, '');
    const [h, m] = clean.split(':').map(Number);
    const d = new Date(date);
    d.setHours(h, m, 0, 0);
    return d;
  };

  return {
    fajr: parse(t['Fajr']),
    dhuhr: parse(t['Dhuhr']),
    asr: parse(t['Asr']),
    maghrib: parse(t['Maghrib']),
    isha: parse(t['Isha']),
  };
}

// Fetch with adhan fallback
async function fetchTimes(lat: number, lng: number, date: Date): Promise<RawTimes> {
  try {
    return await fetchTimesFromAPI(lat, lng, date);
  } catch {
    return computeLocal(lat, lng, date);
  }
}

// --- Nominatim reverse geocoding (all platforms) ---
async function fetchCityName(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=tr`,
      { headers: { 'User-Agent': 'EzanVakti/1.0' } },
    );
    const json = await res.json();
    const a = json.address ?? {};
    return a.city ?? a.town ?? a.municipality ?? a.county ?? a.state ?? 'Bilinmiyor';
  } catch {
    return 'Bilinmiyor';
  }
}

function formatCountdown(diffMs: number): string {
  if (diffMs <= 0) return 'Vakit geldi';
  const total = Math.floor(diffMs / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

async function scheduleReminders(
  userName: string,
  settings: ReminderSettings,
  todayTimes: RawTimes,
  tomorrowTimes: RawTimes,
): Promise<void> {
  if (Platform.OS === 'web' || !userName) return;
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') return;
    await Notifications.cancelAllScheduledNotificationsAsync();
    const now = new Date();
    for (const [times] of [[todayTimes], [tomorrowTimes]] as [RawTimes][]) {
      for (const key of PRAYER_KEYS) {
        const minutes = settings[key];
        if (!minutes) continue;
        const notifTime = new Date(times[key].getTime() - minutes * 60 * 1000);
        if (notifTime <= now) continue;
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Ezan Vakti',
            body: `${userName}, ${PRAYER_NAMES[key]} vaktine ${minutes} dakika kaldı`,
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
  const [locationName, setLocationName] = useState('İstanbul');
  const [settings, setSettings] = useState<ReminderSettings>(DEFAULT_SETTINGS);
  const [prayers, setPrayers] = useState<PrayerInfo[]>([]);
  const [nextPrayer, setNextPrayer] = useState<PrayerInfo | null>(null);
  const [countdown, setCountdown] = useState('');
  const [userName, setUserNameState] = useState('');
  const [todayTimes, setTodayTimes] = useState<RawTimes | null>(null);
  const [tomorrowTimes, setTomorrowTimes] = useState<RawTimes | null>(null);

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

  // Get location + city name
  useEffect(() => {
    async function getLocation() {
      try {
        if (Platform.OS === 'web') {
          if (typeof navigator !== 'undefined' && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              async (pos) => {
                const { latitude, longitude } = pos.coords;
                setCoords({ lat: latitude, lng: longitude });
                const name = await fetchCityName(latitude, longitude);
                setLocationName(name);
              },
              () => {},
              { timeout: 6000 },
            );
          }
          return;
        }
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          const { latitude, longitude } = loc.coords;
          setCoords({ lat: latitude, lng: longitude });
          const name = await fetchCityName(latitude, longitude);
          setLocationName(name);
        }
      } catch {}
    }
    getLocation();
  }, []);

  // Fetch prayer times from API (today + tomorrow)
  useEffect(() => {
    async function load() {
      setLoading(true);
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const [t, tm] = await Promise.all([
        fetchTimes(coords.lat, coords.lng, today),
        fetchTimes(coords.lat, coords.lng, tomorrow),
      ]);
      setTodayTimes(t);
      setTomorrowTimes(tm);
      setLoading(false);
    }
    load();
  }, [coords]);

  // Live countdown + prayer list (every second, uses cached times)
  useEffect(() => {
    if (!todayTimes) return;

    const update = () => {
      const now = new Date();
      const upcomingKey = PRAYER_KEYS.find((k) => todayTimes[k] > now);

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
      } else if (tomorrowTimes) {
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
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [todayTimes, tomorrowTimes]);

  // Schedule notifications when times, settings or userName change
  useEffect(() => {
    if (userName && todayTimes && tomorrowTimes) {
      scheduleReminders(userName, settings, todayTimes, tomorrowTimes);
    }
  }, [userName, settings, todayTimes, tomorrowTimes]);

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
