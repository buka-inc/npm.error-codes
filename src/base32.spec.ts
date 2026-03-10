import { describe, it, expect } from '@jest/globals'
import { Base32 } from './base32'

describe('Base32', () => {
  describe('encode', () => {
    it('应该将 0 编码为全零字符串', () => {
      expect(Base32.encode(0, 1)).toBe('0')
      expect(Base32.encode(0, 3)).toBe('000')
      expect(Base32.encode(0, 5)).toBe('00000')
    })

    it('应该正确编码单个字符', () => {
      expect(Base32.encode(0, 1)).toBe('0')
      expect(Base32.encode(1, 1)).toBe('1')
      expect(Base32.encode(10, 1)).toBe('A')
      expect(Base32.encode(31, 1)).toBe('Z')
    })

    it('应该正确编码多字符值', () => {
      // 32 = 1 << 5, 编码为 2 位应为 "10"
      expect(Base32.encode(32, 2)).toBe('10')
      // 1023 = 31 * 32 + 31, 编码为 2 位应为 "ZZ"
      expect(Base32.encode(1023, 2)).toBe('ZZ')
    })

    it('应该用前导零填充到指定长度', () => {
      expect(Base32.encode(1, 4)).toBe('0001')
      expect(Base32.encode(31, 3)).toBe('00Z')
    })

    it('应该只使用 Crockford Base32 字符集', () => {
      const validChars = /^[0-9ABCDEFGHJKMNPQRSTVWXYZ]+$/
      for (let i = 0; i < 1024; i++) {
        expect(Base32.encode(i, 2)).toMatch(validChars)
      }
    })
  })

  describe('decode', () => {
    it('应该将全零字符串解码为 0', () => {
      expect(Base32.decode('0')).toBe(0)
      expect(Base32.decode('000')).toBe(0)
      expect(Base32.decode('00000')).toBe(0)
    })

    it('应该正确解码单个字符', () => {
      expect(Base32.decode('0')).toBe(0)
      expect(Base32.decode('1')).toBe(1)
      expect(Base32.decode('A')).toBe(10)
      expect(Base32.decode('Z')).toBe(31)
    })

    it('应该正确解码多字符值', () => {
      expect(Base32.decode('10')).toBe(32)
      expect(Base32.decode('ZZ')).toBe(1023)
    })

    it('应该拒绝无效的 Crockford Base32 字符', () => {
      expect(() => Base32.decode('I')).toThrow('Invalid Crockford Base32 character: I')
      expect(() => Base32.decode('L')).toThrow('Invalid Crockford Base32 character: L')
      expect(() => Base32.decode('O')).toThrow('Invalid Crockford Base32 character: O')
      expect(() => Base32.decode('U')).toThrow('Invalid Crockford Base32 character: U')
    })
  })

  describe('isValid', () => {
    it('应该接受有效的 Base32 字符串', () => {
      expect(Base32.isValid('0')).toBe(true)
      expect(Base32.isValid('ABC')).toBe(true)
      expect(Base32.isValid('0123456789')).toBe(true)
      expect(Base32.isValid('ZZZZ')).toBe(true)
    })

    it('应该接受小写字母', () => {
      expect(Base32.isValid('abc')).toBe(true)
      expect(Base32.isValid('zzzz')).toBe(true)
    })

    it('应该拒绝包含无效字符的字符串', () => {
      expect(Base32.isValid('I')).toBe(false)
      expect(Base32.isValid('L')).toBe(false)
      expect(Base32.isValid('O')).toBe(false)
      expect(Base32.isValid('U')).toBe(false)
      expect(Base32.isValid('ABCI')).toBe(false)
    })

    it('应该拒绝空字符串', () => {
      expect(Base32.isValid('')).toBe(false)
    })

    it('应该拒绝包含特殊字符的字符串', () => {
      expect(Base32.isValid('AB-CD')).toBe(false)
      expect(Base32.isValid('AB CD')).toBe(false)
      expect(Base32.isValid('AB!CD')).toBe(false)
    })
  })

  describe('encode/decode 往返转换', () => {
    it('decode(encode(value)) 应该返回原始值', () => {
      const testValues = [0, 1, 31, 32, 100, 1023, 1024, 32767, 1048575]
      for (const value of testValues) {
        const length = Math.max(1, Math.ceil(Math.log2(value + 1) / 5))
        const encoded = Base32.encode(value, length)
        expect(Base32.decode(encoded)).toBe(value)
      }
    })

    it('encode(decode(str)) 应该返回原始字符串', () => {
      const testStrings = ['0', '1', 'A', 'Z', '10', 'ZZ', '0001', 'ZZZZ']
      for (const str of testStrings) {
        const decoded = Base32.decode(str)
        expect(Base32.encode(decoded, str.length)).toBe(str)
      }
    })
  })
})
