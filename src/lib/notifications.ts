export const htmlToPlainText = (value: string) =>
  value
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export const isPlanLimitedEmailError = (message: string) => {
  const normalized = message.toLowerCase();
  return (
    normalized.includes('free plan') ||
    normalized.includes('paid plans') ||
    normalized.includes('custom email service is not available')
  );
};

export const pushBrowserNotification = (title: string, body: string) => {
  if (typeof window === 'undefined' || typeof Notification === 'undefined') {
    return false;
  }

  if (Notification.permission === 'granted') {
    new Notification(title, { body });
    return true;
  }

  if (Notification.permission === 'default') {
    void Notification.requestPermission().then((permission) => {
      if (permission === 'granted') {
        new Notification(title, { body });
      }
    });
  }

  return false;
};
