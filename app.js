const phases = [
  {
    id: "foundation",
    number: "PHASE 01",
    title: "基础链路",
    subtitle: "先证明协议转换和真实 CC 入口可用",
    nodes: [
      {
        id: "sdk-transport", title: "Google GenAI SDK 接入", priority: "critical", done: true,
        summary: "使用 google-genai SDK 连接 ModelHub 原生 generateContent，不手写上游 HTTP JSON。",
        goal: ["拆分 ModelHub endpoint 与模型名", "AK 仅运行时输入，不落盘", "适配公司证书与网络环境"],
        verify: ["SDK 真实单轮请求返回", "确认请求目标为 gemini-4-argon", "SDK 版本固定并可复现"],
        acceptance: ["不直接拼装 GenAI HTTP body", "真实请求成功且 usage 可读取"],
        risks: ["证书链、飞连节点和 endpoint 变化", "AK 泄露到日志或配置"],
        evidence: ["google-genai 2.31.0 已以 editable 方式安装", "真实 SDK 请求返回成功"], tags: ["SDK", "ModelHub", "认证"]
      },
      {
        id: "messages-service", title: "真实 /v1/messages 服务", priority: "critical", done: true,
        summary: "提供 Claude Code 可直接访问的 Anthropic Messages 兼容 HTTP 服务。",
        goal: ["FastAPI 暴露 POST /v1/messages", "支持 JSON 与 SSE 响应", "统一 Anthropic error shape"],
        verify: ["GET /healthz=200", "真实 Claude Code 访问本地 endpoint", "服务日志出现 POST /v1/messages 200"],
        acceptance: ["无需模拟 CC 请求", "Claude Code 可完成一次真实调用"],
        risks: ["Claude Code 附加 beta query/header", "用户级 settings 覆盖本地 base URL"],
        evidence: ["服务监听 127.0.0.1:18081", "真实 CC 请求 200 OK"], tags: ["FastAPI", "Messages", "SSE"]
      },
      {
        id: "request-conversion", title: "Messages → GenAI 基础转换", priority: "critical", done: true,
        summary: "转换 system、user/assistant 角色、文本、多轮内容和图片输入。",
        goal: ["assistant 映射为 model", "system 映射为 system_instruction", "max_tokens 等字段映射到 GenerateContentConfig"],
        verify: ["单轮、多轮、base64 图片、URL 图片单测", "不支持的 block 明确报错而非静默丢弃"],
        acceptance: ["顺序与角色不变", "已支持字段值保持准确"],
        risks: ["Claude 新增 content block 类型", "隐式丢字段造成准确率问题"],
        evidence: ["请求转换单元测试已通过"], tags: ["转换", "角色", "system"]
      },
      {
        id: "response-conversion", title: "GenAI → Messages 基础转换", priority: "critical", done: true,
        summary: "将候选文本、finish reason 和 token usage 转成 Messages 响应。",
        goal: ["提取文本 content", "映射 stop_reason", "生成 Messages id/model/usage"],
        verify: ["正常文本、max_tokens、缺失 candidates 单测", "真实 CC 能解析 JSON/SSE"],
        acceptance: ["回答内容完整", "stop_reason 与 usage 不伪造、不丢失"],
        risks: ["GenAI finish reason 新枚举", "多 candidate 行为未定义"],
        evidence: ["响应转换及 SSE 事件序列测试已通过", "2026-10-22：修复真实 SDK FinishReason 枚举误映射；全量离线回归 31 tests / OK"], tags: ["转换", "usage", "stop_reason"]
      },
      {
        id: "real-single", title: "真实 CC 单轮文本", priority: "critical", done: true,
        summary: "使用本机 Claude Code 2.1.142 完成一次真实端到端文本调用。",
        goal: ["排除 curl/自制客户端模拟", "验证 CC 原生 stream 请求", "确认本地 settings 覆盖生效"],
        verify: ["CC 输出指定文本", "调试日志记录 /v1/messages", "服务端返回 200"],
        acceptance: ["退出码 0", "stop_reason=end_turn", "请求和响应均来自真实链路"],
        risks: ["全局 Ark 配置抢占 ANTHROPIC_BASE_URL"],
        evidence: ["输出：真实 Claude Code 链路成功", "input 225 / output 10 tokens"], tags: ["Claude Code", "E2E"]
      },
      {
        id: "real-multiturn", title: "真实 CC 多轮文本", priority: "critical", done: true,
        summary: "用 --resume 恢复同一 CC session，验证历史由 CC 真实携带。",
        goal: ["第一轮写入唯一标记", "第二轮不重复标记", "第二轮依靠历史准确回答"],
        verify: ["同一 session_id", "两次 /v1/messages 200", "session 文件角色顺序正确"],
        acceptance: ["user→assistant→user→assistant 完整", "第二轮正确返回 CC-MULTI-6F3A91"],
        risks: ["把两个独立单轮误判成多轮"],
        evidence: ["真实 session 四条消息已核验", "第二轮 input tokens 增长"], tags: ["多轮", "resume", "history"]
      },
      {
        id: "real-vlm", title: "真实 CC 单图 VLM", priority: "critical", done: true,
        summary: "在 macOS Trae 终端粘贴 PNG，确认 CC 发出 base64 image block 并正确识图。",
        goal: ["图片与文本同时进入 Messages", "base64 图片映射为 GenAI inline_data", "答案返回 CC"],
        verify: ["session 中存在 image block", "media_type=image/png", "模型正确数出 3 条日志"],
        acceptance: ["不是路径替代或 OCR 预填", "真实图片数据进入请求且回答正确"],
        risks: ["大图尺寸限制", "多图顺序和不同 MIME 未验证"],
        evidence: ["base64 data_length=89656", "模型回答：3"], tags: ["VLM", "image/png", "base64"]
      }
    ]
  },
  {
    id: "protocol",
    number: "PHASE 02",
    title: "协议兼容与核心能力",
    subtitle: "先锁定当前 Argon 端点的真实规则，再补齐工具、签名与流式语义",
    nodes: [
      {
        id: "endpoint-contract", title: "Argon 端点协议兼容性", priority: "critical", inProgress: true, recommended: true,
        summary: "针对当前 gemini-4-argon 做真实协议探测，确定 id、并行工具、functionResponse 分组和 signature 的实际规则。",
        goal: ["分别验证 functionCall/functionResponse 带 id 与不带 id", "验证不同名与同名并行工具调用", "验证顺序多步工具及多个 functionResponse 的 turn 分组", "把端点差异固化为显式兼容配置"],
        verify: ["每个场景都走真实 ModelHub，而非本地 mock", "保留脱敏后的请求形态、HTTP 状态和响应结论", "结果与现有文档中的旧端点差异对照"],
        acceptance: ["明确当前 Argon 对 id 的接受规则", "并行同名调用结果不会错配", "后续代码不再依靠猜测或单次成功判断协议"],
        risks: ["旧文档描述的端点与当前 Argon 可能不同", "429/502 等瞬时错误不能误判为协议不支持", "测试不得输出 AK"],
        evidence: ["2026-10-21：真实 seed 请求成功，Argon 返回 functionCall.id 与 thoughtSignature", "首次回放遇到 HTTP 429；有限退避重试后恢复，不将资源错误误判成协议错误", "真实 with_id 回放：PASS", "真实 without_id 回放：PASS", "不同名并行工具：PASS；一次返回 lookup_alpha 与 lookup_beta，两个调用 ID 唯一", "同名并行工具：PASS；两次 lookup_item 仍保持两个唯一调用 ID，结果未错配", "两种并行场景都把两个 functionResponse 放在同一个 GenAI user turn 后成功闭环", "实测两个 functionCall Part 中只有一个携带 thoughtSignature；实现必须按实际存在情况保存，不能假设每个调用都有签名", "新增 3 个并行回归用例；当前 26 个单元测试全部通过", "连续两轮工具真实探针已就绪：强制 step_one→回传→step_two→回传→最终回答，并核验跨轮 ID 与 signature", "探针语法检查及 26 个回归测试通过；当前等待在 Trae 可见终端执行真实请求"],
        tags: ["Argon", "id", "parallel tools", "thoughtSignature"]
      },
      {
        id: "native-stream", title: "GenAI 原生增量流式", priority: "critical", blocked: true,
        summary: "当前 ModelHub 卡片未开放 streamGenerateContent；适配层无法单独实现上游原生流式，本期使用显式 buffered_sse。",
        goal: ["当前交付明确采用 generateContent + 缓冲式 Messages SSE", "保留原生流式解析扩展点", "ModelHub 开放接口后再重新验证"],
        verify: ["当前 streamGenerateContent 真实请求返回 401 no model permission", "generateContent 正常可用", "Claude Code 能消费适配层输出的合法 SSE 事件"],
        acceptance: ["本期不把缓冲式 SSE 描述成原生流式", "只有上游返回多个真实 chunk 后才能解除阻塞", "外部能力未开放不计为适配层未完成项"],
        risks: ["首 token 必须等待上游完整响应", "长回答的用户可见延迟较高", "上游接口开放时间不由本项目控制"],
        evidence: ["2026-10-21：SDK 调用 streamGenerateContent 返回 401 no model permission: gemini-4-argon", "设计文档的 generate_content_stream 也标记为 Phase 2 未实现", "当前可用方案：generateContent 完成后转换为 Anthropic SSE"],
        tags: ["external-blocked", "streamGenerateContent", "buffered_sse"]
      },
      {
        id: "tool-definitions", title: "工具定义请求转换", priority: "critical",
        summary: "把 Messages tools 与 tool_choice 转成 GenAI function declarations 和 functionCallingConfig。",
        goal: ["JSON Schema 字段转换", "tool_choice auto/any/指定工具映射", "保留工具名称与描述"],
        verify: ["单工具、多工具、嵌套 schema", "不支持的 schema 关键字明确处理"],
        acceptance: ["模型可看到并选择正确工具", "schema 不被静默破坏"],
        risks: ["两种协议 JSON Schema 支持范围不同"],
        evidence: ["基础工具定义与 tool_choice 转换已经实现并有单测", "仍需真实复杂 schema 与当前端点兼容性验证"], tags: ["tools", "schema", "function calling"]
      },
      {
        id: "tool-use-response", title: "functionCall → tool_use", priority: "critical",
        summary: "将 GenAI functionCall 响应转换为 Messages tool_use，并映射 stop_reason=tool_use。",
        goal: ["生成稳定 tool_use id", "参数保持 JSON 对象", "SSE 支持 input_json_delta"],
        verify: ["真实 CC 收到工具调用", "CC 能识别工具名和参数", "非流式与流式一致"],
        acceptance: ["CC 实际执行预期工具", "参数无截断或二次字符串化"],
        risks: ["流式 JSON 参数拼接", "并行工具调用顺序"],
        evidence: ["真实 Claude Code 已成功收到 Bash tool_use 并执行", "真实 ModelHub 已验证不同名与同名并行 functionCall；同名调用仍返回唯一 ID", "并行返回中只有实际携带的 thoughtSignature 会进入缓存"], tags: ["tool_use", "functionCall", "stop_reason"]
      },
      {
        id: "tool-result-loop", title: "tool_result 多轮闭环", priority: "critical",
        summary: "把 CC 执行结果转换为 GenAI functionResponse，再让模型生成最终回答。",
        goal: ["tool_use_id 与 function name 对应", "文本/错误/图片结果处理", "支持连续和并行工具调用"],
        verify: ["真实 CC 文件读取闭环", "工具失败后模型可恢复", "第二次模型请求包含正确历史"],
        acceptance: ["调用→执行→回传→最终答案完整", "无死循环和 ID 错配"],
        risks: ["CC 自带工具数量多", "tool_result 内容类型复杂"],
        evidence: ["真实 Bash 工具调用→执行→回传→最终回答已成功", "不同名和同名并行工具均已完成双结果回传与最终回答闭环", "当前还需验证连续两轮工具调用、失败恢复与压缩场景"], tags: ["tool_result", "loop", "Claude Code"]
      },
      {
        id: "builtin-tools", title: "Google 内置工具策略", priority: "normal",
        summary: "明确 google_search 等内置工具如何与 CC 客户端工具共存、返回和展示。",
        goal: ["区分 server tool 与 client tool", "定义 grounding/citation 转换", "避免同名工具冲突"],
        verify: ["开启/关闭 google_search 对照", "有无 grounding metadata", "CC 最终文本与引用可用"],
        acceptance: ["行为可配置", "不会把内置工具误当成 CC 待执行工具"],
        risks: ["ModelCard 默认 builtin_tools 改变行为"], tags: ["google_search", "server tools"]
      },
      {
        id: "thinking", title: "Reasoning / Thinking / Signature", priority: "critical",
        summary: "处理 GenAI thought、thought_signature 与 Messages thinking/redacted_thinking 的对应及保留策略。",
        goal: ["确认 includeThoughts=false 时实际响应", "签名跨轮保留", "CC 压缩后签名回填策略"],
        verify: ["普通 reasoning 多轮", "工具调用夹杂 thinking", "签名缺失/过期/重复"],
        acceptance: ["不泄露隐藏思维", "需要的签名不丢失", "跨轮请求不被上游拒绝"],
        risks: ["这是准确率和稳定性高风险区域"],
        evidence: ["基础 thoughtSignature 缓存与回传已通过单测和真实工具闭环", "当前缓存仍是进程内全局字典，尚未达到生产要求"], tags: ["reasoning", "signature", "thinking"]
      },
      {
        id: "vlm-advanced", title: "VLM 多图与多轮", priority: "normal",
        summary: "扩展单图成功结果，验证多图顺序、图片后追问和混合工具场景。",
        goal: ["多图+多文本顺序", "VLM 会话 resume", "PNG/JPEG/WebP 与尺寸边界"],
        verify: ["两图对比问题", "第二轮引用上一轮图片", "超大图片错误映射"],
        acceptance: ["顺序准确", "不重复上传或丢图", "失败信息可定位"],
        risks: ["上下文体积快速增长"], tags: ["VLM", "multi-image", "multi-turn"]
      },
      {
        id: "response-semantics", title: "Stop / Usage / Error 完整映射", priority: "critical", inProgress: true,
        summary: "R1 已修复 SDK FinishReason 枚举误映射；继续覆盖其他结束原因、用量字段、可重试与不可重试错误。",
        goal: ["end_turn/max_tokens/tool_use/stop_sequence", "input/output/cache token 策略", "4xx/5xx/error event 映射"],
        verify: ["每个 stop reason 契约测试", "超时、过载、资源耗尽", "客户端显示可理解"],
        acceptance: ["不把错误伪装成正常回答", "usage 字段稳定且有来源"],
        risks: ["上游错误文案不稳定", "重试造成重复请求"],
        evidence: ["真实 SDK 非流式/流式 MAX_TOKENS 均映射为 max_tokens", "SDK STOP 保持 end_turn", "全量离线回归 31 tests / OK；R4 与其他响应语义仍待处理"], tags: ["errors", "usage", "finishReason"]
      }
    ]
  },
  {
    id: "stability",
    number: "PHASE 03",
    title: "稳定性与边界",
    subtitle: "针对长上下文、压缩、恢复和故障建立可信验证",
    nodes: [
      {
        id: "forced-compact", title: "CC 强制 /compact", priority: "critical",
        summary: "短会话中手动触发 CC 压缩，先观察压缩请求和摘要如何通过适配层。",
        goal: ["压缩前埋唯一标记", "执行 /compact", "压缩后追问并检查请求 block"],
        verify: ["日志出现真实 compaction", "摘要进入后续请求", "标记和关键约束可恢复"],
        acceptance: ["压缩成功且会话继续", "adapter 不因新 block 类型报错"],
        risks: ["手动压缩不等同自动阈值触发"], tags: ["/compact", "summary", "context"]
      },
      {
        id: "auto-compact", title: "CC 自动压缩", priority: "critical",
        summary: "逐步增加真实上下文，直到 autocompact 从 level=ok 进入执行状态。",
        goal: ["构造可核验长上下文", "记录触发点与 effectiveWindow", "压缩前后信息抽样核对"],
        verify: ["至少一次自动触发", "多次 resume 稳定", "关键系统约束不丢"],
        acceptance: ["无 400/死循环/上下文爆炸", "压缩后回答准确率可接受"],
        risks: ["耗时和 token 成本高", "阈值可能随 CC 版本变化"], tags: ["autocompact", "180K", "long context"]
      },
      {
        id: "continuation", title: "长输出 continuation_token", priority: "critical",
        summary: "独立验证 Gemini 4 Argon 长解码的 continuation token；它与 CC 上下文压缩不是同一机制。",
        goal: ["超过 32K 输出观察 token", "模拟流中断", "从最近有效 checkpoint 恢复"],
        verify: ["不中断基线", "中途断连恢复", "非最后 token 恢复"],
        acceptance: ["恢复后内容连续且不重复", "token 生命周期和选择策略明确"],
        risks: ["超长测试昂贵", "SDK 自动续传行为需与服务重连协同"], tags: ["continuation_token", "long output", "recovery"]
      },
      {
        id: "retry-timeout", title: "超时、重试与幂等", priority: "critical",
        summary: "针对 overloaded、internal error、resource exhausted 等配置化重试，并避免重复副作用。",
        goal: ["连接/首 token/总时长分层超时", "指数退避与次数上限", "工具场景禁止盲重试"],
        verify: ["故障注入", "可重试关键词命中", "重试耗尽后的标准错误"],
        acceptance: ["无无限等待", "无工具重复执行", "日志可解释每次重试"],
        risks: ["生成请求不天然幂等"], tags: ["retry", "timeout", "idempotency"]
      },
      {
        id: "compat-probes", title: "CC 辅助接口与版本兼容", priority: "normal",
        summary: "处理或明确 HEAD、count_tokens、模型探测及 beta header 等 CC 行为。",
        goal: ["记录 CC 实际请求面", "判断 404 是否无害", "必要时补 count_tokens"],
        verify: ["启动、单轮、交互、工具四类流程抓取", "不同 CC 版本 smoke"],
        acceptance: ["无误导性模型不存在提示", "升级前有兼容检查"],
        risks: ["CC 客户端行为随版本变化"], tags: ["count_tokens", "beta", "compatibility"]
      },
      {
        id: "regression", title: "协议回归测试矩阵", priority: "critical",
        summary: "把已验证场景固化为单测、契约测试和真实 smoke，阻止后续改动破坏已有能力。",
        goal: ["转换纯函数测试", "HTTP/SSE 契约测试", "真实 CC smoke 清单"],
        verify: ["CI/本地一键运行", "失败能定位到协议层", "测试不包含真实 AK"],
        acceptance: ["核心矩阵全部通过才能交付", "关键分支有正反例"],
        risks: ["只测 happy path", "真实服务测试不稳定"], tags: ["tests", "contract", "smoke"]
      },
      {
        id: "observability", title: "日志、指标与安全", priority: "critical",
        summary: "记录足够的链路信息用于 oncall，同时对 AK、图片和完整 prompt 做脱敏。",
        goal: ["request id 和阶段耗时", "状态码/重试/stop reason 指标", "内容类型与数量而非敏感正文"],
        verify: ["成功与失败链路均可追踪", "日志扫描无 AK/base64", "并发请求可区分"],
        acceptance: ["问题能在日志中定位阶段", "敏感数据不落盘"],
        risks: ["为了排障过度记录用户内容"], tags: ["logging", "metrics", "redaction"]
      }
    ]
  },
  {
    id: "delivery",
    number: "PHASE 04",
    title: "交付与上线",
    subtitle: "把代码变成可配置、可观测、可回滚的初版能力",
    nodes: [
      {
        id: "configuration", title: "配置与启动方式", priority: "normal",
        summary: "整理 ModelCard、环境变量、模型映射、证书与启动参数，禁止敏感值进入仓库。",
        goal: ["开发/测试/线上配置分离", "启动前校验必填项", "模型别名与上游模型显式映射"],
        verify: ["新环境按说明启动", "缺配置时快速失败", "配置变更可追溯"],
        acceptance: ["无需改代码即可切换允许项", "AK 不写入文件"],
        risks: ["配置层级互相覆盖", "旁路探索尚无最终结论，不能提前替换主线方案"],
        evidence: ["旁路参考：他人正在试验直连 ModelHub 的可行性，示例为 /v1/messages + x-api-key + anthropic-version + x-provider-session-id", "示例响应包含 redacted_thinking 与 text(Pong)，目前只证明该试验的单轮文本请求成功", "对方回复明确为“我先试一下可行性，没事你干就完事了”：主线适配任务继续，不等待也不切换方案", "该结果仅作为未来对照样例；在对方给出可复用结论前，不视为现成生产能力", "本机 Claude Code 2.1.306 支持 ANTHROPIC_BASE_URL、ANTHROPIC_API_KEY、ANTHROPIC_AUTH_TOKEN、ANTHROPIC_CUSTOM_HEADERS", "本机全局 settings 保持现状，不因旁路试验而修改"],
        tags: ["ModelCard", "config", "secrets", "Claude Code settings"]
      },
      {
        id: "staging", title: "测试环境端到端验收", priority: "critical",
        summary: "在接近线上网络与配置的环境跑完整能力矩阵，而非只在本机通过。",
        goal: ["文本/VLM/工具/流式", "长上下文与故障", "并发与延迟基线"],
        verify: ["固定用例与结果归档", "失败分类和修复回归", "无本地专属依赖"],
        acceptance: ["P0/P1 用例全部通过", "已知限制有清单和兜底"],
        risks: ["环境差异掩盖问题"], tags: ["staging", "E2E", "acceptance"]
      },
      {
        id: "accuracy", title: "真实任务与准确率验证", priority: "critical",
        summary: "使用真实 Claude Code 工作负载验证不只是能回答，还要保证工具选择、上下文和结果质量。",
        goal: ["代码理解/修改/测试任务", "多轮与压缩任务", "失败案例人工归因"],
        verify: ["与直接基线对照", "协议丢失导致的质量问题单列", "重复运行观察稳定性"],
        acceptance: ["达到约定可用门槛", "无系统性字段丢失"],
        risks: ["只看 HTTP 成功率会掩盖准确率问题"], tags: ["accuracy", "real tasks", "evaluation"]
      },
      {
        id: "load", title: "性能与容量", priority: "normal",
        summary: "测量 TTFT、总延迟、并发、错误率和资源占用，确定安全运行参数。",
        goal: ["单请求基线", "并发梯度", "长流式连接与资源回收"],
        verify: ["P50/P95 延迟", "不同并发错误率", "连接中断无泄漏"],
        acceptance: ["容量边界明确", "超限时可快速失败或排队"],
        risks: ["上游限流与本地瓶颈混淆"], tags: ["performance", "concurrency", "TTFT"]
      },
      {
        id: "gray-release", title: "灰度上线与回滚", priority: "critical",
        summary: "小流量上线，保留快速切回旧链路的能力，并观察真实错误和质量。",
        goal: ["灰度范围和持续时间", "关键指标阈值", "一键回滚路径"],
        verify: ["灰度前演练回滚", "线上 smoke", "指标与日志可见"],
        acceptance: ["异常可在约定时间内回退", "无大面积 oncall 风险"],
        risks: ["无回滚就扩大流量"], tags: ["release", "rollback", "gray"]
      },
      {
        id: "runbook", title: "Runbook 与已知限制", priority: "normal",
        summary: "沉淀启动、验证、故障定位、常见错误、升级检查和当前不支持项。",
        goal: ["值班排查步骤", "错误码/日志关键词", "CC/SDK 升级回归清单"],
        verify: ["由非开发者按文档完成一次排障", "每个已知限制有影响和兜底"],
        acceptance: ["oncall 不依赖口头知识", "文档与当前版本一致"],
        risks: ["代码变化后文档失效"], tags: ["runbook", "oncall", "docs"]
      }
    ]
  }
];

const STORAGE_KEY = "cc-genai-roadmap-status-v2";
const LEGACY_STORAGE_KEY = "cc-genai-roadmap-progress-v1";
const defaults = Object.fromEntries(phases.flatMap(p => p.nodes).map(n => [
  n.id,
  n.blocked ? "blocked" : n.done ? "done" : n.inProgress ? "active" : "pending"
]));
let statuses = loadStatuses();
let selectedId = null;
let activeFilter = "all";

const roadmap = document.querySelector("#roadmap");
const detailPanel = document.querySelector("#detailPanel");
const searchInput = document.querySelector("#searchInput");

function loadStatuses() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    if (Object.keys(saved).length) return { ...defaults, ...saved };
    const legacy = JSON.parse(localStorage.getItem(LEGACY_STORAGE_KEY) || "{}");
    const migrated = Object.fromEntries(Object.entries(legacy).map(([id, done]) => [id, done ? "done" : defaults[id]]));
    return { ...defaults, ...migrated };
  } catch { return { ...defaults }; }
}

function saveStatuses() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(statuses));
}

function allNodes() { return phases.flatMap(p => p.nodes.map(n => ({ ...n, phase: p.title }))); }
function statusOf(node) { return statuses[node.id] || defaults[node.id] || "pending"; }

function render() {
  const query = searchInput.value.trim().toLowerCase();
  roadmap.innerHTML = phases.map(phase => {
    const nodesHtml = phase.nodes.map(node => {
      const status = statusOf(node);
      const done = status === "done";
      const blocked = status === "blocked";
      const active = status === "active";
      const haystack = JSON.stringify(node).toLowerCase();
      const matchesSearch = !query || haystack.includes(query);
      const matchesFilter = activeFilter === "all" ||
        (activeFilter === "done" && done) ||
        (activeFilter === "pending" && status === "pending") ||
        (activeFilter === "blocked" && blocked) ||
        (activeFilter === "critical" && node.priority === "critical");
      const hidden = !(matchesSearch && matchesFilter);
      return `
        <button class="node ${done ? "completed" : ""} ${blocked ? "blocked" : ""} ${active ? "in-progress" : ""} ${node.recommended ? "recommended" : ""} ${selectedId === node.id ? "selected" : ""} ${hidden ? "hidden" : ""}" data-node-id="${node.id}" type="button">
          <span class="node-orb">${done ? "✓" : blocked ? "!" : active ? "↻" : node.recommended ? "→" : ""}</span>
          <span class="node-meta"><span class="node-id">${node.id}</span><span class="priority ${node.priority}">${node.priority === "critical" ? "关键" : "常规"}</span></span>
          <h4>${node.title}</h4>
          <p>${node.summary}</p>
          <span class="node-status">${done ? "● 已完成" : blocked ? "◆ 无法解决 · 不计入本期" : active ? "◉ 正在进行" : node.recommended ? "◉ 建议下一步" : "○ 待处理"}</span>
        </button>`;
    }).join("");
    const doneInPhase = phase.nodes.filter(n => statusOf(n) === "done").length;
    const actionableInPhase = phase.nodes.filter(n => statusOf(n) !== "blocked").length;
    return `
      <section class="phase" data-phase="${phase.id}">
        <header class="phase-head">
          <span class="phase-number">${phase.number}</span>
          <div class="phase-title"><h3>${phase.title}</h3><p>${phase.subtitle}</p></div>
          <span class="phase-count">${doneInPhase} / ${actionableInPhase}</span>
        </header>
        <div class="node-list">${nodesHtml}</div>
      </section>`;
  }).join("");

  document.querySelectorAll(".node").forEach(button => {
    button.addEventListener("click", () => selectNode(button.dataset.nodeId));
  });
  updateProgress();
}

function selectNode(id) {
  selectedId = id;
  const node = allNodes().find(item => item.id === id);
  if (!node) return;
  const status = statusOf(node);
  detailPanel.innerHTML = `
    <div class="detail-content">
      <div class="detail-top">
        <div><span class="detail-code">${node.id} · ${node.phase}</span><h3>${node.title}</h3></div>
        <span class="priority ${node.priority}">${node.priority === "critical" ? "关键路径" : "常规节点"}</span>
      </div>
      <p class="detail-summary">${node.summary}</p>
      <section class="status-control" aria-label="节点状态">
        <h4>节点状态</h4>
        <div class="status-buttons">
          ${statusButton("pending", "○ 待处理", status)}
          ${statusButton("active", "◉ 进行中", status)}
          ${statusButton("done", "✓ 已完成", status)}
          ${statusButton("blocked", "! 无法解决", status)}
        </div>
        <p class="status-hint">“无法解决”表示受外部能力或权限限制，并自动从本期进度与下一节点中排除。</p>
      </section>
      ${detailSection("实现范围", node.goal)}
      ${detailSection("验证方式", node.verify)}
      ${detailSection("完成标准", node.acceptance)}
      ${detailSection("风险与边界", node.risks)}
      ${node.evidence ? detailSection("当前证据", node.evidence) : ""}
      <section class="detail-section"><h4>相关标签</h4><div class="tags">${node.tags.map(t => `<span class="tag">${t}</span>`).join("")}</div></section>
    </div>`;
  document.querySelectorAll("[data-status]").forEach(button => {
    button.addEventListener("click", () => {
      statuses[id] = button.dataset.status;
      saveStatuses();
      render();
      selectNode(id);
    });
  });
  render();
}

function statusButton(value, label, current) {
  return `<button class="status-button status-${value} ${current === value ? "selected" : ""}" data-status="${value}" type="button">${label}</button>`;
}

function detailSection(title, items) {
  return `<section class="detail-section"><h4>${title}</h4><ul>${items.map(item => `<li>${item}</li>`).join("")}</ul></section>`;
}

function updateProgress() {
  const nodes = allNodes();
  const actionable = nodes.filter(n => statusOf(n) !== "blocked");
  const done = actionable.filter(n => statusOf(n) === "done").length;
  const pct = Math.round(done / actionable.length * 100);
  document.querySelector("#doneCount").textContent = done;
  document.querySelector("#remainingCount").textContent = actionable.length - done;
  document.querySelector("#totalCount").textContent = actionable.length;
  document.querySelector("#progressPercent").textContent = `${pct}%`;
  document.querySelector("#progressFill").style.width = `${pct}%`;
}

document.querySelectorAll(".filter").forEach(button => {
  button.addEventListener("click", () => {
    activeFilter = button.dataset.filter;
    document.querySelectorAll(".filter").forEach(item => item.classList.toggle("active", item === button));
    render();
  });
});

searchInput.addEventListener("input", render);

document.querySelector("#nextButton").addEventListener("click", () => {
  const next = allNodes().find(n => statusOf(n) !== "blocked" && n.recommended && statusOf(n) !== "done") || allNodes().find(n => statusOf(n) === "active" || statusOf(n) === "pending");
  if (!next) return;
  activeFilter = "all";
  searchInput.value = "";
  document.querySelectorAll(".filter").forEach(item => item.classList.toggle("active", item.dataset.filter === "all"));
  selectNode(next.id);
  requestAnimationFrame(() => document.querySelector(`[data-node-id="${next.id}"]`)?.scrollIntoView({ behavior: "smooth", block: "center" }));
});

document.querySelector("#resetButton").addEventListener("click", () => {
  if (!confirm("确定恢复为项目当前的默认进度吗？")) return;
  statuses = { ...defaults };
  saveStatuses();
  selectedId = null;
  detailPanel.innerHTML = `<div class="detail-empty"><span class="empty-icon">↗</span><h3>选择一个节点</h3><p>查看目标、实现内容、验证方式、完成标准和风险。</p></div>`;
  render();
});

render();
selectNode("endpoint-contract");
