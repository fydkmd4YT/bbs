import { useState, useEffect } from 'react';
import { Coordinates, PrayerTimes, CalculationMethod } from 'adhan';

export type PrayerName = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';

export interface PrayerTimeData {
  name: PrayerName;
  turkishName: string;
  time: Date;
  isPassed: boolean;
  isNext: boolean;
}

const ISTANBUL = { latitude: 41.0082, longitude: 28.9784 };
const PRAYER_KEYS: PrayerName[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

const TURKISH_NAMES: Record<PrayerName, string> = {
  fajr: 'Sabah',
  dhuhr: 'Öğle',
  asr: 'İkindi',
  maghrib: 'Akşam',
  isha: 'Yatsı',
};

// --- Local fallback (adhan) ---
function computeLocal(lat: number, lng: number, date: Date): Record<PrayerName, Date> {
  const coords = new Coordinates(lat, lng);
  const pt = new PrayerTimes(coords, date, CalculationMethod.Turkey());
  return { fajr: pt.fajr, dhuhr: pt.dhuhr, asr: pt.asr, maghrib: pt.maghrib, isha: pt.isha };
}

// --- Aladhan API (Diyanet method = 13) ---
async function fetchTimesFromAPI(lat: number, lng: number, date: Date): Promise<Record<PrayerName, Date>> {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  const res = await fetch(
    `https://api.aladhan.com/v1/timings/${dd}-${mm}-${yyyy}?latitude=${lat}&longitude=${lng}&method=13`,
  );
  if (!res.ok) throw new Error('Aladhan API error');
  const json = await res.json();
  if (json.code !== 200) throw new Error('Aladhan API error');
  const t = json.data.timings as Record<string, string>;

  const parse = (s: string) => {
    const clean = s.replace(/\s*\(.*?\)/, ''); // strip "(BST)" etc.
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

// --- Nominatim reverse geocoding ---
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

// --- Hook ---
export function usePrayerTimes() {
  const [location, setLocation] = useState(ISTANBUL);
  const [locationName, setLocationName] = useState('İstanbul');
  const [rawTimes, setRawTimes] = useState<Record<PrayerName, Date> | null>(null);
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimeData[]>([]);
  const [nextPrayer, setNextPrayer] = useState<PrayerTimeData | null>(null);
  const [timeUntilNext, setTimeUntilNext] = useState('');
  const [loading, setLoading] = useState(true);

  // 1. Geolocation (background — doesn't block render)
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setLocation({ latitude, longitude });
        const name = await fetchCityName(latitude, longitude);
        setLocationName(name);
      },
      () => { /* stay with İstanbul */ },
      { timeout: 6000, maximumAge: 300000 },
    );
  }, []);

  // 2. Fetch prayer times from Aladhan API; fall back to adhan on error
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const times = await fetchTimesFromAPI(location.latitude, location.longitude, new Date());
        if (!cancelled) setRawTimes(times);
      } catch {
        const times = computeLocal(location.latitude, location.longitude, new Date());
        if (!cancelled) setRawTimes(times);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [location]);

  // 3. Live countdown — updates every second from cached rawTimes
  useEffect(() => {
    if (!rawTimes) return;
    const tick = () => {
      const now = new Date();
      const prayers: PrayerTimeData[] = PRAYER_KEYS.map((name) => ({
        name,
        turkishName: TURKISH_NAMES[name],
        time: rawTimes[name],
        isPassed: rawTimes[name] < now,
        isNext: false,
      }));

      let found = false;
      for (const p of prayers) {
        if (!p.isPassed && !found) { p.isNext = true; found = true; }
      }

      setPrayerTimes(prayers);
      const next = prayers.find((p) => p.isNext) ?? null;
      setNextPrayer(next);

      if (next) {
        const diff = next.time.getTime() - now.getTime();
        if (diff <= 0) { setTimeUntilNext('Vakit geldi'); return; }
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        setTimeUntilNext(
          h > 0
            ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
            : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`,
        );
      }
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [rawTimes]);

  return { prayerTimes, nextPrayer, timeUntilNext, locationName, loading };
}
