/**
 * 异常详情接口
 *
 * 用于描述错误的具体原因，业务方应通过 implements 创建自定义详情类
 *
 * @example
 * ```typescript
 * // 定义字段验证错误详情
 * class FieldValidationDetail implements ExceptionDetail {
 *   readonly type = 'field_validation'
 *   constructor(
 *     public readonly field: string,
 *     public readonly message: string,
 *   ) {}
 * }
 *
 * // 定义资源不存在详情
 * class NotFoundDetail implements ExceptionDetail {
 *   readonly type = 'not_found'
 *   constructor(
 *     public readonly resource: string,
 *     public readonly id: string,
 *   ) {}
 * }
 *
 * // 定义余额不足详情
 * class InsufficientBalanceDetail implements ExceptionDetail {
 *   readonly type = 'insufficient_balance'
 *   constructor(
 *     public readonly required: number,
 *     public readonly current: number,
 *   ) {}
 * }
 *
 * // 使用
 * throw new UserNotFoundException('User not found', new NotFoundDetail('user', '123'))
 * throw new ValidationException('Validation failed', [
 *   new FieldValidationDetail('email', 'Invalid format'),
 *   new FieldValidationDetail('age', 'Must be positive'),
 * ])
 * ```
 */
export interface ExceptionDetail {
  /** 详情类型，由业务方自定义 */
  readonly type: string
  /** 允许附加属性 */
  [key: string]: unknown
}
