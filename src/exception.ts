import { CustomError } from 'ts-custom-error'
import type { ExceptionDetail } from './exception-detail.js'

/**
 * Exception 构造函数的配置对象
 */
export interface ExceptionOptions {
  /** 错误消息 */
  message: string
  /** 错误类别 */
  category: number
  /** 模块 ID */
  moduleId: number
  /** 序列 ID */
  sequenceId: number
  /** 错误详情（可选，单个或数组） */
  details?: ExceptionDetail | ExceptionDetail[]
}

/**
 * 业务异常基类
 *
 * 继承自 ts-custom-error 的 CustomError，提供标准化的异常处理机制。
 * 管理错误类别、模块 ID、序列 ID 和详细错误信息。
 *
 * 不包含 systemId 和 code，由业务系统继承后提供。
 * 这样设计使得二方包可以直接使用，业务系统可以扩展添加 systemId。
 *
 * @example
 * ```typescript
 * class ValidationException extends Exception {
 *   constructor(message: string, details: ExceptionDetail | ExceptionDetail[]) {
 *     super({ message, category: ErrorCategory.VALIDATION, moduleId: 1, sequenceId: 1, details })
 *   }
 * }
 * ```
 */
export class Exception extends CustomError {
  /** 错误类别 */
  readonly category: number
  /** 模块 ID */
  readonly moduleId: number
  /** 序列 ID */
  readonly sequenceId: number
  /** 错误详情列表 */
  readonly details: readonly ExceptionDetail[]

  /**
   * 创建异常实例
   *
   * @param config - 异常配置对象
   *
   * @example
   * ```typescript
   * new Exception({
   *   message: 'Validation failed',
   *   category: ErrorCategory.VALIDATION,
   *   moduleId: 1,
   *   sequenceId: 1,
   *   details
   * })
   * ```
   */
  constructor(config: ExceptionOptions) {
    super(config.message)

    this.category = config.category
    this.moduleId = config.moduleId
    this.sequenceId = config.sequenceId
    this.details = config.details
      ? Array.isArray(config.details)
        ? config.details
        : [config.details]
      : []
  }
}
