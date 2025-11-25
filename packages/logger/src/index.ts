// packages/logger/src/index.ts
import pino from 'pino';

export type LoggerProps = {
  service: string;
};

// 🔹 Asia/Seoul 고정 포맷터
const seoulFormatter = new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'Asia/Seoul',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
});

export function createLogger({ service }: LoggerProps) {
  const isProd = process.env.NODE_ENV === 'production';

  return pino({
    level: 'info',
    base: { service },

    // 🔹 pino timestamp 포맷을 Asia/Seoul 기준으로 직접 생성
    timestamp: () => {
      const parts = seoulFormatter.formatToParts(new Date());
      const m: Record<string, string> = {};
      for (const p of parts) {
        if (p.type !== 'literal') m[p.type] = p.value;
      }
      const time = `${m.year}-${m.month}-${m.day} ${m.hour}:${m.minute}:${m.second}`;
      return `,"time":"${time}"`;
    },

    transport: isProd
      ? undefined // 운영: JSON 출력 (time은 이미 KST)
      : {
          target: 'pino-pretty',
          options: {
            colorize: true,
            // 🔹 time은 우리가 직접 포맷했으니 다시 translateTime 할 필요 없음
            ignore: 'pid,hostname',
          },
        },
  });
}
