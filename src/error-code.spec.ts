import { describe, it, expect } from '@jest/globals'
import { ErrorCode, ErrorCategory } from './error-code'

describe('ErrorCode', () => {
  describe('构造函数', () => {
    it('应该成功创建有效的错误码', () => {
      const errorCode = new ErrorCode({ category: ErrorCategory.BUSINESS, systemId: 100, moduleId: 50, sequenceId: 200, version: 1 })
      expect(errorCode.category).toBe(ErrorCategory.BUSINESS)
      expect(errorCode.systemId).toBe(100)
      expect(errorCode.moduleId).toBe(50)
      expect(errorCode.sequenceId).toBe(200)
      expect(errorCode.version).toBe(1)
    })

    it('默认版本应为0', () => {
      const errorCode = new ErrorCode({ category: ErrorCategory.AUTH, systemId: 0, moduleId: 0, sequenceId: 0 })
      expect(errorCode.version).toBe(0)
    })

    it('应该拒绝无效的 systemId', () => {
      expect(() => new ErrorCode({ category: ErrorCategory.AUTH, systemId: -1, moduleId: 0, sequenceId: 0 })).toThrow(
        'System ID must be between 0 and 1048575, got -1',
      )
      expect(() => new ErrorCode({ category: ErrorCategory.AUTH, systemId: 2 ** 20, moduleId: 0, sequenceId: 0 })).toThrow(
        `System ID must be between 0 and 1048575, got ${2 ** 20}`,
      )
    })

    it('应该拒绝无效的 moduleId', () => {
      expect(() => new ErrorCode({ category: ErrorCategory.AUTH, systemId: 0, moduleId: -1, sequenceId: 0 })).toThrow(
        'Module ID must be between 0 and 1048575, got -1',
      )
      expect(() => new ErrorCode({ category: ErrorCategory.AUTH, systemId: 0, moduleId: 2 ** 20, sequenceId: 0 })).toThrow(
        `Module ID must be between 0 and 1048575, got ${2 ** 20}`,
      )
    })

    it('应该拒绝无效的 sequenceId', () => {
      expect(() => new ErrorCode({ category: ErrorCategory.AUTH, systemId: 0, moduleId: 0, sequenceId: -1 })).toThrow(
        'Sequence ID must be between 0 and 32767, got -1',
      )
      expect(() => new ErrorCode({ category: ErrorCategory.AUTH, systemId: 0, moduleId: 0, sequenceId: 2 ** 15 })).toThrow(
        `Sequence ID must be between 0 and 32767, got ${2 ** 15}`,
      )
    })

    it('应该拒绝无效的 version', () => {
      expect(() => new ErrorCode({ category: ErrorCategory.AUTH, systemId: 0, moduleId: 0, sequenceId: 0, version: -1 })).toThrow(
        'Version must be between 0 and 15, got -1',
      )
      expect(() => new ErrorCode({ category: ErrorCategory.AUTH, systemId: 0, moduleId: 0, sequenceId: 0, version: 2 ** 4 })).toThrow(
        `Version must be between 0 and 15, got ${2 ** 4}`,
      )
    })
  })

  describe('toBigInt', () => {
    it('应该正确生成64位错误码', () => {
      const errorCode = new ErrorCode({ category: ErrorCategory.BUSINESS, systemId: 0, moduleId: 0, sequenceId: 0, version: 0 })
      const bigInt = errorCode.toBigInt()
      expect(typeof bigInt).toBe('bigint')
      expect(bigInt).toBeGreaterThan(0n)
    })

    it('应该为相同参数生成相同的错误码', () => {
      const errorCode1 = new ErrorCode({ category: ErrorCategory.AUTH, systemId: 100, moduleId: 50, sequenceId: 200, version: 1 })
      const errorCode2 = new ErrorCode({ category: ErrorCategory.AUTH, systemId: 100, moduleId: 50, sequenceId: 200, version: 1 })
      expect(errorCode1.toBigInt()).toBe(errorCode2.toBigInt())
    })

    it('应该为不同参数生成不同的错误码', () => {
      const errorCode1 = new ErrorCode({ category: ErrorCategory.AUTH, systemId: 100, moduleId: 50, sequenceId: 200, version: 1 })
      const errorCode2 = new ErrorCode({ category: ErrorCategory.BUSINESS, systemId: 100, moduleId: 50, sequenceId: 200, version: 1 })
      expect(errorCode1.toBigInt()).not.toBe(errorCode2.toBigInt())
    })

    it('应该正确编码 version 位段 (bits 63-60)', () => {
      const errorCode0 = new ErrorCode({ category: ErrorCategory.AUTH, systemId: 0, moduleId: 0, sequenceId: 0, version: 0 })
      const errorCode15 = new ErrorCode({ category: ErrorCategory.AUTH, systemId: 0, moduleId: 0, sequenceId: 0, version: 15 })

      // 提取 version 位段
      const version0 = (errorCode0.toBigInt() >> 60n) & 0xfn
      const version15 = (errorCode15.toBigInt() >> 60n) & 0xfn

      expect(Number(version0)).toBe(0)
      expect(Number(version15)).toBe(15)
    })

    it('应该正确编码 category 位段 (bits 59-55)', () => {
      const errorCodeAuth = new ErrorCode({ category: ErrorCategory.AUTH, systemId: 0, moduleId: 0, sequenceId: 0, version: 0 })
      const errorCodeBusiness = new ErrorCode({ category: ErrorCategory.BUSINESS, systemId: 0, moduleId: 0, sequenceId: 0, version: 0 })
      const authInt = errorCodeAuth.toBigInt()
      const businessInt = errorCodeBusiness.toBigInt()

      // 提取 category 位段
      const authCategory = (authInt >> 55n) & 0x1fn
      const businessCategory = (businessInt >> 55n) & 0x1fn

      expect(Number(authCategory)).toBe(ErrorCategory.AUTH)
      expect(Number(businessCategory)).toBe(ErrorCategory.BUSINESS)
    })
  })

  describe('toString', () => {
    it('应该生成正确格式的字符串: XX-XXXX-XXXX-XXX', () => {
      const errorCode = new ErrorCode({ category: ErrorCategory.BUSINESS, systemId: 100, moduleId: 50, sequenceId: 200, version: 1 })
      const str = errorCode.toString()
      expect(str).toMatch(/^[0-9A-Z]{2}-[0-9A-Z]{4}-[0-9A-Z]{4}-[0-9A-Z]{3}$/)
    })

    it('应该只使用 Crockford Base32 字符', () => {
      const errorCode = new ErrorCode({ category: ErrorCategory.SYSTEM, systemId: 12345, moduleId: 6789, sequenceId: 10111, version: 5 })
      const str = errorCode.toString()
      const cleanStr = str.replace(/-/g, '')
      expect(cleanStr).toMatch(/^[0-9ABCDEFGHJKMNPQRSTVWXYZ]+$/)
    })

    it('应该生成固定长度的字符串 (包括连字符)', () => {
      const errorCode = new ErrorCode({ category: ErrorCategory.AUTH, systemId: 0, moduleId: 0, sequenceId: 0, version: 0 })
      const str = errorCode.toString()
      expect(str.length).toBe(16) // 2-4-4-3 = 13 字符 + 3 个连字符
    })

    it('小数值应该用前导零填充', () => {
      const errorCode = new ErrorCode({ category: ErrorCategory.AUTH, systemId: 0, moduleId: 0, sequenceId: 0, version: 0 })
      const str = errorCode.toString()
      expect(str).toMatch(/^[0-9A-Z]{2}-[0-9A-Z]{4}-[0-9A-Z]{4}-[0-9A-Z]{3}$/)
    })
  })

  describe('fromString', () => {
    it('应该正确解析有效的错误码字符串', () => {
      const original = new ErrorCode({ category: ErrorCategory.BUSINESS, systemId: 100, moduleId: 50, sequenceId: 200, version: 1 })
      const str = original.toString()
      const parsed = ErrorCode.fromString(str)

      expect(parsed.category).toBe(original.category)
      expect(parsed.systemId).toBe(original.systemId)
      expect(parsed.moduleId).toBe(original.moduleId)
      expect(parsed.sequenceId).toBe(original.sequenceId)
      expect(parsed.version).toBe(original.version)
    })

    it('应该支持不带连字符的格式', () => {
      const original = new ErrorCode({ category: ErrorCategory.AUTH, systemId: 1000, moduleId: 500, sequenceId: 2000, version: 2 })
      const withDashes = original.toString()
      const withoutDashes = withDashes.replace(/-/g, '')

      const parsed = ErrorCode.fromString(withoutDashes)
      expect(parsed.category).toBe(original.category)
      expect(parsed.systemId).toBe(original.systemId)
    })

    it('应该不区分大小写', () => {
      const original = new ErrorCode({ category: ErrorCategory.VALIDATION, systemId: 999, moduleId: 888, sequenceId: 777, version: 3 })
      const str = original.toString()
      const lowercase = str.toLowerCase()

      const parsed = ErrorCode.fromString(lowercase)
      expect(parsed.category).toBe(original.category)
      expect(parsed.systemId).toBe(original.systemId)
    })

    it('应该拒绝长度不正确的字符串', () => {
      expect(() => ErrorCode.fromString('ABC')).toThrow('Invalid error code format')
      expect(() => ErrorCode.fromString('A0-AAAA-AAA-AAA-AA')).toThrow('Invalid error code format')
    })

    it('应该拒绝包含无效字符的字符串', () => {
      expect(() => ErrorCode.fromString('A0-AAAA-AAAA-AAI')).toThrow(
        'Invalid Crockford Base32 character: I',
      )
      expect(() => ErrorCode.fromString('A0-AAAA-AAAA-AAL')).toThrow(
        'Invalid Crockford Base32 character: L',
      )
      expect(() => ErrorCode.fromString('A0-AAAA-AAAA-AAO')).toThrow(
        'Invalid Crockford Base32 character: O',
      )
      expect(() => ErrorCode.fromString('A0-AAAA-AAAA-AAU')).toThrow(
        'Invalid Crockford Base32 character: U',
      )
    })

    it('往返转换应该保持一致性', () => {
      const testCases = [
        new ErrorCode({ category: ErrorCategory.AUTH, systemId: 0, moduleId: 0, sequenceId: 0, version: 0 }),
        new ErrorCode({ category: ErrorCategory.BUSINESS, systemId: 1048575, moduleId: 1048575, sequenceId: 32767, version: 15 }),
        new ErrorCode({ category: ErrorCategory.VALIDATION, systemId: 12345, moduleId: 6789, sequenceId: 10111, version: 5 }),
        new ErrorCode({ category: ErrorCategory.SYSTEM, systemId: 999, moduleId: 888, sequenceId: 777, version: 7 }),
      ]

      for (const original of testCases) {
        const str = original.toString()
        const parsed = ErrorCode.fromString(str)
        expect(parsed.toBigInt()).toBe(original.toBigInt())
      }
    })
  })

  describe('isValid', () => {
    it('应该验证有效的错误码字符串', () => {
      const errorCode = new ErrorCode({ category: ErrorCategory.BUSINESS, systemId: 100, moduleId: 50, sequenceId: 200, version: 1 })
      const str = errorCode.toString()
      expect(ErrorCode.isValid(str)).toBe(true)
    })

    it('应该拒绝无效的错误码字符串', () => {
      expect(ErrorCode.isValid('INVALID')).toBe(false)
      expect(ErrorCode.isValid('A0-AAAA-AAAA-AAAA')).toBe(false)
      expect(ErrorCode.isValid('')).toBe(false)
    })

    it('应该拒绝包含无效字符的字符串', () => {
      expect(ErrorCode.isValid('A0-AAAA-AAAI-AAA')).toBe(false)
      expect(ErrorCode.isValid('A0-AAAA-AAAL-AAA')).toBe(false)
    })
  })

  describe('ErrorCategory', () => {
    it('应该包含所有定义的错误类别', () => {
      expect(ErrorCategory.AUTH).toBe(10)
      expect(ErrorCategory.BUSINESS).toBe(11)
      expect(ErrorCategory.CONFLICT).toBe(12)
      expect(ErrorCategory.DEGRADE).toBe(13)
      expect(ErrorCategory.FEATURE).toBe(15)
      expect(ErrorCategory.RATE_LIMIT).toBe(24)
      expect(ErrorCategory.SYSTEM).toBe(25)
      expect(ErrorCategory.THIRD_PARTY).toBe(26)
      expect(ErrorCategory.VALIDATION).toBe(27)
    })

    it('每个类别应该生成唯一的错误码', () => {
      const categories = [
        ErrorCategory.AUTH,
        ErrorCategory.BUSINESS,
        ErrorCategory.CONFLICT,
        ErrorCategory.DEGRADE,
        ErrorCategory.FEATURE,
        ErrorCategory.RATE_LIMIT,
        ErrorCategory.SYSTEM,
        ErrorCategory.THIRD_PARTY,
        ErrorCategory.VALIDATION,
      ]

      const codes = categories.map((cat) => new ErrorCode({ category: cat, systemId: 0, moduleId: 0, sequenceId: 0 }).toBigInt())
      const uniqueCodes = new Set(codes)
      expect(uniqueCodes.size).toBe(categories.length)
    })
  })

  describe('Base32 字符串参数', () => {
    it('应该支持使用 Base32 字符串构造，与等价数值结果一致', () => {
      const fromNumber = new ErrorCode({ category: ErrorCategory.BUSINESS, systemId: 100, moduleId: 50, sequenceId: 200, version: 1 })
      const str = fromNumber.toString()
      // 从 toString 提取各段 Base32 字符串
      const parts = str.split('-')
      // parts[1] = systemId, parts[2] = moduleId, parts[3] = sequenceId
      const fromString = new ErrorCode({ category: ErrorCategory.BUSINESS, systemId: parts[1], moduleId: parts[2], sequenceId: parts[3], version: 1 })

      expect(fromString.systemId).toBe(fromNumber.systemId)
      expect(fromString.moduleId).toBe(fromNumber.moduleId)
      expect(fromString.sequenceId).toBe(fromNumber.sequenceId)
      expect(fromString.toBigInt()).toBe(fromNumber.toBigInt())
    })

    it('应该支持混合使用 number 和 string 参数', () => {
      const fromNumber = new ErrorCode({ category: ErrorCategory.AUTH, systemId: 12345, moduleId: 6789, sequenceId: 100, version: 3 })
      const str = fromNumber.toString()
      const parts = str.split('-')

      const mixed = new ErrorCode({ category: ErrorCategory.AUTH, systemId: parts[1], moduleId: 6789, sequenceId: parts[3], version: 3 })
      expect(mixed.systemId).toBe(12345)
      expect(mixed.moduleId).toBe(6789)
      expect(mixed.sequenceId).toBe(100)
      expect(mixed.toBigInt()).toBe(fromNumber.toBigInt())
    })

    it('应该支持 version 使用 Base32 字符串', () => {
      const fromNumber = new ErrorCode({ category: ErrorCategory.BUSINESS, systemId: 0, moduleId: 0, sequenceId: 0, version: 5 })
      const fromString = new ErrorCode({ category: ErrorCategory.BUSINESS, systemId: 0, moduleId: 0, sequenceId: 0, version: '5' })
      expect(fromString.version).toBe(5)
      expect(fromString.toBigInt()).toBe(fromNumber.toBigInt())
    })

    it('无效 Base32 字符串应抛出异常', () => {
      expect(() => new ErrorCode({ category: ErrorCategory.AUTH, systemId: 'INVALID!', moduleId: 0, sequenceId: 0 })).toThrow(
        'Invalid Crockford Base32 character',
      )
      expect(() => new ErrorCode({ category: ErrorCategory.AUTH, systemId: 0, moduleId: 'O', sequenceId: 0 })).toThrow(
        'Invalid Crockford Base32 character',
      )
    })
  })

  describe('边界值测试', () => {
    it('应该处理最小值', () => {
      const errorCode = new ErrorCode({ category: ErrorCategory.AUTH, systemId: 0, moduleId: 0, sequenceId: 0, version: 0 })
      const str = errorCode.toString()
      const parsed = ErrorCode.fromString(str)
      expect(parsed.toBigInt()).toBe(errorCode.toBigInt())
    })

    it('应该处理最大值', () => {
      const errorCode = new ErrorCode(
        {
          category: ErrorCategory.VALIDATION,
          systemId: 2 ** 20 - 1,
          moduleId: 2 ** 20 - 1,
          sequenceId: 2 ** 15 - 1,
          version: 2 ** 4 - 1,
        },
      )
      const str = errorCode.toString()
      const parsed = ErrorCode.fromString(str)
      expect(parsed.toBigInt()).toBe(errorCode.toBigInt())
    })

    it('应该处理各位段的边界值组合', () => {
      const testCases = [
        { category: ErrorCategory.AUTH, systemId: 0, moduleId: 0, sequenceId: 0, version: 0 },
        { category: ErrorCategory.BUSINESS, systemId: 1048575, moduleId: 0, sequenceId: 0, version: 0 },
        { category: ErrorCategory.CONFLICT, systemId: 0, moduleId: 1048575, sequenceId: 0, version: 0 },
        { category: ErrorCategory.DEGRADE, systemId: 0, moduleId: 0, sequenceId: 32767, version: 0 },
        { category: ErrorCategory.FEATURE, systemId: 0, moduleId: 0, sequenceId: 0, version: 15 },
      ]

      for (const testCase of testCases) {
        const errorCode = new ErrorCode(testCase)
        const str = errorCode.toString()
        const parsed = ErrorCode.fromString(str)
        expect(parsed.toBigInt()).toBe(errorCode.toBigInt())
      }
    })
  })
})
