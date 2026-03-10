/**
 * Crockford Base32 编码/解码工具类
 *
 * @see https://www.crockford.com/base32.html
 */
export class Base32 {
  private static readonly CROCKFORD_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'

  /**
   * 将数值编码为指定长度的 Crockford Base32 字符串
   */
  static encode(value: number, length: number): string {
    let result = ''
    let v = value
    for (let i = 0; i < length; i++) {
      result = this.CROCKFORD_ALPHABET[v & 0x1f] + result
      v >>= 5
    }
    return result
  }

  /**
   * 校验字符串是否为有效的 Crockford Base32 编码
   */
  static isValid(str: string): boolean {
    if (str.length === 0) return false
    for (const char of str) {
      if (this.CROCKFORD_ALPHABET.indexOf(char.toUpperCase()) === -1) {
        return false
      }
    }
    return true
  }

  /**
   * 将 Crockford Base32 字符串解码为数值
   */
  static decode(str: string): number {
    let result = 0
    for (const char of str) {
      const index = this.CROCKFORD_ALPHABET.indexOf(char)
      if (index === -1) {
        throw new Error(`Invalid Crockford Base32 character: ${char}`)
      }
      result = (result << 5) | index
    }
    return result
  }
}
