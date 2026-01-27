/**
 * 错误类别枚举
 * 值对应 Crockford Base32 编码的首字符
 */
export enum ErrorCategory {
  /** 认证异常 (A) */
  AUTH = 10,
  /** 业务异常 (B) */
  BUSINESS = 11,
  /** 冲突异常 (C) */
  CONFLICT = 12,
  /** 降级异常 (D) */
  DEGRADE = 13,
  /** 功能不可用 (F) */
  FEATURE = 15,
  /** 限流异常 (R) */
  RATE_LIMIT = 24,
  /** 系统故障 (S) */
  SYSTEM = 25,
  /** 第三方服务异常 (T) */
  THIRD_PARTY = 26,
  /** 参数校验错误 (V) */
  VALIDATION = 27,
}

/**
 * 错误码构造选项
 */
export interface ErrorCodeOptions {
  /** 错误类别 */
  category: ErrorCategory
  /** 系统ID (0 - 1048575) */
  systemId: number
  /** 模块ID (0 - 1048575) */
  moduleId: number
  /** 序列号 (0 - 32767) */
  sequenceId: number
  /** 版本号，默认为0 (0 - 15) */
  version?: number
}

/**
 * 64位结构化错误码
 *
 * 位段划分:\
 * ┌──────────┬───────────┬────────────┬───────────┬───────────┐
 * │ Version  │ Category  │  System    │  Module   │    Seq    │
 * │  4 bits  │  5 bits   │  20 bits   │  20 bits  │  15 bits  │
 * ├──────────┼───────────┼────────────┼───────────┼───────────┤
 * │ Bit63-60 │ Bit59-55  │  Bit54-35  │  Bit34-15 │  Bit14-0  │
 * └──────────┴───────────┴────────────┴───────────┴───────────┘
 *
 * 可读格式 (Crockford Base32, 错位拼接):  \
 * ┌────────────────────┬──────────┬──────────┬──────────┐
 * │ Category + Version │  System  │  Module  │   Seq    │
 * │         (2)        │   (4)    │   (4)    │   (3)    │
 * └────────────────────┴──────────┴──────────┴──────────┘
 *
 * 示例: B0-AAAC-AAAB-AAB
 */
export class ErrorCode {
  private static readonly CROCKFORD_BASE32 = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'

  readonly category: ErrorCategory
  readonly systemId: number
  readonly moduleId: number
  readonly sequenceId: number
  readonly version: number

  constructor(options: ErrorCodeOptions) {
    const { category, systemId, moduleId, sequenceId, version = 0 } = options
    this.category = category
    this.systemId = systemId
    this.moduleId = moduleId
    this.sequenceId = sequenceId
    this.version = version

    if (systemId < 0 || systemId >= 2 ** 20) {
      throw new Error(`System ID must be between 0 and ${2 ** 20 - 1}, got ${systemId}`)
    }
    if (moduleId < 0 || moduleId >= 2 ** 20) {
      throw new Error(`Module ID must be between 0 and ${2 ** 20 - 1}, got ${moduleId}`)
    }
    if (sequenceId < 0 || sequenceId >= 2 ** 15) {
      throw new Error(`Sequence ID must be between 0 and ${2 ** 15 - 1}, got ${sequenceId}`)
    }
    if (version < 0 || version >= 2 ** 4) {
      throw new Error(`Version must be between 0 and ${2 ** 4 - 1}, got ${version}`)
    }
  }

  /**
   * 生成64位错误码
   */
  toBigInt(): bigint {
    let code = BigInt(0)

    // Version: bits 63-60
    code |= BigInt(this.version) << BigInt(60)

    // Category: bits 59-55
    code |= BigInt(this.category) << BigInt(55)

    // System: bits 54-35
    code |= BigInt(this.systemId) << BigInt(35)

    // Module: bits 34-15
    code |= BigInt(this.moduleId) << BigInt(15)

    // Seq: bits 14-0
    code |= BigInt(this.sequenceId)

    return code
  }

  /**
   * 转换为可读格式: B0-AAAC-AAAB-AAB
   */
  toString(): string {
    const code = this.toBigInt()

    // 提取各部分
    const version = Number((code >> BigInt(60)) & BigInt(0xf))
    const category = Number((code >> BigInt(55)) & BigInt(0x1f))
    const system = Number((code >> BigInt(35)) & BigInt(0xfffff))
    const module = Number((code >> BigInt(15)) & BigInt(0xfffff))
    const sequenceId = Number(code & BigInt(0x7fff))

    // 错位拼接: Category(5bits) + Version(4bits补齐为5bits) = 10bits -> 2字符
    const part1 = (category << 4) | version

    return [
      this.toBase32(part1, 2),
      this.toBase32(system, 4),
      this.toBase32(module, 4),
      this.toBase32(sequenceId, 3),
    ].join('-')
  }

  /**
   * 从字符串解析错误码
   */
  static fromString(code: string): ErrorCode {
    const normalized = code.replace(/-/g, '').toUpperCase()
    if (normalized.length !== 13) {
      throw new Error(`Invalid error code format: ${code}, expected 13 characters`)
    }

    // 解码各部分
    const part1 = this.fromBase32(normalized.substring(0, 2))
    const system = this.fromBase32(normalized.substring(2, 6))
    const module = this.fromBase32(normalized.substring(6, 10))
    const sequenceId = this.fromBase32(normalized.substring(10, 13))

    // 拆分 Category 和 Version
    const category = (part1 >> 4) & 0x1f
    const version = part1 & 0x0f

    return new ErrorCode({ category, systemId: system, moduleId: module, sequenceId, version })
  }

  /**
   * 校验错误码字符串是否有效
   */
  static isValid(code: string): boolean {
    try {
      this.fromString(code)
      return true
    } catch {
      return false
    }
  }

  private toBase32(value: number, length: number): string {
    let result = ''
    let v = value
    for (let i = 0; i < length; i++) {
      result = ErrorCode.CROCKFORD_BASE32[v & 0x1f] + result
      v >>= 5
    }
    return result
  }

  private static fromBase32(str: string): number {
    let result = 0
    for (const char of str) {
      const index = this.CROCKFORD_BASE32.indexOf(char)
      if (index === -1) {
        throw new Error(`Invalid Crockford Base32 character: ${char}`)
      }
      result = (result << 5) | index
    }
    return result
  }
}
