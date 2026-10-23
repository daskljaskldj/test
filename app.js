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
        summary: "历史验收：gemini-4-argon 时期，真实 Claude Code 完成端到端文本调用；当前模型仍需分别验收。",
        goal: ["排除 curl/自制客户端模拟", "验证 CC 原生 stream 请求", "确认本地 settings 覆盖生效"],
        verify: ["CC 输出指定文本", "调试日志记录 /v1/messages", "服务端返回 200"],
        acceptance: ["退出码 0", "stop_reason=end_turn", "请求和响应均来自真实链路"],
        risks: ["全局 Ark 配置抢占 ANTHROPIC_BASE_URL"],
        evidence: ["输出：真实 Claude Code 链路成功", "input 225 / output 10 tokens"], tags: ["Claude Code", "E2E"]
      },
      {
        id: "real-multiturn", title: "真实 CC 多轮文本", priority: "critical", done: true,
        summary: "历史验收：gemini-4-argon 时期用 --resume 恢复同一 CC session，验证历史由 CC 真实携带；不代表 Gemini 系列均已通过。",
        goal: ["第一轮写入唯一标记", "第二轮不重复标记", "第二轮依靠历史准确回答"],
        verify: ["同一 session_id", "两次 /v1/messages 200", "session 文件角色顺序正确"],
        acceptance: ["user→assistant→user→assistant 完整", "第二轮正确返回 CC-MULTI-6F3A91"],
        risks: ["把两个独立单轮误判成多轮"],
        evidence: ["真实 session 四条消息已核验", "第二轮 input tokens 增长"], tags: ["多轮", "resume", "history"]
      },
      {
        id: "real-vlm", title: "真实 CC 单图 VLM", priority: "critical", done: true,
        summary: "历史验收：gemini-4-argon 时期在 Trae 终端粘贴 PNG，确认 CC 发送真实图片并正确识图；其他模型分别验收。",
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
    subtitle: "本地明确走query AK；正式任务快照尚缺，不能与本地探针混同；401根因未定、不再索取AK",
    nodes: [
      {
        id: "endpoint-contract", title: "端点协议探测（历史记录）", priority: "critical", done: true,
        summary: "保留 Argon 与 3.8-flash 的历史探测记录。R5 最终回答断言已离线补强，但没有重跑线上探针；完成标记不代表当前模型或全系列完整验收。以下旧版本证据不自动迁移。",
        goal: ["分别验证 functionCall/functionResponse 带 id 与不带 id", "验证不同名与同名并行工具调用", "验证顺序多步工具及多个 functionResponse 的 turn 分组", "把端点差异固化为显式兼容配置"],
        verify: ["每个场景都走真实 ModelHub，而非本地 mock", "保留脱敏后的请求形态、HTTP 状态和响应结论", "结果与现有文档中的旧端点差异对照"],
        acceptance: ["按具体模型、配置版本记录 id 接受规则", "并行同名调用结果不会错配且断言最终回答", "历史请求接受与完整语义验收分开记录"],
        risks: ["旧端点规则不能泛化到整个 Gemini 系列", "资源限流不等于协议不支持", "R5 新断言已离线通过，但尚无目标模型的线上新验收"],
        evidence: ["2026-10-21：真实 seed 请求成功，Argon 返回 functionCall.id 与 thoughtSignature", "首次回放遇到 HTTP 429；有限退避重试后恢复，不将资源错误误判成协议错误", "真实 with_id 回放：PASS", "真实 without_id 回放：PASS", "不同名并行工具：PASS；一次返回 lookup_alpha 与 lookup_beta，两个调用 ID 唯一", "同名并行工具：PASS；两次 lookup_item 仍保持两个唯一调用 ID，结果未错配", "两种并行场景都把两个 functionResponse 放在同一个 GenAI user turn 后成功闭环", "实测两个 functionCall Part 中只有一个携带 thoughtSignature；实现必须按实际存在情况保存，不能假设每个调用都有签名", "新增 3 个并行回归用例；当前 26 个单元测试全部通过", "连续两轮工具真实探针已就绪：强制 step_one→回传→step_two→回传→最终回答，并核验跨轮 ID 与 signature", "探针语法检查及 26 个回归测试通过；当前等待在 Trae 可见终端执行真实请求"],
        tags: ["Argon", "id", "parallel tools", "thoughtSignature"]
      },
      {
        id: "native-stream", title: "原生增量流式（历史阻塞）", priority: "critical", blocked: true,
        summary: "阻塞证据仅来自 4-argon 历史权限错误；3.8-flash 原生流尚未核验。按卡片分别验证并显式选择 native 或 buffered_sse，不能把旧阻塞泛化到 Gemini 系列。",
        goal: ["按模型配置声明 native/buffered 模式", "buffered 模式直接使用 generateContent，避免无说明自动降级", "具备权限和资源后验证对应卡片的原生增量"],
        verify: ["历史 4-argon 权限错误与其他模型待验收分别记录", "合法 Messages SSE 事件可被 CC 消费", "输出显式模式与实际传输行为一致"],
        acceptance: ["缓冲 SSE 不描述为原生流式", "每张卡片能力单独确认，未测不宣称不支持", "资源、权限阻塞与适配器实现待办分开记录"],
        risks: ["首 token 必须等待上游完整响应", "长回答的用户可见延迟较高", "上游接口开放时间不由本项目控制"],
        evidence: ["2026-10-21：SDK 调用 streamGenerateContent 返回 401 no model permission: gemini-4-argon", "设计文档的 generate_content_stream 也标记为 Phase 2 未实现", "当前可用方案：generateContent 完成后转换为 Anthropic SSE"],
        tags: ["external-blocked", "streamGenerateContent", "buffered_sse"]
      },
      {
        id: "tool-definitions", title: "R2前置 · 本地鉴权已确认，任务配置待核对", priority: "critical", inProgress: true, recommended: true,
        summary: "STEP-048：已沿同一CLI入口用合成凭据和MockTransport核对，当前本地明确为URL查询ak、无Authorization；不是evals合并后选出的分支。正式框架基础配置/额外覆盖链已追踪，未见自动开启鉴权开关。按项目记录尚无本项目Merlin验收任务或最终配置快照，不能替任务下结论。最近真实结果仍401；本步不联网请求模型、不索取AK、不修改鉴权代码，R2线上待定。",
        goal: ["JSON Schema 字段转换", "tool_choice auto/any/指定工具映射", "保留工具名称与描述"],
        verify: ["单工具、多工具、嵌套 schema", "不支持的 schema 关键字明确处理"],
        acceptance: ["模型可看到并选择正确工具", "schema 不被静默破坏"],
        risks: ["两种协议 JSON Schema 支持范围不同"],
        evidence: ["2026-10-22：已移除缩窄联合/静默删字段的清洗逻辑；复杂 Schema 走 parameters_json_schema", "真实 SDK + MockTransport 验证同步/流式最终 HTTP 请求，保留引用、约束、false、null 与混合枚举", "非字符串/空枚举避免 SDK 普通 Schema 的重新解释；非法 JSON 明确报错并隔离输入可变值", "2026-10-23 STEP-040：R2 专项 6 tests / OK；额外 10 组 Schema × 同步/流式共 20 次最终请求断言 PASS，3 类非法 JSON 拒绝", "覆盖递归引用、组合/条件、数值/字符串/数组约束、false/null/枚举、属性名及基础数组/null；未修改协议源码，也未请求模型", "当前 editable SDK 下的离线保真已复验；目标卡片及其他 Gemini 卡片在线接受情况待验证，节点不标完成"], tags: ["tools", "schema", "function calling"]
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
        id: "thinking", title: "R3 后续 · 会话/模型签名隔离", priority: "critical",
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
        id: "response-semantics", title: "R1 / R4 · 响应与异常链（离线通过）", priority: "critical", inProgress: true,
        summary: "R1 结束原因及 R4 异常链脱敏已离线修复，全量 42 项通过。HTTP 状态码和固定诊断类别保留，原始异常、响应正文与 URL 不外传；其余响应语义仍待验收。",
        goal: ["end_turn/max_tokens/tool_use/stop_sequence", "input/output/cache token 策略", "4xx/5xx/error event 映射"],
        verify: ["每个 stop reason 契约测试", "超时、过载、资源耗尽", "客户端显示可理解"],
        acceptance: ["不把错误伪装成正常回答", "usage 字段稳定且有来源"],
        risks: ["上游错误文案不稳定", "重试造成重复请求"],
        evidence: ["真实 SDK 非流式/流式 MAX_TOKENS 均映射为 max_tokens；STOP 保持 end_turn", "2026-10-23：R4 覆盖 APIError、HTTPError、缺失 message、SDK 异常响应、流中断及 fallback 失败", "标准 traceback 与异常日志不含合成敏感标记，安全异常无原始 cause/context；全量 42 tests / OK", "边界：不覆盖主动抓取 frame locals 或独立 HTTP 调试日志；未新增模型调用"], tags: ["errors", "usage", "finishReason"]
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
        id: "compat-probes", title: "CC 辅助接口与版本兼容", priority: "normal", inProgress: true,
        summary: "处理或明确 HEAD、count_tokens、模型探测及 beta header 等 CC 行为。",
        goal: ["记录 CC 实际请求面", "判断 404 是否无害", "必要时补 count_tokens"],
        verify: ["启动、单轮、交互、工具四类流程抓取", "不同 CC 版本 smoke"],
        acceptance: ["无误导性模型不存在提示", "升级前有兼容检查"],
        risks: ["CC 客户端行为随版本变化"], tags: ["count_tokens", "beta", "compatibility"]
      },
      {
        id: "regression", title: "R5 · 探针验收（离线通过）", priority: "critical", inProgress: true,
        summary: "共享协议回归加按模型配置矩阵，分别记录 Gemini 卡片的离线结果与真实 smoke；3.8 的 PASS 不自动代表其他模型。",
        goal: ["共享转换纯函数与 HTTP/SSE 契约测试", "至少两套合成模型配置覆盖默认值/覆盖规则与最终 SDK 参数", "按具体模型、配置版本、SDK 来源记录真实 CC smoke"],
        verify: ["字段保真与模型配置差异分别断言", "thinking/token/工具等设置不串用或静默丢失", "限流与权限受限保留待验收，测试不包含真实 AK"],
        acceptance: ["已支持卡片通过对应核心矩阵", "未测卡片不标 PASS，记录能力边界与待验收项"],
        risks: ["只测 happy path", "真实服务测试不稳定"], evidence: ["2026-10-23：R5 最终回答断言、seed/名称参数配对、Python 入口及 shell 聚合已离线通过", "PASS=0 / FAIL=1 / INCONCLUSIVE=2；FAIL 优先，空 case 不得成功，重复场景去重避免覆盖", "全量 55 tests / OK；没有重跑线上探针，当前模型与 Merlin 验收仍独立待办"], tags: ["tests", "contract", "smoke"]
      },
      {
        id: "observability", title: "日志、指标与安全", priority: "critical",
        summary: "记录足够的链路信息用于 oncall，同时对 AK、图片和完整 prompt 做脱敏。",
        goal: ["request id 和阶段耗时", "状态码/重试/stop reason 指标", "内容类型与数量而非敏感正文"],
        verify: ["成功与失败链路均可追踪", "日志扫描无 AK/base64", "并发请求可区分"],
        acceptance: ["问题能在日志中定位阶段", "敏感数据不落盘"],
        risks: ["为了排障过度记录用户内容"], evidence: ["2026-10-23：R4 标准异常链/日志脱敏离线通过；整体链路指标和日志安全验收仍待完成"], tags: ["logging", "metrics", "redaction"]
      }
    ]
  },
  {
    id: "delivery",
    number: "PHASE 04",
    title: "evals 合入与 Merlin 验证",
    subtitle: "本地验证后通过 Git 合入 evals，再由用户按目标模型配置发任务验收",
    nodes: [
      {
        id: "configuration", title: "Gemini 系列 ModelCard 配置兼容", priority: "critical", inProgress: true,
        summary: "本地新增ModelCardProfile内存注入入口与无AK示例卡；已验证3.8卡片最终参数、两模型配置隔离和运行时覆盖。未知字段/未实现签名裁剪明确拒绝，extension和重试关键词仅作元数据。正式evals/Merlin仍需框架父类/注册接入，不在任务中getpass；73项离线通过不是系列在线验收。",
        goal: ["对齐 evals ModelCard 与运行时参数优先级", "按卡片读取模型、端点、token/采样默认值、thinking、内置工具与函数调用设置", "流式、工具 ID 与签名策略按已验证能力配置，不凭型号猜测", "新模型通过配置与回归接入，凭据只在运行时提供"],
        verify: ["至少两套合成模型配置：相同 Messages 输入共用转换逻辑，最终 SDK 参数按卡片变化", "静态默认值/运行时覆盖与 false/0/缺省值边界", "不支持或冲突设置明确报错，配置及凭据来源可追溯", "在线结果绑定具体模型/配置/SDK；资源限制保留待验收"],
        acceptance: ["切换已支持模型无需修改公共转换函数", "模型设置不串用、不静默丢失，签名会话与模型隔离", "3.8 与 Gemini 4 分别记录覆盖范围，未验证项不标 PASS", "新环境可复现安装与启动，AK 不写入文件"],
        risks: ["仅替换 URL 不能保证 thinking/token/工具等设置生效", "资源限流不等于能力不支持", "历史成功或一个模型 PASS 不代表全系列验收"],
        evidence: ["2026-10-22：用户确认上线兼容目标为 Gemini 系列，3.8-flash 是当前开发验证模型", "2026-10-23 STEP-045：本地ModelCardProfile加载默认参数，核心支持内存AK，CLI禁止含AK文件；旧控制探针/服务仍使用target.py", "新增7项回归：两模型配置隔离、覆盖、未知设置拒绝、实际SDK普通/流式最终请求，当前全量73项通过", "修正当前editable SDK thinking内层别名与流式ak/alt查询兼容；未确认旧非流式401根因，SDK来源仍须固化", "正式evals父类/注册及R3待核对，不能将本地映射称为全系列在线通过", "历史旁路直连试验仅作参考，不改变主线转换任务", "本机全局Claude Code settings保持现状，凭据仅运行时提供"],
        tags: ["ModelCard", "config", "secrets", "Claude Code settings"]
      },
      {
        id: "staging", title: "Merlin 任务验收", priority: "critical",
        summary: "evals 合入后由用户在 Merlin 发起任务，按具体模型与配置核对实际运行结果。",
        goal: ["固定代码 commit、SDK 来源与 ModelCard", "覆盖文本/多轮/VLM/工具/流式相关任务", "按模型归档结果与未覆盖项"],
        verify: ["用户发起 smoke/正式任务", "记录任务链接、commit、模型配置与结果", "失败分类与定向回归，资源阻塞单列"],
        acceptance: ["目标任务环境可复现", "已支持卡片的相关任务达到约定可用门槛"],
        risks: ["本地 PASS 不替代 Merlin 验收", "Mac editable 目录不代表任务环境可安装"], tags: ["Merlin", "evals", "E2E", "acceptance"]
      },
      {
        id: "accuracy", title: "真实任务与准确率验证", priority: "critical",
        summary: "使用真实 Claude Code 工作负载验证不只是能回答，还要保证工具选择、上下文和结果质量。",
        goal: ["代码理解/修改/测试任务", "多轮与压缩任务", "失败案例人工归因"],
        verify: ["与直接基线对照", "协议丢失导致的质量问题单列", "重复运行观察稳定性"],
        acceptance: ["达到约定可用门槛", "无系统性字段丢失"],
        risks: ["只看 HTTP 成功率会掩盖准确率问题"], evidence: ["用户建议 PayerBench、MM-ToolSandBox 少量验证文本多轮与多模态；先各1个短case检查路由，跑通后再扩到3–5例", "本地发现PaperBench Detail候选，是否对应PayerBench待确认；MM-ToolSandBox入口未定位。需确认collection/exercise且模型请求实际经过适配器，尚未提交或运行Merlin任务"], tags: ["accuracy", "real tasks", "evaluation"]
      },
      {
        id: "load", title: "性能与容量", priority: "normal",
        summary: "按 evals 实际运行需要记录目标模型的延迟、并发与错误率，区分适配器开销和上游资源限制。",
        goal: ["单请求基线", "并发梯度", "长流式连接与资源回收"],
        verify: ["P50/P95 延迟", "不同并发错误率", "连接中断无泄漏"],
        acceptance: ["容量边界明确", "超限时可快速失败或排队"],
        risks: ["上游限流与本地瓶颈混淆"], tags: ["performance", "concurrency", "TTFT"]
      },
      {
        id: "gray-release", title: "Git 合入与版本回退", priority: "critical",
        summary: "把可审查改动合入正式 evals 仓库，记录准确版本，再由用户发起 Merlin 验证。",
        goal: ["核对实际注册与调用契约", "功能分支/MR 与依赖可复现", "记录 commit 与可回退版本"],
        verify: ["正式 checkout 的目标检查通过", "MR 展示核心改动与验证范围", "任务配置使用准确 commit"],
        acceptance: ["转换模块与 evals 契约对齐", "异常能定位并回退代码/配置版本"],
        risks: ["参考导出目录不是可推送 checkout", "已有 GenAIProvider 不能直接被 Messages 转换器替换"], tags: ["Git", "evals", "MR", "rollback"]
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
