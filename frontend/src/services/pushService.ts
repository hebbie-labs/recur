import api from "./api";

// Web Push benötigt den öffentlichen VAPID-Schlüssel als Uint8Array, der
// Browser (applicationServerKey) erwartet aber URL-safe Base64 vom Server -
// Standard-Konvertierung, siehe MDN Push API Beispiele.
function urlBase64ToUint8Array(base64Url: string): Uint8Array {
  const padding = "=".repeat((4 - (base64Url.length % 4)) % 4);
  const base64 = (base64Url + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export function isPushSupported(): boolean {
  return typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window;
}

async function getVapidPublicKey(): Promise<string> {
  const response = await api.get<{ publicKey: string }>("/push/vapid-public-key");
  return response.data.publicKey;
}

// Fragt Browser-Berechtigung an, abonniert Push über den bereits von
// next-pwa registrierten Service Worker und meldet die Subscription beim
// Backend an. Wirft, wenn Berechtigung verweigert wird oder kein VAPID-Key
// konfiguriert ist - der Aufrufer setzt den pushEnabled-Toggle dann zurück.
export async function enablePushNotifications(): Promise<void> {
  if (!isPushSupported()) {
    throw new Error("Push-Benachrichtigungen werden von diesem Browser nicht unterstützt");
  }

  const publicKey = await getVapidPublicKey();
  if (!publicKey) {
    throw new Error("Push-Benachrichtigungen sind serverseitig nicht konfiguriert");
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error("Berechtigung für Benachrichtigungen wurde nicht erteilt");
  }

  const registration = await navigator.serviceWorker.ready;
  const subscription =
    (await registration.pushManager.getSubscription()) ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
    }));

  const json = subscription.toJSON();
  await api.post("/push/subscriptions", {
    endpoint: json.endpoint,
    keys: json.keys,
  });
}

export async function disablePushNotifications(): Promise<void> {
  if (!isPushSupported()) {
    return;
  }

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    return;
  }

  await subscription.unsubscribe();
  await api.delete("/push/subscriptions", { params: { endpoint: subscription.endpoint } });
}
