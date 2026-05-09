/**
 * NotificationService — local scheduled push notifications for daily challenge reminders.
 *
 * Uses expo-notifications for scheduling; no server required.
 * Web: uses the service worker push handler in public/sw.js.
 * Native: triggers a local notification at the scheduled time each day.
 *
 * Usage:
 *   await NotificationService.requestPermission()
 *   await NotificationService.scheduleDailyReminder({ hour: 19, minute: 0 })
 *   await NotificationService.cancelDailyReminder()
 */
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const DAILY_REMINDER_ID = 'daily-challenge-reminder';
const CHANNEL_ID = 'daily-challenge';

export type ReminderTime = { hour: number; minute: number };

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const NotificationService = {
  /**
   * Request notification permission from the user.
   * Returns true if granted.
   */
  async requestPermission(): Promise<boolean> {
    if (Platform.OS === 'web') {
      if (!('Notification' in window)) return false;
      const result = await window.Notification.requestPermission();
      return result === 'granted';
    }

    const existing = await Notifications.getPermissionsAsync();
    if (existing.granted) return true;

    const { granted } = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
      },
    });
    return granted;
  },

  /**
   * Check whether permission is already granted without prompting.
   */
  async hasPermission(): Promise<boolean> {
    if (Platform.OS === 'web') {
      return 'Notification' in window && window.Notification.permission === 'granted';
    }
    const { granted } = await Notifications.getPermissionsAsync();
    return granted;
  },

  /**
   * Schedule a repeating daily reminder at the given local time.
   * Cancels any existing reminder first.
   */
  async scheduleDailyReminder(time: ReminderTime = { hour: 19, minute: 0 }): Promise<string | null> {
    if (Platform.OS === 'web') {
      // Web push scheduling is handled by the service worker on the server side.
      // For local web, we just store the preference.
      return null;
    }

    await this.cancelDailyReminder();

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
        name: 'Daily Challenge',
        description: 'Reminder to complete your daily quiz challenge',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#6C63FF',
      });
    }

    const id = await Notifications.scheduleNotificationAsync({
      identifier: DAILY_REMINDER_ID,
      content: {
        title: '🇹🇿 Mtaa Quiz Battle',
        body: 'Changamoto ya Leo inakungoja! / Today\'s Daily Challenge awaits! 🎯',
        data: { screen: 'daily' },
        sound: true,
        ...(Platform.OS === 'android' ? { channelId: CHANNEL_ID } : {}),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: time.hour,
        minute: time.minute,
      },
    });

    return id;
  },

  /**
   * Cancel the daily reminder notification.
   */
  async cancelDailyReminder(): Promise<void> {
    if (Platform.OS === 'web') return;
    await Notifications.cancelScheduledNotificationAsync(DAILY_REMINDER_ID).catch(() => {});
  },

  /**
   * Check if a daily reminder is currently scheduled.
   */
  async isDailyReminderScheduled(): Promise<boolean> {
    if (Platform.OS === 'web') return false;
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    return scheduled.some((n) => n.identifier === DAILY_REMINDER_ID);
  },

  /**
   * Handle a notification tap — returns the screen to navigate to.
   */
  getInitialNotificationScreen(): Promise<string | null> {
    return Notifications.getLastNotificationResponseAsync().then((response) => {
      const data = response?.notification.request.content.data as Record<string, string> | undefined;
      return data?.screen ?? null;
    });
  },

  /**
   * Add a listener that fires when a notification is tapped while app is foregrounded.
   */
  addResponseListener(callback: (screen: string) => void) {
    return Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as Record<string, string> | undefined;
      if (data?.screen) callback(data.screen);
    });
  },
};
