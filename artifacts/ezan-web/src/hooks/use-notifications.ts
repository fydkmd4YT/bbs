import { useEffect, useRef } from 'react';
import { PrayerTimeData } from './use-prayer-times';

export type ReminderSettings = Record<string, number>; // prayer name -> minutes before (0 = off)

const STORAGE_KEY = 'ezan_reminder_settings';

export function useNotifications(prayerTimes: PrayerTimeData[]) {
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);

  useEffect(() => {
    // Clear existing timeouts
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];

    // Request notification permission if not granted
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Load settings
    const settingsJson = localStorage.getItem(STORAGE_KEY);
    if (!settingsJson) return;

    const settings: ReminderSettings = JSON.parse(settingsJson);

    // Schedule notifications
    prayerTimes.forEach((prayer) => {
      const minutesBefore = settings[prayer.name];
      if (!minutesBefore || minutesBefore === 0) return;

      const notificationTime = new Date(prayer.time.getTime() - minutesBefore * 60 * 1000);
      const now = new Date();
      const delay = notificationTime.getTime() - now.getTime();

      if (delay > 0) {
        const timeout = setTimeout(() => {
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Ezan Vakti Yaklaşıyor', {
              body: `${prayer.turkishName} namazına ${minutesBefore} dakika kaldı`,
              icon: '/ezan-web/logo.jpg',
              tag: `prayer-${prayer.name}`,
            });
          }
        }, delay);

        timeoutsRef.current.push(timeout);
      }
    });

    return () => {
      timeoutsRef.current.forEach(clearTimeout);
      timeoutsRef.current = [];
    };
  }, [prayerTimes]);
}

export function getReminderSettings(): ReminderSettings {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  // Default: all off
  return {
    fajr: 0,
    dhuhr: 0,
    asr: 0,
    maghrib: 0,
    isha: 0,
  };
}

export function saveReminderSettings(settings: ReminderSettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}
