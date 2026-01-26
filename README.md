# @buka/error-codes

结构化错误码管理库，提供 64 位结构化错误码的编码、解码和管理能力。

## 安装

```bash
pnpm add @buka/error-codes
npm install @buka/error-codes
yarn add @buka/error-codes
```

## 使用指南

### 创建错误码

```typescript
import { ErrorCode, ErrorCategory } from "@buka/error-codes";

const errorCode = new ErrorCode(
  ErrorCategory.BUSINESS, // 错误类别
  1, // 系统 ID
  100, // 模块 ID
  42, // 序列号
);
```

### 转换格式

```typescript
// 转换为可读格式字符串
const readable = errorCode.toString(); // B0-AAAC-AAB-AAB-C

// 转换为 64 位整数
const bigint = errorCode.toBigInt();

// 从可读格式解析
const parsed = ErrorCode.fromString("B0-AAAC-AAB-AAB-C");
```

### 错误类别

`ErrorCategory` 枚举提供以下错误类别：

- `ErrorCategory.AUTH` (10) - 认证与安全
- `ErrorCategory.BUSINESS` (11) - 业务逻辑异常
- `ErrorCategory.CONFLICT` (12) - 数据冲突
- `ErrorCategory.DEGRADE` (13) - 功能降级/熔断
- `ErrorCategory.FEATURE` (15) - 功能不可用
- `ErrorCategory.RATE_LIMIT` (24) - 流量限制
- `ErrorCategory.SYSTEM` (25) - 系统故障
- `ErrorCategory.THIRD_PARTY` (26) - 第三方服务异常
- `ErrorCategory.VALIDATION` (27) - 参数校验错误

详细说明见规范文档。

详见 [docs/specification.md](./docs/specification.md) 了解完整的错误码规范设计、位段划分、编码规则、错误类别定义和保留错误码说明。
