/**
 * Simple logger utility to mask sensitive data in production
 */

const isProd = import.meta.env.PROD;

const maskData = (data: any): any => {
  if (typeof data !== 'object' || data === null) return data;
  if (Array.isArray(data)) return data.map(maskData);

  const masked: any = {};
  for (const key in data) {
    if (['password', 'token', 'key', 'secret', 'auth', 'credential'].some(k => key.toLowerCase().includes(k))) {
      masked[key] = '[MASKED]';
    } else if (typeof data[key] === 'object') {
      masked[key] = maskData(data[key]);
    } else {
      masked[key] = data[key];
    }
  }
  return masked;
};

export const logger = {
  log: (...args: any[]) => {
    if (!isProd) {
      console.log(...args);
    }
  },
  error: (...args: any[]) => {
    if (isProd) {
      const maskedArgs = args.map(arg => maskData(arg));
      console.error(...maskedArgs);
    } else {
      console.error(...args);
    }
  },
  warn: (...args: any[]) => {
    if (!isProd) {
      console.warn(...args);
    }
  },
  info: (...args: any[]) => {
    if (!isProd) {
      console.info(...args);
    }
  },
  // Specific method for sensitive data
  sensitive: (label: string, data: any) => {
    if (isProd) {
      // Mask sensitive data in production
      console.log(`${label}: [MASKED]`);
    } else {
      console.log(`${label}:`, data);
    }
  }
};
