import { useEffect, useState } from 'react';
import { useTaskStore } from '@/store/taskStore';
import { useAuthStore } from '@/store/authStore';
import { insforge, isInsforgeConfigured } from '@/lib/insforge';
import {
  htmlToPlainText,
  isPlanLimitedEmailError,
  pushBrowserNotification,
} from '@/lib/notifications';

const TASK_NOTIFIED_EVENTS_STORAGE_KEY = 'task-email-notified-events-v1';
const TASK_NOTIFICATION_WINDOW_MS = 90 * 1000;

type NotificationEvent = {
  key: string;
  subject: string;
  html: string;
  label: string;
};

const parseTaskDate = (value: Date | string | null | undefined) => {
  if (!value) {
    return null;
  }
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const loadNotifiedEvents = (): Record<string, string> => {
  if (typeof window === 'undefined') {
    return {};
  }

  try {
    const raw = localStorage.getItem(TASK_NOTIFIED_EVENTS_STORAGE_KEY);
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw) as Record<string, string>;
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
};

const trimNotifiedEvents = (events: Record<string, string>) => {
  const entries = Object.entries(events);
  if (entries.length <= 1500) {
    return events;
  }
  const sorted = entries.sort((a, b) => new Date(a[1]).getTime() - new Date(b[1]).getTime());
  const trimmed = sorted.slice(Math.max(0, sorted.length - 1000));
  return Object.fromEntries(trimmed);
};

export function TaskEmailScheduler() {
  const tasks = useTaskStore((s) => s.tasks);
  const setStatusMessage = useTaskStore((s) => s.setStatusMessage);
  const user = useAuthStore((s) => s.user);
  const [notifiedEvents, setNotifiedEvents] = useState<Record<string, string>>(loadNotifiedEvents);

  useEffect(() => {
    localStorage.setItem(
      TASK_NOTIFIED_EVENTS_STORAGE_KEY,
      JSON.stringify(trimNotifiedEvents(notifiedEvents))
    );
  }, [notifiedEvents]);

  useEffect(() => {
    let cancelled = false;
    let running = false;

    const tick = async () => {
      if (running) {
        return;
      }

      running = true;
      try {
        const now = Date.now();
        const dueNotifications: NotificationEvent[] = [];
        const pendingMarks: Record<string, string> = {};

        for (const task of tasks) {
          if (task.completed) {
            continue;
          }

          const dueAt = parseTaskDate(task.dueAt);
          if (!dueAt) {
            continue;
          }

          const taskTitle = task.title.trim() || 'Task';
          const safeTitle = escapeHtml(taskTitle);
          const startDelta = now - dueAt.getTime();
          const startKey = `${task.id}:start`;
          if (startDelta >= 0 && startDelta <= TASK_NOTIFICATION_WINDOW_MS && !notifiedEvents[startKey]) {
            dueNotifications.push({
              key: startKey,
              label: `Start reminder for ${taskTitle}`,
              subject: `Your task is started: ${taskTitle}`,
              html: `<h2>Task Started</h2><p><strong>Task:</strong> ${safeTitle}</p><p><strong>Start time:</strong> ${escapeHtml(
                dueAt.toLocaleString()
              )}</p>`,
            });
          }

          const restMinutes = typeof task.restMinutes === 'number' ? task.restMinutes : null;
          if (restMinutes && restMinutes > 0) {
            const restAt = new Date(dueAt.getTime() + restMinutes * 60 * 1000);
            const restDelta = now - restAt.getTime();
            const restKey = `${task.id}:rest`;
            if (restDelta >= 0 && restDelta <= TASK_NOTIFICATION_WINDOW_MS && !notifiedEvents[restKey]) {
              dueNotifications.push({
                key: restKey,
                label: `Rest reminder for ${taskTitle}`,
                subject: `Rest time reminder: ${taskTitle}`,
                html: `<h2>Rest Time Reminder</h2><p><strong>Task:</strong> ${safeTitle}</p><p><strong>Rest after:</strong> ${restMinutes} minutes</p><p><strong>Reminder time:</strong> ${escapeHtml(
                  restAt.toLocaleString()
                )}</p>`,
              });
            }
          }
        }

        if (dueNotifications.length === 0 || cancelled) {
          return;
        }

        for (const notification of dueNotifications) {
          if (cancelled || notifiedEvents[notification.key] || pendingMarks[notification.key]) {
            continue;
          }

          const fallbackShown = () =>
            pushBrowserNotification(notification.subject, htmlToPlainText(notification.html));

          if (!user?.email || !insforge || !isInsforgeConfigured) {
            const shown = fallbackShown();
            setStatusMessage(
              shown
                ? `${notification.label} sent as browser notification.`
                : `${notification.label} is due.`
            );
            setTimeout(() => setStatusMessage(undefined), 3200);
            pendingMarks[notification.key] = new Date().toISOString();
            continue;
          }

          const recipientEmail = user.email;
          const { error } = await insforge.emails.send({
            to: recipientEmail,
            subject: notification.subject,
            html: notification.html,
          });

          if (!error) {
            pendingMarks[notification.key] = new Date().toISOString();
            setStatusMessage(`${notification.label} sent to ${recipientEmail}`);
            setTimeout(() => setStatusMessage(undefined), 2200);
            continue;
          }

          const isPlanError = isPlanLimitedEmailError(error.message || '');
          if (isPlanError) {
            const shown = fallbackShown();
            setStatusMessage(
              shown
                ? `Email disabled on free plan. Browser notification sent for ${notification.label}.`
                : `Email disabled on free plan. Upgrade plan to receive email notifications.`
            );
            setTimeout(() => setStatusMessage(undefined), 6200);
            pendingMarks[notification.key] = new Date().toISOString();
            continue;
          }

          setStatusMessage(error.message || 'Task email notification failed.');
          setTimeout(() => setStatusMessage(undefined), 3200);
        }

        if (Object.keys(pendingMarks).length > 0 && !cancelled) {
          setNotifiedEvents((prev) => trimNotifiedEvents({ ...prev, ...pendingMarks }));
        }
      } finally {
        running = false;
      }
    };

    void tick();
    const intervalId = window.setInterval(() => {
      void tick();
    }, 60 * 1000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [tasks, notifiedEvents, setStatusMessage, user?.email]);

  return null;
}

export default TaskEmailScheduler;
