import Redis from "ioredis";

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

export const redis = globalForRedis.redis ?? new Redis(process.env.REDIS_URL || "", {
  password: process.env.REDIS_TOKEN,
  tls: process.env.REDIS_URL?.startsWith("https") ? {} : undefined,
});

if (!globalForRedis.redis) {
  globalForRedis.redis = redis;
}

const RATE_LIMIT_WINDOW = 60;
const RATE_LIMIT_MAX = 1;

const CODE_TTL = 300;
const PENDING_REG_TTL = 900;
const RESET_TTL = 600;

export async function rateLimit(ip: string, target: string): Promise<boolean> {
  const ipKey = `rate:ip:${ip}`;
  const targetKey = `rate:target:${target}`;

  const [ipCount, targetCount] = await Promise.all([
    redis.get(ipKey),
    redis.get(targetKey),
  ]);

  if (ipCount && parseInt(ipCount) >= RATE_LIMIT_MAX) {
    console.error(`[SECURITY] Rate limit exceeded for IP: ${ip}`);
    return false;
  }

  if (targetCount && parseInt(targetCount) >= RATE_LIMIT_MAX) {
    console.error(`[SECURITY] Rate limit exceeded for target: ${target}`);
    return false;
  }

  await Promise.all([
    redis.setex(ipKey, RATE_LIMIT_WINDOW, (parseInt(ipCount || "0") + 1).toString()),
    redis.setex(targetKey, RATE_LIMIT_WINDOW, (parseInt(targetCount || "0") + 1).toString()),
  ]);

  return true;
}

export async function setPendingReg(id: string, data: {
  username: string;
  passwordHash: string;
  email?: string;
  telegramChatId?: string;
  method: "email" | "telegram";
}): Promise<void> {
  await redis.setex(`pending_reg:${id}`, PENDING_REG_TTL, JSON.stringify(data));
}

export async function getPendingReg(id: string): Promise<{
  username: string;
  passwordHash: string;
  email?: string;
  telegramChatId?: string;
  method: "email" | "telegram";
} | null> {
  const data = await redis.get(`pending_reg:${id}`);
  return data ? JSON.parse(data) : null;
}

export async function deletePendingReg(id: string): Promise<void> {
  await redis.del(`pending_reg:${id}`);
  await redis.del(`code:${id}`);
}

export async function setCode(userId: string, code: string): Promise<void> {
  await redis.del(`code:${userId}`);
  await redis.setex(`code:${userId}`, CODE_TTL, code);
}

export async function getCode(userId: string): Promise<string | null> {
  return redis.get(`code:${userId}`);
}

export async function deleteCode(userId: string): Promise<void> {
  await redis.del(`code:${userId}`);
}

export async function setResetPending(id: string, userId: string): Promise<void> {
  const user = await redis.get(`pending_reg:${id}`);

  await redis.setex(`reset_pending:${id}`, RESET_TTL, userId);

  if (user) {
    const userData = JSON.parse(user);
    if (userData.telegramChatId) {
      await redis.setex(`reset:${userData.telegramChatId}`, RESET_TTL, id);
    }
  }
}

export async function getResetPending(id: string): Promise<string | null> {
  return redis.get(`reset_pending:${id}`);
}

export async function deleteResetPending(id: string): Promise<void> {
  await redis.del(`reset_pending:${id}`);
  await redis.del(`code:reset:${id}`);
}

export async function isRedisAvailable(): Promise<boolean> {
  try {
    await redis.ping();
    return true;
  } catch {
    return false;
  }
}