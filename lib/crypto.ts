import { createHash, randomBytes, pbkdf2Sync } from "crypto";

/**
 * 密码哈希配置
 */
const SALT_LENGTH = 32; // 盐值长度（字节）
const ITERATIONS = 100000; // PBKDF2 迭代次数
const KEY_LENGTH = 64; // 密钥长度（字节）
const HASH_ALGORITHM = "sha256"; // 哈希算法

/**
 * 生成随机盐值
 */
function generateSalt(): string {
  return randomBytes(SALT_LENGTH).toString("hex");
}

/**
 * 使用 PBKDF2 哈希密码
 * @param password 明文密码
 * @param salt 盐值（可选，如果不提供则自动生成）
 * @returns 格式为 "salt:hash" 的字符串
 */
export function hashPassword(password: string, salt?: string): string {
  const saltValue = salt || generateSalt();
  const hash = pbkdf2Sync(
    password,
    saltValue,
    ITERATIONS,
    KEY_LENGTH,
    HASH_ALGORITHM
  ).toString("hex");
  
  return `${saltValue}:${hash}`;
}

/**
 * 验证密码
 * @param password 明文密码
 * @param hashedPassword 格式为 "salt:hash" 的哈希密码
 * @returns 密码是否匹配
 */
export function verifyPassword(password: string, hashedPassword: string): boolean {
  try {
    const [salt, hash] = hashedPassword.split(":");
    
    if (!salt || !hash) {
      return false;
    }
    
    const computedHash = pbkdf2Sync(
      password,
      salt,
      ITERATIONS,
      KEY_LENGTH,
      HASH_ALGORITHM
    ).toString("hex");
    
    // 使用时间安全的比较函数防止时序攻击
    return timingSafeEqual(computedHash, hash);
  } catch (error) {
    console.error("密码验证错误:", error);
    return false;
  }
}

/**
 * 时间安全的字符串比较（防止时序攻击）
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  
  return result === 0;
}

