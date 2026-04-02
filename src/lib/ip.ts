import { logger } from './logger';

export async function getUserIP(): Promise<string> {
  // Try multiple services in case one is blocked
  const services = [
    'https://api.ipify.org?format=json',
    'https://ipapi.co/json/',
    'https://api.seeip.org/jsonip'
  ];

  for (const service of services) {
    try {
      const response = await fetch(service, { 
        signal: AbortSignal.timeout(3000) // 3s timeout per service
      });
      if (!response.ok) continue;
      
      const data = await response.json();
      const ip = data.ip || data.ip_address || data.query;
      if (ip) return ip;
    } catch (error) {
      // Silently try next service
      continue;
    }
  }

  logger.warn('All IP fetching services failed');
  return 'unknown';
}
