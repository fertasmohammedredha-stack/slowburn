export function notificationsSupported() {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function permissionState() {
  return notificationsSupported() ? Notification.permission : 'unsupported';
}

export async function requestPermission() {
  if (!notificationsSupported()) return 'unsupported';
  if (Notification.permission !== 'default') return Notification.permission;
  try {
    return await Notification.requestPermission();
  } catch {
    return Notification.permission;
  }
}

export function sendNotification(title, body) {
  if (!notificationsSupported() || Notification.permission !== 'granted') return false;
  try {
    new Notification(title, { body, tag: 'slowburn', silent: true });
    return true;
  } catch {
    return false;
  }
}
