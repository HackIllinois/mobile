export function getTimeRemaining(targetDate: Date, current: Date = new Date()) {
  const totalRaw = targetDate.getTime() - current.getTime();
  const total = Math.max(0, totalRaw); // clamp after target passes

  const seconds = Math.floor((total / 1000) % 60);
  const minutes = Math.floor((total / 1000 / 60) % 60);
  const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
  const days = Math.floor(total / (1000 * 60 * 60 * 24));

  return { total, days, hours, minutes, seconds };
}