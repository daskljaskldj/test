const mission = {
  "meta": {
    "title": "CC × GenAI 适配路线图",
    "subtitle": "本地协议适配 → 本地验证 → 合入 evals → Merlin 任务验证",
    "updated": "2026-10-23",
    "revision": "round2-dispatch-20261023",
    "totalNodes": 15,
    "phases": 4,
    "currentModel": "gemini-3.8-flash",
    "offlineTests": 140,
    "nextWork": "第二轮：签名历史 · 流式结束 · 多模态回归"
  },
  "constraints": [
    {
      "level": "blocked",
      "title": "当前真实验证阻塞 · HTTP401",
      "text": "最近按3.8-flash ModelCard真实请求仍401，根因未确认。仅阻塞真实调用验证，不阻塞R3等本地实现；不反复索取AK、不认定AK失效。"
    },
    {
      "level": "note",
      "title": "第二轮已安排 · 新结果待主窗口验收",
      "text": "B补签名历史，C补流式结束，主窗口补多模态矩阵并做接线验收。上一轮140项已通过，本轮不得提前计入；第一阶段尚未整体完成。"
    },
    {
      "level": "note",
      "title": "能力边界按模型记录",
      "text": "4-argon原生流权限错误仅是历史记录，3.8原生流待验。历史成功不自动迁移到其他型号；不将“待确认”写成“无法实现”。"
    }
  ],
  "execution": {
    "title": "第二轮分工 · 为18:00进度同步准备",
    "roundLabel": "第二轮执行中",
    "note": "仍在第01阶段「本地协议适配」。本轮先补签名历史、流式结束及多模态离线覆盖；只有主窗口验收后才更新通过结果。",
    "state": "B、C第二轮均已启动；主窗口准备多模态专项及最终接线验收。原140项是上一轮已验收基线，本轮尚未增加通过数。",
    "rule": "网页节点是唯一任务入口：先登记父节点、子项、负责人和验收条件，再派工。子项完成标子项；父节点全部满足完成标准才点亮。",
    "cards": [
      {
        "owner": "转换B",
        "nodeId": "signature",
        "taskIds": [
          "signature-history"
        ]
      },
      {
        "owner": "转换C",
        "nodeId": "streaming",
        "taskIds": [
          "stream-termination"
        ]
      },
      {
        "owner": "主窗口",
        "nodeId": "multimodal",
        "taskIds": [
          "multimodal-matrix"
        ]
      }
    ]
  },
  "phases": [
    {
      "id": "local-adaptation",
      "code": "PHASE 01",
      "title": "本地协议适配",
      "subtitle": "先把转换能力补齐；当前继续 R3，不把鉴权排查当成开发主线",
      "nodes": [
        {
          "id": "text-conversion",
          "title": "文本与多轮转换",
          "status": "done",
          "progress": "基础范围已实现 · 离线有覆盖",
          "implementation": "基础角色、文本、历史、采样及响应转换已实现",
          "offline": "R1 枚举修复与基础契约已覆盖",
          "live": "当前 3.8-flash 完整真实 CC 矩阵待验收",
          "summary": "已实现 Messages ↔ GenAI 基础文本与历史转换；此节点的点亮仅表示基础实现范围，不代表所有协议字段或当前模型端到端通过。",
          "goal": [
            "system、user/assistant 与多轮历史转换",
            "文本、基础 usage、STOP/MAX_TOKENS 等响应映射"
          ],
          "pending": [
            "新增或不支持的内容块继续明确处理，不静默丢弃",
            "当前模型真实验证在第二阶段单独记录"
          ],
          "verify": [
            "真实 SDK 响应对象检查普通/流式结束原因",
            "基础请求/响应的字段、角色与顺序回归"
          ],
          "acceptance": [
            "基础支持范围内字段转换有对应离线断言",
            "基础实现完成与模型真实验收明确分开"
          ],
          "risks": [
            "不把一个结束原因修复等同全部响应语义完成"
          ],
          "evidence": [
            "R1：真实 SDK MAX_TOKENS → max_tokens，STOP → end_turn，离线通过",
            "请求/响应基础转换包含在既有回归基线中"
          ],
          "tags": [
            "Messages",
            "GenAI",
            "文本",
            "多轮",
            "R1"
          ],
          "sourceIds": [
            "request-conversion",
            "response-conversion"
          ],
          "priority": "critical",
          "recommended": false,
          "cardSummary": "基础文本、角色与历史双向转换，完成基础支持范围。",
          "badges": [
            "实现已完成",
            "离线有覆盖",
            "当前实测待验"
          ]
        },
        {
          "id": "tools",
          "title": "工具调用适配",
          "status": "active",
          "progress": "部分完成 · R2 离线通过",
          "implementation": "定义、选择、调用/回传及并行基础逻辑已实现",
          "offline": "复杂 Schema 保真已验证，含专项及实际 SDK 请求检查",
          "live": "当前卡片复杂 Schema 接受性、闭环待验证",
          "summary": "恢复为功能节点：覆盖工具 Schema、tool_use/tool_result、连续与并行调用；401 不再占用本节点。",
          "goal": [
            "保留复杂 Schema 的联合、引用及约束",
            "functionCall ↔ tool_use、tool_result ↔ functionResponse",
            "客户端工具与 Google 内置工具区分"
          ],
          "pending": [
            "当前模型复杂 Schema 与最终回答闭环验证",
            "媒体 tool_result 当前明确拒绝，需补支持或声明边界",
            "google_search 共存与 grounding/citation 展示策略待验收"
          ],
          "verify": [
            "单/多工具、同名/不同名并行与连续调用",
            "工具失败回传、最终答案及无额外工具断言"
          ],
          "acceptance": [
            "支持字段不静默损坏",
            "工具选择→执行→回传→最终答案完整且不配错"
          ],
          "risks": [
            "Schema 离线保真不证明目标模型接受",
            "ID 请求被接受不等于完整闭环已通过"
          ],
          "evidence": [
            "R2 已移除联合缩窄/静默删字段，复杂结构走 parameters_json_schema",
            "专项6项与额外20次同步/流式最终请求保真检查通过",
            "R5 新最终答案断言仅离线通过，历史实测未按新断言重跑"
          ],
          "tags": [
            "tools",
            "schema",
            "R2",
            "function calling"
          ],
          "sourceIds": [
            "endpoint-contract",
            "tool-definitions",
            "tool-use-response",
            "tool-result-loop",
            "builtin-tools"
          ],
          "priority": "critical",
          "recommended": false,
          "cardSummary": "复杂Schema、调用与结果回传已有实现，工具闭环继续补验。",
          "badges": [
            "实现部分完成",
            "R2离线通过",
            "当前实测待验"
          ]
        },
        {
          "id": "signature",
          "title": "思考与签名管理 · R3",
          "status": "active",
          "progress": "隔离与TTL离线通过 · R3整体仍部分完成",
          "implementation": "作用域隔离＋可选写入TTL/本地清理；ContextStore到期不可读，默认TTL关闭",
          "offline": "B专项29项通过；主窗口路由到期验证及全量140项通过",
          "live": "真实CC会话标识、当前模型签名多轮与压缩场景仍待验证",
          "summary": "转换B本轮交付已由主窗口验收：可配置过期、读取不续期、本地清理及并发保护。ContextStore不做不安全的读后删除，物理回收仍由框架负责；压缩与正式接线等未完成。",
          "goal": [
            "只保存实际返回的签名，跨轮原样回填",
            "会话/模型隔离、生命周期与压缩后的匹配",
            "明确 thinking/redacted_thinking 的承接边界"
          ],
          "pending": [
            "按框架生命周期确定TTL并接线；共享物理清理/重启恢复仍待集成",
            "处理同一会话工具ID重用、内容匹配与压缩后的回填",
            "真实CC会话来源及正式evals ContextStore接线仍待验证",
            "请求端thinking/redacted_thinking内容块尚未支持"
          ],
          "verify": [
            "已离线验证：同ID跨会话/实例/实际模型/路由不串签名",
            "已离线验证：普通↔流式回填、双路SSE并发、真实SDK签名字节",
            "已离线验证：ContextStore回调逐签名独立键、异常脱敏与缺会话拒绝",
            "本轮已验：到期边界、读取不续期、并发清理及ASGI跨轮到期不回填"
          ],
          "acceptance": [
            "不会向另一会话/模型回填签名",
            "不泄露隐藏思维，不伪造缺失签名"
          ],
          "risks": [
            "无明确会话ID时，纯文本不跨请求缓存；工具历史在上游调用前400",
            "真实CC是否自动携带可用会话ID尚未验证；该身份键不是鉴权机制",
            "共享TTL需读写方全部升级与时钟同步；同会话ID重用/压缩匹配及框架验收仍待补"
          ],
          "evidence": [
            "STEP-051：旧跨会话串用红测复现后修复；新增21项路由+12项存储/回调",
            "全量106项离线通过；上游为mock，未输入AK或请求真实模型",
            "重复query路由差异红测后修复，独立复核确认隔离",
            "默认线程安全LRU；可注入ContextStore适配器已实现，正式接线未做",
            "STEP-054：B新增17项生命周期测试、专项29项通过；主窗口全量140项/3.892s/OK，非线上验收"
          ],
          "tags": [
            "R3",
            "signature",
            "ContextStore",
            "thinking"
          ],
          "sourceIds": [
            "thinking"
          ],
          "priority": "critical",
          "recommended": true,
          "cardSummary": "隔离/生命周期已离线通过；B第二轮补同会话ID重用与历史安全匹配。",
          "badges": [
            "TTL离线通过",
            "主窗口已验收",
            "真实CC待验"
          ],
          "workItems": [
            {
              "id": "signature-isolation",
              "title": "会话、模型与路由隔离",
              "owner": "主窗口",
              "status": "done",
              "work": "防止相同工具ID在不同会话、实例或模型间串用签名。",
              "acceptance": "普通与流式读写绑定同一作用域；不同作用域不得互相回填。",
              "evidence": "STEP-051：新增33项隔离回归，包含在历史106项基线中。"
            },
            {
              "id": "signature-lifecycle",
              "title": "签名生命周期：过期、清理与并发",
              "owner": "转换B",
              "status": "done",
              "work": "加入可配置过期时间、到期读取保护、本地清理；读取不延长有效期。",
              "acceptance": "边界到期不可读，清理不误删并发新值；默认不启用时间过期，不擅定生产时长。",
              "evidence": "STEP-054：B新增17项；主窗口统一140项离线验收通过。"
            },
            {
              "id": "signature-history",
              "title": "同会话ID重用、历史与压缩回填",
              "owner": "转换B",
              "status": "active",
              "work": "明确历史工具调用如何匹配签名，避免ID重用或压缩后误配。",
              "acceptance": "正常历史、ID重用和压缩后匹配有明确规则与回归，不伪造或借用签名。",
              "evidence": "STEP-056：本轮已安排，等待实现、专项结果及主窗口验收；尚无新增PASS。"
            },
            {
              "id": "signature-thinking",
              "title": "思考请求块的承接边界",
              "owner": "待分派",
              "status": "pending",
              "work": "明确thinking/redacted_thinking等请求块的处理与保留策略。",
              "acceptance": "支持范围有对应验证，不支持部分明确报错，不静默损坏历史。",
              "evidence": "尚未完成；没有因TTL通过而升级此项状态。"
            }
          ],
          "completionRule": "本地隔离、生命周期、历史/压缩匹配和思考块边界逐项实现并通过离线验证后，才完成此节点的本地实现范围。现在只是前两项通过。",
          "relatedNodes": [
            "evals-contract",
            "real-cc",
            "complex-context"
          ]
        },
        {
          "id": "multimodal",
          "title": "多模态适配",
          "status": "active",
          "progress": "基础已实现 · 扩展待补",
          "implementation": "基础 base64/URL 图片输入已实现",
          "offline": "图片数据映射有离线覆盖",
          "live": "4-argon 单图有历史成功；3.8 完整矩阵待验证",
          "summary": "保留基础图片转换，补齐多图、图片后追问与混合内容；历史单图成功不代表当前模型全部多模态通过。",
          "goal": [
            "base64→inline_data、URL→file_data",
            "图片与文本顺序、多图、多轮与格式边界"
          ],
          "pending": [
            "多图与图片后追问实测",
            "PNG/JPEG/WebP、尺寸边界及媒体工具结果范围确认"
          ],
          "verify": [
            "多图顺序、MIME、非法数据与尺寸边界",
            "真实 CC 发送图片，不用路径或预填答案代替"
          ],
          "acceptance": [
            "支持的图片内容和顺序保真",
            "未支持的媒体明确报错"
          ],
          "risks": [
            "图片成功不能自动扩展到音频或生成能力"
          ],
          "evidence": [
            "基础图片映射已有离线测试",
            "gemini-4-argon 曾在真实 CC 中完成单图识别，非当前模型验收"
          ],
          "tags": [
            "VLM",
            "image",
            "多图",
            "多轮"
          ],
          "sourceIds": [
            "real-vlm",
            "vlm-advanced"
          ],
          "priority": "critical",
          "recommended": false,
          "cardSummary": "主窗口补多图、图文顺序与图片后追问离线矩阵；不是模型识图准确率验收。",
          "badges": [
            "基础已实现",
            "离线有覆盖",
            "当前实测待验"
          ],
          "workItems": [
            {
              "id": "multimodal-matrix",
              "title": "多图与图片后追问的离线验证",
              "owner": "主窗口",
              "status": "active",
              "work": "检查同轮多图、图文顺序、图片后追问及SDK最终请求的保真；非法或未支持媒体明确拒绝。",
              "acceptance": "顺序、图片内容与类型、历史角色不丢失；核心转换和SDK最终请求均有断言，无真实联网。",
              "evidence": "STEP-056：正在准备专项；尚无新增PASS。"
            },
            {
              "id": "multimodal-followup",
              "title": "按验证结果补齐未覆盖的多模态边界",
              "owner": "待分派",
              "status": "pending",
              "work": "根据离线矩阵及目标模型实测，明确媒体工具结果和其他不支持输入的范围。",
              "acceptance": "支持项有实现与验证；未支持项明确列出，不把基础图片通过当作所有多模态能力通过。",
              "evidence": "未验收；真实CC多模态与目标模型结果另列02.02/02.03。"
            }
          ],
          "completionRule": "本地约定的图片输入、多图与历史转换经过验证，并明确其余媒体边界后，才完成本节点的实现范围；模型识图质量和真实CC另验。",
          "relatedNodes": [
            "real-cc",
            "complex-context",
            "offline-regression"
          ]
        },
        {
          "id": "streaming",
          "title": "流式响应适配",
          "status": "active",
          "progress": "显式模式离线通过 · 原生场景仍待补验",
          "implementation": "默认buffered；native显式选择，无401隐式降级，空流明确报错",
          "offline": "C专项22项通过；主窗口SDK→Messages SSE组合验证与全量140项通过",
          "live": "4-argon 原生流历史权限错误；3.8 原生流未验收",
          "summary": "转换C本轮交付已由主窗口验收：缓冲直接走普通请求，原生增量明确选择；失败不偷偷重发普通请求。新增本地启动选项，两模式不混淆。当前模型能力及原生流更复杂结束语义仍待验收。",
          "goal": [
            "Messages SSE 事件顺序、文本与工具参数 delta",
            "按卡片显式声明原生流或缓冲流模式"
          ],
          "pending": [
            "补原生流无finishReason的结束及工具调用结束分片回归",
            "逐卡片验证原生能力、断连与真实CC行为；正式evals模式配置待接线"
          ],
          "verify": [
            "消息开始/内容块/结束事件与错误事件契约",
            "实际传输行为与声明模式一致",
            "本轮已验：两端点选择、首跳/中途失败不重发、空流错误、MAX_TOKENS与ASGI事件"
          ],
          "acceptance": [
            "缓冲 SSE 不冒充原生增量",
            "未测卡片不标不支持；外部限制按模型记证据"
          ],
          "risks": [
            "4-argon 权限记录不能泛化到整个 Gemini 系列",
            "模式选择通过不等于所有原生工具SSE语义完成；本轮未请求真实模型"
          ],
          "evidence": [
            "历史代码曾按特定401隐式fallback；STEP-054已移除，改为显式模式",
            "当前 SDK 流式 ak/alt 参数兼容已离线修复",
            "4-argon 原生流历史权限拒绝保留在历史区",
            "STEP-054：C新增10项模式测试、专项22项通过；主窗口增加路由/启动选项验收，全量140项通过"
          ],
          "tags": [
            "SSE",
            "native",
            "buffered"
          ],
          "sourceIds": [
            "native-stream"
          ],
          "priority": "critical",
          "recommended": false,
          "cardSummary": "显式模式已离线通过；C第二轮补意外EOF、工具终止与结束原因优先级。",
          "badges": [
            "模式离线通过",
            "主窗口已验收",
            "原生能力待验"
          ],
          "workItems": [
            {
              "id": "stream-mode",
              "title": "显式选择缓冲或原生流",
              "owner": "转换C",
              "status": "done",
              "work": "默认buffered完整响应后包装SSE；native原生增量必须显式选择。",
              "acceptance": "实际SDK端点与声明模式一致；不能把缓冲输出称作原生增量。",
              "evidence": "STEP-054：C模式专项通过；真实模型原生能力仍未验收。"
            },
            {
              "id": "stream-failure",
              "title": "失败不重发与空流保护",
              "owner": "转换C",
              "status": "done",
              "work": "取消401触发的隐式降级；首跳/中途错误不改走普通请求，空流明确失败。",
              "acceptance": "不产生重复生成；异常安全返回，空流不包装成正常完成。",
              "evidence": "与模式选择共用C新增10项回归，不重复计入140总数。"
            },
            {
              "id": "stream-wiring",
              "title": "本地调用方与Messages SSE组合接线",
              "owner": "主窗口",
              "status": "done",
              "work": "增加本地启动模式选项，核验ModelCard三路径和Messages事件。",
              "acceptance": "SDK端点、MAX_TOKENS、错误事件及启动选项与声明一致。",
              "evidence": "STEP-054：覆盖于主窗口新增7项组合测试与既有ModelCard测试。"
            },
            {
              "id": "stream-termination",
              "title": "原生流复杂结束语义",
              "owner": "转换C",
              "status": "active",
              "work": "补已有内容但缺结束原因、工具分片后独立STOP等结束边界。",
              "acceptance": "不把未正常结束的生成标成功，也不错误覆盖工具调用结束状态。",
              "evidence": "STEP-056：本轮已安排，等待实现、专项结果及主窗口验收；尚无新增PASS。"
            }
          ],
          "completionRule": "显式模式、异常/空流处理、事件接线及声明支持的结束语义均有回归，才完成本地流式实现范围。复杂结束语义仍待补；逐模型实测另验。",
          "relatedNodes": [
            "modelcard",
            "real-cc",
            "complex-context",
            "evals-contract"
          ]
        },
        {
          "id": "modelcard",
          "title": "Gemini 系列配置兼容",
          "status": "active",
          "progress": "部分完成 · 非完整框架接入",
          "implementation": "有限 ModelCardProfile 已实现，并非所有入口均已替代固定目标",
          "offline": "两套模型配置、运行时覆盖与最终 SDK 参数已离线验证",
          "live": "当前3.8卡片仍401；其他型号分别待验收",
          "summary": "按每张 ModelCard 读取模型设置，不只替换 URL；正式任务最终由框架注入配置与凭据，不在任务内 getpass。",
          "goal": [
            "模型、端点、token/thinking、工具默认值及运行时覆盖",
            "公共转换逻辑与模型能力配置分离"
          ],
          "pending": [
            "正式框架注入、注册与参数优先级对齐",
            "base_url 等未承接字段保持明确拒绝",
            "extension/重试关键词仅元数据，签名裁剪 true 仍待实现"
          ],
          "verify": [
            "至少两模型配置隔离，不串默认值",
            "false/0/缺省、冲突与未知配置边界"
          ],
          "acceptance": [
            "支持项实际进入 SDK 最终请求",
            "凭据只在运行时提供，正式任务非交互"
          ],
          "risks": [
            "3.8资源充足仅代表开发目标，不代表其他模型可免验收"
          ],
          "evidence": [
            "本地已核对65536/high/false/AUTO/google_search最终参数",
            "ModelCard 与 SDK 兼容新增7项回归，全量基线73项",
            "本地 query AK 已离线确认，不能据此判401根因"
          ],
          "tags": [
            "ModelCard",
            "Gemini",
            "配置",
            "SDK"
          ],
          "sourceIds": [
            "configuration"
          ],
          "priority": "critical",
          "recommended": false,
          "cardSummary": "逐卡片兼容Gemini设置，不仅仅替换模型URL。",
          "badges": [
            "有限映射已实现",
            "两模型离线覆盖",
            "正式接入待补"
          ]
        },
        {
          "id": "errors",
          "title": "错误与安全处理",
          "status": "active",
          "progress": "脱敏已离线修复 · 其余待完善",
          "implementation": "R4 标准异常链与 HTTPError 脱敏已实现",
          "offline": "普通/流式/fallback 脱敏和 R5 退出码已有离线覆盖",
          "live": "整体错误、重试与排障能力待验收",
          "summary": "保留状态码和安全诊断，补超时/重试边界及必要追踪；不建设独立网关监控平台。",
          "goal": [
            "结束/错误语义、标准异常与安全日志",
            "连接/响应超时、重试上限与工具副作用边界"
          ],
          "pending": [
            "补402/429/超时与重试耗尽映射",
            "实际请求追踪、阶段耗时和排障文档",
            "确认 CC HEAD/count_tokens/beta 行为，不默认都要实现接口"
          ],
          "verify": [
            "成功/失败/流中断均可定位阶段",
            "故障注入不泄露凭据、不无限重试、不重复执行工具"
          ],
          "acceptance": [
            "不把错误伪装正常答案",
            "敏感正文不进入标准日志或异常链"
          ],
          "risks": [
            "主动 frame locals 或 HTTP debug 日志不在已通过脱敏边界内"
          ],
          "evidence": [
            "R4 标准 traceback、APIError/HTTPError/fallback 脱敏离线通过",
            "R5：PASS=0/FAIL=1/INCONCLUSIVE=2，FAIL优先；没有新线上验收"
          ],
          "tags": [
            "R4",
            "安全",
            "errors",
            "retry"
          ],
          "sourceIds": [
            "response-semantics",
            "retry-timeout",
            "observability",
            "compat-probes"
          ],
          "priority": "critical",
          "recommended": false,
          "cardSummary": "脱敏已修复；继续补超时、重试与排障边界。",
          "badges": [
            "实现部分完成",
            "R4/R5离线通过",
            "整体待验收"
          ]
        }
      ]
    },
    {
      "id": "local-validation",
      "code": "PHASE 02",
      "title": "本地验证",
      "subtitle": "离线回归与真实 CC 分开；401 只阻塞真实调用验证",
      "nodes": [
        {
          "id": "offline-regression",
          "title": "离线回归",
          "status": "active",
          "progress": "当前基线140项通过 · 后续按改动补齐",
          "implementation": "现有单元测试与真实 SDK MockTransport 契约可运行",
          "offline": "STEP-054：140 tests / 3.892s / OK，本轮实际全量回归",
          "live": "此节点不代表模型或 Merlin 验收",
          "summary": "R1/R2/R4/R5及R3隔离、TTL、显式流模式均有离线证据。主窗口已统一回归140项；后续历史回填、原生结束语义等按变更继续补验，测试数量不是模型验收率。",
          "goal": [
            "字段保真、Schema、签名隔离、配置差异与异常",
            "SDK 最终请求和探针语义/退出码"
          ],
          "pending": [
            "补R3历史回填/正式生命周期接线、原生结束语义及其他能力回归",
            "相关代码变更后定向重跑，再形成新全量基线"
          ],
          "verify": [
            "固定夹具，MockTransport不访问线上",
            "断言最终答案、错误分类和失败退出码"
          ],
          "acceptance": [
            "已实现能力有正向和边界覆盖",
            "离线结果不会被展示成模型实测通过"
          ],
          "risks": [
            "测试数量不是准确率或交付百分比"
          ],
          "evidence": [
            "STEP-051：全量106项通过，新增33项隔离回归",
            "旧73项/STEP-045基线与历史失败均保留；未新增线上模型验收",
            "STEP-054：106→140，新增34项；两窗口冻结后主窗口统一回归"
          ],
          "tags": [
            "tests",
            "离线",
            "R5"
          ],
          "sourceIds": [
            "regression"
          ],
          "priority": "critical",
          "recommended": false,
          "cardSummary": "B新增17项、C新增10项、主窗口新增7项；全量140项离线通过。",
          "badges": [
            "140项通过",
            "本步已重跑",
            "非模型验收"
          ],
          "workItems": [
            {
              "id": "offline-bc",
              "title": "本轮B/C交付的组合与全量回归",
              "owner": "主窗口",
              "status": "done",
              "work": "两窗口停止修改后，核对交付、补组合测试并统一跑全量回归。",
              "acceptance": "原有回归无退化，新增行为有断言；只报告离线覆盖范围。",
              "evidence": "STEP-054：140 tests / 3.892s / OK＝原106＋B17＋C10＋主窗口7。"
            },
            {
              "id": "offline-closeout",
              "title": "本地功能收口后的最终回归",
              "owner": "待分派",
              "status": "pending",
              "work": "在第一阶段约定功能补齐后，以明确代码与依赖版本形成交付基线。",
              "acceptance": "剩余功能与缺陷有结论，同一交付版本全量回归通过；依赖复现单独核验。",
              "evidence": "尚未到此里程碑；140项不是第一、二阶段全部完成的证据。"
            },
            {
              "id": "offline-round2",
              "title": "第二轮接线与统一回归",
              "owner": "主窗口",
              "status": "pending",
              "work": "B/C交付冻结后接入签名历史API、复核流式组合并跑全量回归。",
              "acceptance": "确认两窗口无并发写入，原有回归不退化，新增功能有跨模块断言；单列未完边界。",
              "evidence": "等待B/C交付后开始；140项仍是上轮基线。"
            }
          ],
          "completionRule": "开发期间每次修改都可做配套回归；第一阶段约定功能收口并完成交付版本回归后，才完成本节点。当前仅本轮回归完成，未完成整个第二阶段。",
          "relatedNodes": [
            "dependencies",
            "real-cc",
            "complex-context"
          ]
        },
        {
          "id": "real-cc",
          "title": "真实 CC 核心验证",
          "status": "blocked",
          "progress": "真实验证阻塞 · HTTP401根因待确认",
          "implementation": "本地 /v1/messages 联调工具已有实现",
          "offline": "JSON/SSE 契约已有覆盖",
          "live": "当前3.8完整CC矩阵未完成；历史结果独立保留",
          "summary": "按当前模型验证真实 CC 的单轮、多轮、工具、VLM 和 SSE。401 单列阻塞，不认定 AK 失效或 Schema 不支持。",
          "goal": [
            "CC→本地适配器→SDK→ModelHub→CC完整链路",
            "确认请求真的经过适配器，不使用自制客户端冒充 CC"
          ],
          "pending": [
            "有针对性地解决真实调用鉴权阻塞，不盲试或反复索取AK",
            "通过后补当前模型核心场景与工具最终答案验证"
          ],
          "verify": [
            "真实CC发送请求并消费响应",
            "按模型/配置/SDK归档返回与断言"
          ],
          "acceptance": [
            "当前模型核心矩阵有完整实证",
            "本地服务仅联调工具，不作为独立生产网关交付"
          ],
          "risks": [
            "HTTP200或工具ID被接受均不足以证明完整场景通过"
          ],
          "evidence": [
            "最近按3.8 ModelCard真实文本仍HTTP401/INCONCLUSIVE/exit2",
            "4-argon真实CC单轮/多轮/单图/工具历史成功保留在历史区"
          ],
          "tags": [
            "真实CC",
            "401",
            "E2E"
          ],
          "sourceIds": [
            "messages-service",
            "real-single",
            "real-multiturn"
          ],
          "priority": "critical",
          "recommended": false,
          "cardSummary": "真实CC单轮、多轮、工具与图片；当前受401阻塞。",
          "badges": [
            "联调服务已有",
            "契约有覆盖",
            "401根因待确认"
          ]
        },
        {
          "id": "complex-context",
          "title": "复杂场景验证",
          "status": "pending",
          "progress": "待验证 · 按能力分别记录",
          "implementation": "基础转换可复用，复杂场景尚未闭环",
          "offline": "相关场景的完整回归待补",
          "live": "尚无压缩、长输出续传完整验收",
          "summary": "保留手动/自动压缩、长上下文、失败恢复与续传，不因流程精简丢掉边界测试。",
          "goal": [
            "手动 /compact 与自动压缩分开",
            "多轮签名、工具失败恢复、长上下文",
            "continuation_token按模型能力单独验证"
          ],
          "pending": [
            "先补R3，再构造可核验的压缩与恢复案例",
            "确认当前卡片续传能力，不能照搬4-argon历史说明"
          ],
          "verify": [
            "确认真实触发压缩，摘要与后续请求可核验",
            "续传与CC上下文压缩是不同机制；检查重复/丢失"
          ],
          "acceptance": [
            "关键约束与历史不因适配器而丢失",
            "能力未确认时标待确认，不伪造通用支持"
          ],
          "risks": [
            "长输出成本高，模型续传不等于CC压缩"
          ],
          "evidence": [
            "历史规划保留；尚无对应完整通过证据"
          ],
          "tags": [
            "compact",
            "context",
            "continuation_token"
          ],
          "sourceIds": [
            "forced-compact",
            "auto-compact",
            "continuation"
          ],
          "priority": "critical",
          "recommended": false,
          "cardSummary": "手动与自动压缩、长上下文、失败恢复和续传。",
          "badges": [
            "场景待完善",
            "回归待补",
            "真实验证待做"
          ]
        },
        {
          "id": "dependencies",
          "title": "依赖可复现验证",
          "status": "pending",
          "progress": "待完成 · editable 来源未固化",
          "implementation": "当前环境可运行，但依赖来自相邻SDK源码",
          "offline": "现有回归在当前Mac环境完成",
          "live": "新任务环境可安装性尚未证明",
          "summary": "固定 SDK 和适配层安装来源，完成干净环境关键回归；不能只凭版本号宣称可复现。",
          "goal": [
            "固定可安装SDK来源/版本或提交",
            "本地联调启动与任务非交互入口分别说明"
          ],
          "pending": [
            "消除对相邻 editable 目录的隐式依赖",
            "新环境安装、导入与关键契约验证"
          ],
          "verify": [
            "从固定依赖来源全新安装",
            "无需Mac本机目录即可运行关键回归"
          ],
          "acceptance": [
            "安装来源可审查、可重复",
            "不在源码或依赖文件保存AK"
          ],
          "risks": [
            "google-genai 2.31.0元数据不足以证明任务环境一致"
          ],
          "evidence": [
            "当前SDK为相邻python-genai-main editable导入，仍待固化"
          ],
          "tags": [
            "SDK",
            "reproducibility",
            "环境"
          ],
          "sourceIds": [
            "sdk-transport"
          ],
          "priority": "critical",
          "recommended": false,
          "cardSummary": "固定SDK安装来源，在干净环境复现关键回归。",
          "badges": [
            "当前editable",
            "来源待固化",
            "干净环境待验"
          ]
        }
      ]
    },
    {
      "id": "evals-integration",
      "code": "PHASE 03",
      "title": "合入 evals",
      "subtitle": "先在本地对齐框架调用，再形成可审查的 Git 改动；本阶段不发 Merlin 任务",
      "nodes": [
        {
          "id": "evals-contract",
          "title": "本地完成框架接入检查",
          "status": "active",
          "progress": "契约已调查 · 接入未实现",
          "implementation": "已确认协议边界，尚未完成正式注册/桥接",
          "offline": "参考父类和配置合并链只读核对完成",
          "live": "正式evals入口尚未本地验收",
          "summary": "对齐统一消息/ChatCompletionResponse与Messages转换模块；不能直接替换已有 GenAIProvider。",
          "goal": [
            "核对实际注册、输入输出及SDK调用位置",
            "配置/凭据由框架注入，签名优先ContextStore"
          ],
          "pending": [
            "完成可审查的桥接方案和本地接入",
            "验证请求确实经过新转换逻辑，不走旧路径"
          ],
          "verify": [
            "框架统一接口与转换层双向契约",
            "非交互合成ModelCard启动，无任务内getpass"
          ],
          "acceptance": [
            "兼容现有框架消费者",
            "保留框架已验证的传输与上下文能力"
          ],
          "risks": [
            "参考导出不是正式可推送checkout",
            "本地探针不是evals最终任务配置"
          ],
          "evidence": [
            "已确认现有Provider使用统一消息和ChatCompletionResponse",
            "4.13.2父类及配置链已查，但正式接入仍未实现",
            "STEP-051：ContextStore回调适配器与路由测试已备好，未正式接入框架",
            "只读核对远端master与参考导出版本一致；核心GenAIProvider/签名缓存契约已读"
          ],
          "tags": [
            "evals",
            "Provider",
            "ContextStore"
          ],
          "sourceIds": [],
          "priority": "critical",
          "recommended": false,
          "cardSummary": "对齐框架接口与配置注入，确认转换代码真正生效。",
          "badges": [
            "契约已查",
            "接入未实现",
            "本地验证待做"
          ]
        },
        {
          "id": "git-merge",
          "title": "整理并合入代码",
          "status": "pending",
          "progress": "待开始 · 本地完成后推进",
          "implementation": "当前适配项目无Git仓库，参考目录为导出",
          "offline": "尚无正式checkout上的目标回归结果",
          "live": "无本项目合仓提交或MR",
          "summary": "在正式 evals checkout 整理功能分支、测试与MR，记录准确commit、依赖、回退与限制；不推代码到公开看板仓库。",
          "goal": [
            "审查范围内的适配器/接入/测试/依赖改动",
            "MR、版本回退与Runbook"
          ],
          "pending": [
            "准备正式checkout、功能分支及可审查差异",
            "核对测试、安装和限制说明后提交MR"
          ],
          "verify": [
            "正式checkout目标检查通过",
            "MR显示实现及验证边界，无凭据或无关文件"
          ],
          "acceptance": [
            "记录实际合入commit和依赖版本",
            "交付说明可用于Merlin定位与回退"
          ],
          "risks": [
            "不将本地目录或参考ZIP当成可推送仓库"
          ],
          "evidence": [
            "交付顺序已确认：本地完成→Git合入evals→用户发Merlin任务"
          ],
          "tags": [
            "Git",
            "MR",
            "Runbook"
          ],
          "sourceIds": [
            "gray-release",
            "runbook"
          ],
          "priority": "critical",
          "recommended": false,
          "cardSummary": "正式checkout整理分支、测试与MR，记录可回退版本。",
          "badges": [
            "待本地完成",
            "无合仓提交",
            "MR待开始"
          ]
        }
      ]
    },
    {
      "id": "merlin-validation",
      "code": "PHASE 04",
      "title": "Merlin 任务验证",
      "subtitle": "代码合入后由用户发任务；按准确 commit、模型和配置验收，不提前索取任务 SID",
      "nodes": [
        {
          "id": "merlin-smoke",
          "title": "用户发起小样本任务",
          "status": "pending",
          "progress": "待前序完成 · 用户发起",
          "implementation": "依赖本地实现、验证与合仓完成",
          "offline": "未运行正式任务环境验证",
          "live": "本项目Merlin验收尚未启动",
          "summary": "先用小样本确认安装、路由和核心调用，再扩大测试；任务由用户发起，助手核对配置与结果。",
          "goal": [
            "固定合入commit、SDK来源、模型卡片",
            "确认实际调用经过适配器",
            "记录实际任务必要的延迟/资源/并发边界"
          ],
          "pending": [
            "前序完成后准备非敏感任务配置与smoke清单",
            "用户发任务后再记录链接/SID及真实结果"
          ],
          "verify": [
            "少量文本多轮/工具/多模态任务",
            "验证框架路由，不把模型HTTP成功等同适配验收"
          ],
          "acceptance": [
            "任务环境可复现且路由可证明",
            "资源限制与适配器错误分别归因"
          ],
          "risks": [
            "不提前扩大为生产网关压测或独立灰度平台"
          ],
          "evidence": [
            "当前无本项目Merlin验收任务；此事实不是本地开发前置条件"
          ],
          "tags": [
            "Merlin",
            "smoke",
            "路由"
          ],
          "sourceIds": [
            "staging",
            "load"
          ],
          "priority": "critical",
          "recommended": false,
          "cardSummary": "合仓后由用户发少量任务，先验证环境与调用路由。",
          "badges": [
            "前序完成后",
            "用户发起",
            "Merlin未启动"
          ]
        },
        {
          "id": "benchmark",
          "title": "结果验收与定向修复",
          "status": "pending",
          "progress": "待任务结果 · 准确率未验收",
          "implementation": "测试入口与数据范围需在发任务前确认",
          "offline": "现有探针护栏可复用，不等于benchmark通过",
          "live": "PayerBench/MM-ToolSandBox尚未运行",
          "summary": "少量benchmark验证文本多轮与多模态适配，检查答案质量、工具选择与协议错误；失败后定向修复回归。",
          "goal": [
            "核对用户指定PayerBench、MM-ToolSandBox实际入口",
            "按模型归档准确率、错误和未覆盖项"
          ],
          "pending": [
            "确认名称/collection/exercise及请求路由",
            "先少量短case，跑通后再扩大，不把候选当已定位"
          ],
          "verify": [
            "对照可用基线及失败轨迹",
            "区分协议丢失、模型能力、数据与资源问题"
          ],
          "acceptance": [
            "达到事先约定的可用门槛",
            "问题有归因和回归证据；不凭HTTP成功率验收"
          ],
          "risks": [
            "本地发现PaperBench候选不等于PayerBench已定位"
          ],
          "evidence": [
            "用户建议少量跑两个benchmark；当前未提交、未运行"
          ],
          "tags": [
            "benchmark",
            "accuracy",
            "MM-ToolSandBox"
          ],
          "sourceIds": [
            "accuracy"
          ],
          "priority": "critical",
          "recommended": false,
          "cardSummary": "少量benchmark检查答案质量，失败后定向修复。",
          "badges": [
            "入口待确认",
            "尚未运行",
            "准确率未验收"
          ]
        }
      ]
    }
  ],
  "history": [
    {
      "title": "gemini-4-argon · 历史真实验证",
      "scope": "旧模型记录，不计当前3.8或Merlin验收",
      "items": [
        "SDK单轮、真实CC单轮/多轮、单图VLM和Bash工具闭环有成功记录",
        "同名/不同名并行工具有历史成功；仅实际返回的签名被保留",
        "带/不带工具ID请求被接受的探测缺最终答案断言，不能升级为完整闭环验收",
        "原生流历史401 no model permission；不是整个Gemini系列不支持的证据"
      ]
    },
    {
      "title": "gemini-3.8-flash · 历史工具探针",
      "scope": "局部探针成功，不等于完整真实CC矩阵",
      "items": [
        "连续两轮工具，以及同名/不同名并行工具存在历史成功",
        "工具ID探测曾被接受，但缺完整最终答案断言；R5新断言尚无线上重跑",
        "单轮真实CC、完整VLM/压缩等当前目标验收仍待补",
        "路由可达记录只证明可达，不证明鉴权通过"
      ]
    },
    {
      "title": "本地修复与离线证据",
      "scope": "截至STEP-050的历史离线证据，不代表当前模型线上通过",
      "items": [
        "R1结束原因、R2复杂Schema、R4异常链脱敏、R5探针语义均有离线修复证据",
        "基线随改动递增：28→31→37→42→55→61→66→73项；不是本轮新跑",
        "STEP-045最终全量73 tests / 3.043s / OK；本次只更新网页，不重跑未改协议代码",
        "R3签名隔离未修复，依赖可复现与正式evals接入仍待完成"
      ]
    },
    {
      "title": "鉴权调查 · 保留失败与更正",
      "scope": "阻塞真实验证，根因未定",
      "items": [
        "复杂Schema首个union请求、最小文本、按ModelCard文本曾分别401；后续Schema案例没有因此执行",
        "一次UI输入启动失败是本地FAIL/未请求模型，与服务端401分开记录",
        "最近ModelCard实测为401/INCONCLUSIVE/exit2，未得到答案验收",
        "本地同CLI离线重建确认query ak、无Authorization；合成200不是线上鉴权PASS",
        "曾追踪参考框架配置链，但本地探针不经过该链；本项目尚未发Merlin验收任务"
      ]
    },
    {
      "title": "STEP-051 · R3第一步隔离",
      "scope": "新增本地实现/离线证据，R3整体未完成",
      "items": [
        "会话/实例/实际模型/入口路由隔离；普通与流式跨轮恢复已离线验证",
        "新增21项路由+12项存储/回调，全量106 tests / 3.170s / OK",
        "旧跨会话串用及重复query路由问题均先红测后修复，后者独立复核通过",
        "ContextStore回调适配器可注入；正式框架接线、真实CC会话来源未验",
        "TTL、重启、同会话ID重用、压缩匹配及思考请求块仍待补；没有新模型请求"
      ]
    },
    {
      "title": "STEP-053/054 · B/C并行交付与主窗口验收",
      "scope": "本轮离线实现/测试通过，不代表当前模型或Merlin验收",
      "items": [
        "B：签名TTL/本地清理/共享逻辑过期，新增17项，存储专项29项通过",
        "C：显式buffered/native，无隐式降级，新增10项，传输专项22项通过",
        "主窗口：ModelCard三种调用路径、本地模式选择和7项组合测试；两边冻结后全量140 tests / 3.892s / OK",
        "保持原有历史证据；没有新模型请求、AK输入、正式evals合仓或Merlin任务",
        "尚缺R3历史/压缩回填、正式存储接线、原生流结束语义及当前模型真实验收"
      ]
    }
  ],
  "legacyPhases": [
    {
      "id": "foundation",
      "number": "PHASE 01",
      "title": "基础链路",
      "subtitle": "先证明协议转换和真实 CC 入口可用",
      "nodes": [
        {
          "id": "sdk-transport",
          "title": "Google GenAI SDK 接入",
          "priority": "critical",
          "done": true,
          "summary": "使用 google-genai SDK 连接 ModelHub 原生 generateContent，不手写上游 HTTP JSON。",
          "goal": [
            "拆分 ModelHub endpoint 与模型名",
            "AK 仅运行时输入，不落盘",
            "适配公司证书与网络环境"
          ],
          "verify": [
            "SDK 真实单轮请求返回",
            "确认请求目标为 gemini-4-argon",
            "SDK 版本固定并可复现"
          ],
          "acceptance": [
            "不直接拼装 GenAI HTTP body",
            "真实请求成功且 usage 可读取"
          ],
          "risks": [
            "证书链、飞连节点和 endpoint 变化",
            "AK 泄露到日志或配置"
          ],
          "evidence": [
            "google-genai 2.31.0 已以 editable 方式安装",
            "真实 SDK 请求返回成功"
          ],
          "tags": [
            "SDK",
            "ModelHub",
            "认证"
          ]
        },
        {
          "id": "messages-service",
          "title": "真实 /v1/messages 服务",
          "priority": "critical",
          "done": true,
          "summary": "提供 Claude Code 可直接访问的 Anthropic Messages 兼容 HTTP 服务。",
          "goal": [
            "FastAPI 暴露 POST /v1/messages",
            "支持 JSON 与 SSE 响应",
            "统一 Anthropic error shape"
          ],
          "verify": [
            "GET /healthz=200",
            "真实 Claude Code 访问本地 endpoint",
            "服务日志出现 POST /v1/messages 200"
          ],
          "acceptance": [
            "无需模拟 CC 请求",
            "Claude Code 可完成一次真实调用"
          ],
          "risks": [
            "Claude Code 附加 beta query/header",
            "用户级 settings 覆盖本地 base URL"
          ],
          "evidence": [
            "服务监听 127.0.0.1:18081",
            "真实 CC 请求 200 OK"
          ],
          "tags": [
            "FastAPI",
            "Messages",
            "SSE"
          ]
        },
        {
          "id": "request-conversion",
          "title": "Messages → GenAI 基础转换",
          "priority": "critical",
          "done": true,
          "summary": "转换 system、user/assistant 角色、文本、多轮内容和图片输入。",
          "goal": [
            "assistant 映射为 model",
            "system 映射为 system_instruction",
            "max_tokens 等字段映射到 GenerateContentConfig"
          ],
          "verify": [
            "单轮、多轮、base64 图片、URL 图片单测",
            "不支持的 block 明确报错而非静默丢弃"
          ],
          "acceptance": [
            "顺序与角色不变",
            "已支持字段值保持准确"
          ],
          "risks": [
            "Claude 新增 content block 类型",
            "隐式丢字段造成准确率问题"
          ],
          "evidence": [
            "请求转换单元测试已通过"
          ],
          "tags": [
            "转换",
            "角色",
            "system"
          ]
        },
        {
          "id": "response-conversion",
          "title": "GenAI → Messages 基础转换",
          "priority": "critical",
          "done": true,
          "summary": "将候选文本、finish reason 和 token usage 转成 Messages 响应。",
          "goal": [
            "提取文本 content",
            "映射 stop_reason",
            "生成 Messages id/model/usage"
          ],
          "verify": [
            "正常文本、max_tokens、缺失 candidates 单测",
            "真实 CC 能解析 JSON/SSE"
          ],
          "acceptance": [
            "回答内容完整",
            "stop_reason 与 usage 不伪造、不丢失"
          ],
          "risks": [
            "GenAI finish reason 新枚举",
            "多 candidate 行为未定义"
          ],
          "evidence": [
            "响应转换及 SSE 事件序列测试已通过",
            "2026-10-22：修复真实 SDK FinishReason 枚举误映射；全量离线回归 31 tests / OK"
          ],
          "tags": [
            "转换",
            "usage",
            "stop_reason"
          ]
        },
        {
          "id": "real-single",
          "title": "真实 CC 单轮文本",
          "priority": "critical",
          "done": true,
          "summary": "历史验收：gemini-4-argon 时期，真实 Claude Code 完成端到端文本调用；当前模型仍需分别验收。",
          "goal": [
            "排除 curl/自制客户端模拟",
            "验证 CC 原生 stream 请求",
            "确认本地 settings 覆盖生效"
          ],
          "verify": [
            "CC 输出指定文本",
            "调试日志记录 /v1/messages",
            "服务端返回 200"
          ],
          "acceptance": [
            "退出码 0",
            "stop_reason=end_turn",
            "请求和响应均来自真实链路"
          ],
          "risks": [
            "全局 Ark 配置抢占 ANTHROPIC_BASE_URL"
          ],
          "evidence": [
            "输出：真实 Claude Code 链路成功",
            "input 225 / output 10 tokens"
          ],
          "tags": [
            "Claude Code",
            "E2E"
          ]
        },
        {
          "id": "real-multiturn",
          "title": "真实 CC 多轮文本",
          "priority": "critical",
          "done": true,
          "summary": "历史验收：gemini-4-argon 时期用 --resume 恢复同一 CC session，验证历史由 CC 真实携带；不代表 Gemini 系列均已通过。",
          "goal": [
            "第一轮写入唯一标记",
            "第二轮不重复标记",
            "第二轮依靠历史准确回答"
          ],
          "verify": [
            "同一 session_id",
            "两次 /v1/messages 200",
            "session 文件角色顺序正确"
          ],
          "acceptance": [
            "user→assistant→user→assistant 完整",
            "第二轮正确返回 CC-MULTI-6F3A91"
          ],
          "risks": [
            "把两个独立单轮误判成多轮"
          ],
          "evidence": [
            "真实 session 四条消息已核验",
            "第二轮 input tokens 增长"
          ],
          "tags": [
            "多轮",
            "resume",
            "history"
          ]
        },
        {
          "id": "real-vlm",
          "title": "真实 CC 单图 VLM",
          "priority": "critical",
          "done": true,
          "summary": "历史验收：gemini-4-argon 时期在 Trae 终端粘贴 PNG，确认 CC 发送真实图片并正确识图；其他模型分别验收。",
          "goal": [
            "图片与文本同时进入 Messages",
            "base64 图片映射为 GenAI inline_data",
            "答案返回 CC"
          ],
          "verify": [
            "session 中存在 image block",
            "media_type=image/png",
            "模型正确数出 3 条日志"
          ],
          "acceptance": [
            "不是路径替代或 OCR 预填",
            "真实图片数据进入请求且回答正确"
          ],
          "risks": [
            "大图尺寸限制",
            "多图顺序和不同 MIME 未验证"
          ],
          "evidence": [
            "base64 data_length=89656",
            "模型回答：3"
          ],
          "tags": [
            "VLM",
            "image/png",
            "base64"
          ]
        }
      ]
    },
    {
      "id": "protocol",
      "number": "PHASE 02",
      "title": "协议兼容与核心能力",
      "subtitle": "本地明确走query AK；正式任务快照尚缺，不能与本地探针混同；401根因未定、不再索取AK",
      "nodes": [
        {
          "id": "endpoint-contract",
          "title": "端点协议探测（历史记录）",
          "priority": "critical",
          "done": true,
          "summary": "保留 Argon 与 3.8-flash 的历史探测记录。R5 最终回答断言已离线补强，但没有重跑线上探针；完成标记不代表当前模型或全系列完整验收。以下旧版本证据不自动迁移。",
          "goal": [
            "分别验证 functionCall/functionResponse 带 id 与不带 id",
            "验证不同名与同名并行工具调用",
            "验证顺序多步工具及多个 functionResponse 的 turn 分组",
            "把端点差异固化为显式兼容配置"
          ],
          "verify": [
            "每个场景都走真实 ModelHub，而非本地 mock",
            "保留脱敏后的请求形态、HTTP 状态和响应结论",
            "结果与现有文档中的旧端点差异对照"
          ],
          "acceptance": [
            "按具体模型、配置版本记录 id 接受规则",
            "并行同名调用结果不会错配且断言最终回答",
            "历史请求接受与完整语义验收分开记录"
          ],
          "risks": [
            "旧端点规则不能泛化到整个 Gemini 系列",
            "资源限流不等于协议不支持",
            "R5 新断言已离线通过，但尚无目标模型的线上新验收"
          ],
          "evidence": [
            "2026-10-21：真实 seed 请求成功，Argon 返回 functionCall.id 与 thoughtSignature",
            "首次回放遇到 HTTP 429；有限退避重试后恢复，不将资源错误误判成协议错误",
            "真实 with_id 回放：PASS",
            "真实 without_id 回放：PASS",
            "不同名并行工具：PASS；一次返回 lookup_alpha 与 lookup_beta，两个调用 ID 唯一",
            "同名并行工具：PASS；两次 lookup_item 仍保持两个唯一调用 ID，结果未错配",
            "两种并行场景都把两个 functionResponse 放在同一个 GenAI user turn 后成功闭环",
            "实测两个 functionCall Part 中只有一个携带 thoughtSignature；实现必须按实际存在情况保存，不能假设每个调用都有签名",
            "新增 3 个并行回归用例；当前 26 个单元测试全部通过",
            "连续两轮工具真实探针已就绪：强制 step_one→回传→step_two→回传→最终回答，并核验跨轮 ID 与 signature",
            "探针语法检查及 26 个回归测试通过；当前等待在 Trae 可见终端执行真实请求"
          ],
          "tags": [
            "Argon",
            "id",
            "parallel tools",
            "thoughtSignature"
          ]
        },
        {
          "id": "native-stream",
          "title": "原生增量流式（历史阻塞）",
          "priority": "critical",
          "blocked": true,
          "summary": "阻塞证据仅来自 4-argon 历史权限错误；3.8-flash 原生流尚未核验。按卡片分别验证并显式选择 native 或 buffered_sse，不能把旧阻塞泛化到 Gemini 系列。",
          "goal": [
            "按模型配置声明 native/buffered 模式",
            "buffered 模式直接使用 generateContent，避免无说明自动降级",
            "具备权限和资源后验证对应卡片的原生增量"
          ],
          "verify": [
            "历史 4-argon 权限错误与其他模型待验收分别记录",
            "合法 Messages SSE 事件可被 CC 消费",
            "输出显式模式与实际传输行为一致"
          ],
          "acceptance": [
            "缓冲 SSE 不描述为原生流式",
            "每张卡片能力单独确认，未测不宣称不支持",
            "资源、权限阻塞与适配器实现待办分开记录"
          ],
          "risks": [
            "首 token 必须等待上游完整响应",
            "长回答的用户可见延迟较高",
            "上游接口开放时间不由本项目控制"
          ],
          "evidence": [
            "2026-10-21：SDK 调用 streamGenerateContent 返回 401 no model permission: gemini-4-argon",
            "设计文档的 generate_content_stream 也标记为 Phase 2 未实现",
            "当前可用方案：generateContent 完成后转换为 Anthropic SSE"
          ],
          "tags": [
            "external-blocked",
            "streamGenerateContent",
            "buffered_sse"
          ]
        },
        {
          "id": "tool-definitions",
          "title": "R2前置 · 本地鉴权已确认，任务配置待核对",
          "priority": "critical",
          "inProgress": true,
          "recommended": true,
          "summary": "STEP-048：已沿同一CLI入口用合成凭据和MockTransport核对，当前本地明确为URL查询ak、无Authorization；不是evals合并后选出的分支。正式框架基础配置/额外覆盖链已追踪，未见自动开启鉴权开关。按项目记录尚无本项目Merlin验收任务或最终配置快照，不能替任务下结论。最近真实结果仍401；本步不联网请求模型、不索取AK、不修改鉴权代码，R2线上待定。",
          "goal": [
            "JSON Schema 字段转换",
            "tool_choice auto/any/指定工具映射",
            "保留工具名称与描述"
          ],
          "verify": [
            "单工具、多工具、嵌套 schema",
            "不支持的 schema 关键字明确处理"
          ],
          "acceptance": [
            "模型可看到并选择正确工具",
            "schema 不被静默破坏"
          ],
          "risks": [
            "两种协议 JSON Schema 支持范围不同"
          ],
          "evidence": [
            "2026-10-22：已移除缩窄联合/静默删字段的清洗逻辑；复杂 Schema 走 parameters_json_schema",
            "真实 SDK + MockTransport 验证同步/流式最终 HTTP 请求，保留引用、约束、false、null 与混合枚举",
            "非字符串/空枚举避免 SDK 普通 Schema 的重新解释；非法 JSON 明确报错并隔离输入可变值",
            "2026-10-23 STEP-040：R2 专项 6 tests / OK；额外 10 组 Schema × 同步/流式共 20 次最终请求断言 PASS，3 类非法 JSON 拒绝",
            "覆盖递归引用、组合/条件、数值/字符串/数组约束、false/null/枚举、属性名及基础数组/null；未修改协议源码，也未请求模型",
            "当前 editable SDK 下的离线保真已复验；目标卡片及其他 Gemini 卡片在线接受情况待验证，节点不标完成"
          ],
          "tags": [
            "tools",
            "schema",
            "function calling"
          ]
        },
        {
          "id": "tool-use-response",
          "title": "functionCall → tool_use",
          "priority": "critical",
          "summary": "将 GenAI functionCall 响应转换为 Messages tool_use，并映射 stop_reason=tool_use。",
          "goal": [
            "生成稳定 tool_use id",
            "参数保持 JSON 对象",
            "SSE 支持 input_json_delta"
          ],
          "verify": [
            "真实 CC 收到工具调用",
            "CC 能识别工具名和参数",
            "非流式与流式一致"
          ],
          "acceptance": [
            "CC 实际执行预期工具",
            "参数无截断或二次字符串化"
          ],
          "risks": [
            "流式 JSON 参数拼接",
            "并行工具调用顺序"
          ],
          "evidence": [
            "真实 Claude Code 已成功收到 Bash tool_use 并执行",
            "真实 ModelHub 已验证不同名与同名并行 functionCall；同名调用仍返回唯一 ID",
            "并行返回中只有实际携带的 thoughtSignature 会进入缓存"
          ],
          "tags": [
            "tool_use",
            "functionCall",
            "stop_reason"
          ]
        },
        {
          "id": "tool-result-loop",
          "title": "tool_result 多轮闭环",
          "priority": "critical",
          "summary": "把 CC 执行结果转换为 GenAI functionResponse，再让模型生成最终回答。",
          "goal": [
            "tool_use_id 与 function name 对应",
            "文本/错误/图片结果处理",
            "支持连续和并行工具调用"
          ],
          "verify": [
            "真实 CC 文件读取闭环",
            "工具失败后模型可恢复",
            "第二次模型请求包含正确历史"
          ],
          "acceptance": [
            "调用→执行→回传→最终答案完整",
            "无死循环和 ID 错配"
          ],
          "risks": [
            "CC 自带工具数量多",
            "tool_result 内容类型复杂"
          ],
          "evidence": [
            "真实 Bash 工具调用→执行→回传→最终回答已成功",
            "不同名和同名并行工具均已完成双结果回传与最终回答闭环",
            "当前还需验证连续两轮工具调用、失败恢复与压缩场景"
          ],
          "tags": [
            "tool_result",
            "loop",
            "Claude Code"
          ]
        },
        {
          "id": "builtin-tools",
          "title": "Google 内置工具策略",
          "priority": "normal",
          "summary": "明确 google_search 等内置工具如何与 CC 客户端工具共存、返回和展示。",
          "goal": [
            "区分 server tool 与 client tool",
            "定义 grounding/citation 转换",
            "避免同名工具冲突"
          ],
          "verify": [
            "开启/关闭 google_search 对照",
            "有无 grounding metadata",
            "CC 最终文本与引用可用"
          ],
          "acceptance": [
            "行为可配置",
            "不会把内置工具误当成 CC 待执行工具"
          ],
          "risks": [
            "ModelCard 默认 builtin_tools 改变行为"
          ],
          "tags": [
            "google_search",
            "server tools"
          ]
        },
        {
          "id": "thinking",
          "title": "R3 后续 · 会话/模型签名隔离",
          "priority": "critical",
          "summary": "处理 GenAI thought、thought_signature 与 Messages thinking/redacted_thinking 的对应及保留策略。",
          "goal": [
            "确认 includeThoughts=false 时实际响应",
            "签名跨轮保留",
            "CC 压缩后签名回填策略"
          ],
          "verify": [
            "普通 reasoning 多轮",
            "工具调用夹杂 thinking",
            "签名缺失/过期/重复"
          ],
          "acceptance": [
            "不泄露隐藏思维",
            "需要的签名不丢失",
            "跨轮请求不被上游拒绝"
          ],
          "risks": [
            "这是准确率和稳定性高风险区域"
          ],
          "evidence": [
            "基础 thoughtSignature 缓存与回传已通过单测和真实工具闭环",
            "当前缓存仍是进程内全局字典，尚未达到生产要求"
          ],
          "tags": [
            "reasoning",
            "signature",
            "thinking"
          ]
        },
        {
          "id": "vlm-advanced",
          "title": "VLM 多图与多轮",
          "priority": "normal",
          "summary": "扩展单图成功结果，验证多图顺序、图片后追问和混合工具场景。",
          "goal": [
            "多图+多文本顺序",
            "VLM 会话 resume",
            "PNG/JPEG/WebP 与尺寸边界"
          ],
          "verify": [
            "两图对比问题",
            "第二轮引用上一轮图片",
            "超大图片错误映射"
          ],
          "acceptance": [
            "顺序准确",
            "不重复上传或丢图",
            "失败信息可定位"
          ],
          "risks": [
            "上下文体积快速增长"
          ],
          "tags": [
            "VLM",
            "multi-image",
            "multi-turn"
          ]
        },
        {
          "id": "response-semantics",
          "title": "R1 / R4 · 响应与异常链（离线通过）",
          "priority": "critical",
          "inProgress": true,
          "summary": "R1 结束原因及 R4 异常链脱敏已离线修复，全量 42 项通过。HTTP 状态码和固定诊断类别保留，原始异常、响应正文与 URL 不外传；其余响应语义仍待验收。",
          "goal": [
            "end_turn/max_tokens/tool_use/stop_sequence",
            "input/output/cache token 策略",
            "4xx/5xx/error event 映射"
          ],
          "verify": [
            "每个 stop reason 契约测试",
            "超时、过载、资源耗尽",
            "客户端显示可理解"
          ],
          "acceptance": [
            "不把错误伪装成正常回答",
            "usage 字段稳定且有来源"
          ],
          "risks": [
            "上游错误文案不稳定",
            "重试造成重复请求"
          ],
          "evidence": [
            "真实 SDK 非流式/流式 MAX_TOKENS 均映射为 max_tokens；STOP 保持 end_turn",
            "2026-10-23：R4 覆盖 APIError、HTTPError、缺失 message、SDK 异常响应、流中断及 fallback 失败",
            "标准 traceback 与异常日志不含合成敏感标记，安全异常无原始 cause/context；全量 42 tests / OK",
            "边界：不覆盖主动抓取 frame locals 或独立 HTTP 调试日志；未新增模型调用"
          ],
          "tags": [
            "errors",
            "usage",
            "finishReason"
          ]
        }
      ]
    },
    {
      "id": "stability",
      "number": "PHASE 03",
      "title": "稳定性与边界",
      "subtitle": "针对长上下文、压缩、恢复和故障建立可信验证",
      "nodes": [
        {
          "id": "forced-compact",
          "title": "CC 强制 /compact",
          "priority": "critical",
          "summary": "短会话中手动触发 CC 压缩，先观察压缩请求和摘要如何通过适配层。",
          "goal": [
            "压缩前埋唯一标记",
            "执行 /compact",
            "压缩后追问并检查请求 block"
          ],
          "verify": [
            "日志出现真实 compaction",
            "摘要进入后续请求",
            "标记和关键约束可恢复"
          ],
          "acceptance": [
            "压缩成功且会话继续",
            "adapter 不因新 block 类型报错"
          ],
          "risks": [
            "手动压缩不等同自动阈值触发"
          ],
          "tags": [
            "/compact",
            "summary",
            "context"
          ]
        },
        {
          "id": "auto-compact",
          "title": "CC 自动压缩",
          "priority": "critical",
          "summary": "逐步增加真实上下文，直到 autocompact 从 level=ok 进入执行状态。",
          "goal": [
            "构造可核验长上下文",
            "记录触发点与 effectiveWindow",
            "压缩前后信息抽样核对"
          ],
          "verify": [
            "至少一次自动触发",
            "多次 resume 稳定",
            "关键系统约束不丢"
          ],
          "acceptance": [
            "无 400/死循环/上下文爆炸",
            "压缩后回答准确率可接受"
          ],
          "risks": [
            "耗时和 token 成本高",
            "阈值可能随 CC 版本变化"
          ],
          "tags": [
            "autocompact",
            "180K",
            "long context"
          ]
        },
        {
          "id": "continuation",
          "title": "长输出 continuation_token",
          "priority": "critical",
          "summary": "独立验证 Gemini 4 Argon 长解码的 continuation token；它与 CC 上下文压缩不是同一机制。",
          "goal": [
            "超过 32K 输出观察 token",
            "模拟流中断",
            "从最近有效 checkpoint 恢复"
          ],
          "verify": [
            "不中断基线",
            "中途断连恢复",
            "非最后 token 恢复"
          ],
          "acceptance": [
            "恢复后内容连续且不重复",
            "token 生命周期和选择策略明确"
          ],
          "risks": [
            "超长测试昂贵",
            "SDK 自动续传行为需与服务重连协同"
          ],
          "tags": [
            "continuation_token",
            "long output",
            "recovery"
          ]
        },
        {
          "id": "retry-timeout",
          "title": "超时、重试与幂等",
          "priority": "critical",
          "summary": "针对 overloaded、internal error、resource exhausted 等配置化重试，并避免重复副作用。",
          "goal": [
            "连接/首 token/总时长分层超时",
            "指数退避与次数上限",
            "工具场景禁止盲重试"
          ],
          "verify": [
            "故障注入",
            "可重试关键词命中",
            "重试耗尽后的标准错误"
          ],
          "acceptance": [
            "无无限等待",
            "无工具重复执行",
            "日志可解释每次重试"
          ],
          "risks": [
            "生成请求不天然幂等"
          ],
          "tags": [
            "retry",
            "timeout",
            "idempotency"
          ]
        },
        {
          "id": "compat-probes",
          "title": "CC 辅助接口与版本兼容",
          "priority": "normal",
          "inProgress": true,
          "summary": "处理或明确 HEAD、count_tokens、模型探测及 beta header 等 CC 行为。",
          "goal": [
            "记录 CC 实际请求面",
            "判断 404 是否无害",
            "必要时补 count_tokens"
          ],
          "verify": [
            "启动、单轮、交互、工具四类流程抓取",
            "不同 CC 版本 smoke"
          ],
          "acceptance": [
            "无误导性模型不存在提示",
            "升级前有兼容检查"
          ],
          "risks": [
            "CC 客户端行为随版本变化"
          ],
          "tags": [
            "count_tokens",
            "beta",
            "compatibility"
          ]
        },
        {
          "id": "regression",
          "title": "R5 · 探针验收（离线通过）",
          "priority": "critical",
          "inProgress": true,
          "summary": "共享协议回归加按模型配置矩阵，分别记录 Gemini 卡片的离线结果与真实 smoke；3.8 的 PASS 不自动代表其他模型。",
          "goal": [
            "共享转换纯函数与 HTTP/SSE 契约测试",
            "至少两套合成模型配置覆盖默认值/覆盖规则与最终 SDK 参数",
            "按具体模型、配置版本、SDK 来源记录真实 CC smoke"
          ],
          "verify": [
            "字段保真与模型配置差异分别断言",
            "thinking/token/工具等设置不串用或静默丢失",
            "限流与权限受限保留待验收，测试不包含真实 AK"
          ],
          "acceptance": [
            "已支持卡片通过对应核心矩阵",
            "未测卡片不标 PASS，记录能力边界与待验收项"
          ],
          "risks": [
            "只测 happy path",
            "真实服务测试不稳定"
          ],
          "evidence": [
            "2026-10-23：R5 最终回答断言、seed/名称参数配对、Python 入口及 shell 聚合已离线通过",
            "PASS=0 / FAIL=1 / INCONCLUSIVE=2；FAIL 优先，空 case 不得成功，重复场景去重避免覆盖",
            "全量 55 tests / OK；没有重跑线上探针，当前模型与 Merlin 验收仍独立待办"
          ],
          "tags": [
            "tests",
            "contract",
            "smoke"
          ]
        },
        {
          "id": "observability",
          "title": "日志、指标与安全",
          "priority": "critical",
          "summary": "记录足够的链路信息用于 oncall，同时对 AK、图片和完整 prompt 做脱敏。",
          "goal": [
            "request id 和阶段耗时",
            "状态码/重试/stop reason 指标",
            "内容类型与数量而非敏感正文"
          ],
          "verify": [
            "成功与失败链路均可追踪",
            "日志扫描无 AK/base64",
            "并发请求可区分"
          ],
          "acceptance": [
            "问题能在日志中定位阶段",
            "敏感数据不落盘"
          ],
          "risks": [
            "为了排障过度记录用户内容"
          ],
          "evidence": [
            "2026-10-23：R4 标准异常链/日志脱敏离线通过；整体链路指标和日志安全验收仍待完成"
          ],
          "tags": [
            "logging",
            "metrics",
            "redaction"
          ]
        }
      ]
    },
    {
      "id": "delivery",
      "number": "PHASE 04",
      "title": "evals 合入与 Merlin 验证",
      "subtitle": "本地验证后通过 Git 合入 evals，再由用户按目标模型配置发任务验收",
      "nodes": [
        {
          "id": "configuration",
          "title": "Gemini 系列 ModelCard 配置兼容",
          "priority": "critical",
          "inProgress": true,
          "summary": "本地新增ModelCardProfile内存注入入口与无AK示例卡；已验证3.8卡片最终参数、两模型配置隔离和运行时覆盖。未知字段/未实现签名裁剪明确拒绝，extension和重试关键词仅作元数据。正式evals/Merlin仍需框架父类/注册接入，不在任务中getpass；73项离线通过不是系列在线验收。",
          "goal": [
            "对齐 evals ModelCard 与运行时参数优先级",
            "按卡片读取模型、端点、token/采样默认值、thinking、内置工具与函数调用设置",
            "流式、工具 ID 与签名策略按已验证能力配置，不凭型号猜测",
            "新模型通过配置与回归接入，凭据只在运行时提供"
          ],
          "verify": [
            "至少两套合成模型配置：相同 Messages 输入共用转换逻辑，最终 SDK 参数按卡片变化",
            "静态默认值/运行时覆盖与 false/0/缺省值边界",
            "不支持或冲突设置明确报错，配置及凭据来源可追溯",
            "在线结果绑定具体模型/配置/SDK；资源限制保留待验收"
          ],
          "acceptance": [
            "切换已支持模型无需修改公共转换函数",
            "模型设置不串用、不静默丢失，签名会话与模型隔离",
            "3.8 与 Gemini 4 分别记录覆盖范围，未验证项不标 PASS",
            "新环境可复现安装与启动，AK 不写入文件"
          ],
          "risks": [
            "仅替换 URL 不能保证 thinking/token/工具等设置生效",
            "资源限流不等于能力不支持",
            "历史成功或一个模型 PASS 不代表全系列验收"
          ],
          "evidence": [
            "2026-10-22：用户确认上线兼容目标为 Gemini 系列，3.8-flash 是当前开发验证模型",
            "2026-10-23 STEP-045：本地ModelCardProfile加载默认参数，核心支持内存AK，CLI禁止含AK文件；旧控制探针/服务仍使用target.py",
            "新增7项回归：两模型配置隔离、覆盖、未知设置拒绝、实际SDK普通/流式最终请求，当前全量73项通过",
            "修正当前editable SDK thinking内层别名与流式ak/alt查询兼容；未确认旧非流式401根因，SDK来源仍须固化",
            "正式evals父类/注册及R3待核对，不能将本地映射称为全系列在线通过",
            "历史旁路直连试验仅作参考，不改变主线转换任务",
            "本机全局Claude Code settings保持现状，凭据仅运行时提供"
          ],
          "tags": [
            "ModelCard",
            "config",
            "secrets",
            "Claude Code settings"
          ]
        },
        {
          "id": "staging",
          "title": "Merlin 任务验收",
          "priority": "critical",
          "summary": "evals 合入后由用户在 Merlin 发起任务，按具体模型与配置核对实际运行结果。",
          "goal": [
            "固定代码 commit、SDK 来源与 ModelCard",
            "覆盖文本/多轮/VLM/工具/流式相关任务",
            "按模型归档结果与未覆盖项"
          ],
          "verify": [
            "用户发起 smoke/正式任务",
            "记录任务链接、commit、模型配置与结果",
            "失败分类与定向回归，资源阻塞单列"
          ],
          "acceptance": [
            "目标任务环境可复现",
            "已支持卡片的相关任务达到约定可用门槛"
          ],
          "risks": [
            "本地 PASS 不替代 Merlin 验收",
            "Mac editable 目录不代表任务环境可安装"
          ],
          "tags": [
            "Merlin",
            "evals",
            "E2E",
            "acceptance"
          ]
        },
        {
          "id": "accuracy",
          "title": "真实任务与准确率验证",
          "priority": "critical",
          "summary": "使用真实 Claude Code 工作负载验证不只是能回答，还要保证工具选择、上下文和结果质量。",
          "goal": [
            "代码理解/修改/测试任务",
            "多轮与压缩任务",
            "失败案例人工归因"
          ],
          "verify": [
            "与直接基线对照",
            "协议丢失导致的质量问题单列",
            "重复运行观察稳定性"
          ],
          "acceptance": [
            "达到约定可用门槛",
            "无系统性字段丢失"
          ],
          "risks": [
            "只看 HTTP 成功率会掩盖准确率问题"
          ],
          "evidence": [
            "用户建议 PayerBench、MM-ToolSandBox 少量验证文本多轮与多模态；先各1个短case检查路由，跑通后再扩到3–5例",
            "本地发现PaperBench Detail候选，是否对应PayerBench待确认；MM-ToolSandBox入口未定位。需确认collection/exercise且模型请求实际经过适配器，尚未提交或运行Merlin任务"
          ],
          "tags": [
            "accuracy",
            "real tasks",
            "evaluation"
          ]
        },
        {
          "id": "load",
          "title": "性能与容量",
          "priority": "normal",
          "summary": "按 evals 实际运行需要记录目标模型的延迟、并发与错误率，区分适配器开销和上游资源限制。",
          "goal": [
            "单请求基线",
            "并发梯度",
            "长流式连接与资源回收"
          ],
          "verify": [
            "P50/P95 延迟",
            "不同并发错误率",
            "连接中断无泄漏"
          ],
          "acceptance": [
            "容量边界明确",
            "超限时可快速失败或排队"
          ],
          "risks": [
            "上游限流与本地瓶颈混淆"
          ],
          "tags": [
            "performance",
            "concurrency",
            "TTFT"
          ]
        },
        {
          "id": "gray-release",
          "title": "Git 合入与版本回退",
          "priority": "critical",
          "summary": "把可审查改动合入正式 evals 仓库，记录准确版本，再由用户发起 Merlin 验证。",
          "goal": [
            "核对实际注册与调用契约",
            "功能分支/MR 与依赖可复现",
            "记录 commit 与可回退版本"
          ],
          "verify": [
            "正式 checkout 的目标检查通过",
            "MR 展示核心改动与验证范围",
            "任务配置使用准确 commit"
          ],
          "acceptance": [
            "转换模块与 evals 契约对齐",
            "异常能定位并回退代码/配置版本"
          ],
          "risks": [
            "参考导出目录不是可推送 checkout",
            "已有 GenAIProvider 不能直接被 Messages 转换器替换"
          ],
          "tags": [
            "Git",
            "evals",
            "MR",
            "rollback"
          ]
        },
        {
          "id": "runbook",
          "title": "Runbook 与已知限制",
          "priority": "normal",
          "summary": "沉淀启动、验证、故障定位、常见错误、升级检查和当前不支持项。",
          "goal": [
            "值班排查步骤",
            "错误码/日志关键词",
            "CC/SDK 升级回归清单"
          ],
          "verify": [
            "由非开发者按文档完成一次排障",
            "每个已知限制有影响和兜底"
          ],
          "acceptance": [
            "oncall 不依赖口头知识",
            "文档与当前版本一致"
          ],
          "risks": [
            "代码变化后文档失效"
          ],
          "tags": [
            "runbook",
            "oncall",
            "docs"
          ]
        }
      ]
    }
  ],
  "migration": {
    "request-conversion": "text-conversion",
    "response-conversion": "text-conversion",
    "endpoint-contract": "tools",
    "tool-definitions": "tools",
    "tool-use-response": "tools",
    "tool-result-loop": "tools",
    "builtin-tools": "tools",
    "thinking": "signature",
    "real-vlm": "multimodal",
    "vlm-advanced": "multimodal",
    "native-stream": "streaming",
    "configuration": "modelcard",
    "response-semantics": "errors",
    "retry-timeout": "errors",
    "observability": "errors",
    "compat-probes": "errors",
    "regression": "offline-regression",
    "messages-service": "real-cc",
    "real-single": "real-cc",
    "real-multiturn": "real-cc",
    "forced-compact": "complex-context",
    "auto-compact": "complex-context",
    "continuation": "complex-context",
    "sdk-transport": "dependencies",
    "gray-release": "git-merge",
    "runbook": "git-merge",
    "staging": "merlin-smoke",
    "load": "merlin-smoke",
    "accuracy": "benchmark"
  },
  "scopeNote": "已完成只针对节点写明的范围。实现、离线、当前模型真实验证分别展示；历史快照文字按当时语境理解，不作当前结论。"
};
const phases = mission.phases;
const STORAGE_KEY = "cc-genai-personal-marks-v3";
const marks = loadMarks();
const labels = {done:"节点范围已完成",active:"部分完成 / 进行中",pending:"待处理",blocked:"验证阻塞",uncertain:"待确认",unsupported:"不支持（待证据）"};
let selectedId = null;
let activeFilter = "all";
const roadmap = document.querySelector("#roadmap");
const detailPanel = document.querySelector("#detailPanel");
const searchInput = document.querySelector("#searchInput");
const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function loadMarks() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  } catch { return {}; }
}
function persistMarks() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(marks)); return true; }
  catch { return false; }
}
function allNodes() { return phases.flatMap((p, pi) => p.nodes.map((n, ni) => ({...n, phase:p.title, number:String(pi+1).padStart(2,"0")+"."+String(ni+1).padStart(2,"0")}))); }
function nodeNumber(id) { return allNodes().find(n=>n.id===id)?.number || ""; }
function workItemsSection(node) {
  if (!node.workItems?.length) return '<section class="detail-section"><h4>执行子任务</h4><p>本轮未登记执行子项。不代表已有实现为空；后续派工须先在此节点登记子项、负责人和验收条件。</p></section>';
  return '<section class="detail-section work-items"><h4>执行子任务 · 状态只代表本地验收</h4>'+node.workItems.map((item,i)=>
    '<details class="work-item '+(item.status==="done"?"accepted":"")+'"><summary><span class="work-item-number">'+esc(node.number+"."+String(i+1).padStart(2,"0"))+'</span><strong>'+esc(item.title)+'</strong><span class="work-item-meta"><span>'+esc(item.owner)+'</span><span class="work-state">'+(item.status==="done"?"✓ 本地验收通过":item.status==="active"?"进行中 · 待验收":item.owner!=="待分派"?"待前序完成":"待处理 · 未派工")+'</span></span></summary><dl><dt>做什么</dt><dd>'+esc(item.work)+'</dd><dt>验收条件</dt><dd>'+esc(item.acceptance)+'</dd><dt>验证结果</dt><dd>'+esc(item.evidence)+'</dd></dl></details>'
  ).join("")+'<div class="completion-rule"><b>父节点什么时候才算完成？</b><p>'+esc(node.completionRule)+'</p></div>'+((node.relatedNodes||[]).length?'<div class="related-nodes"><span>其他验收另看：</span>'+node.relatedNodes.map(id=>{const related=allNodes().find(n=>n.id===id);return related?'<button type="button" data-open-node="'+esc(id)+'">'+esc(related.number+" "+related.title)+'</button>':"";}).join("")+'</div>':"")+'</section>';
}
function renderExecution() {
  const plan=mission.execution;
  document.querySelector("#execution").innerHTML='<div class="execution-heading"><div><p class="kicker">ONE ROADMAP · THREE OWNERS</p><h2 id="execution-title">'+esc(plan.title)+'</h2></div><span class="round-state">'+esc(plan.roundLabel || "本轮已收尾")+'</span></div><p class="execution-note">'+esc(plan.note)+'</p><div class="execution-grid">'+plan.cards.map(card=>{
    const node=allNodes().find(n=>n.id===card.nodeId);
    const items=node.workItems.filter(item=>card.taskIds.includes(item.id));
    return '<article class="execution-card"><div class="execution-owner">'+esc(card.owner)+'<span class="'+(items.every(item=>item.status==="done")?"accepted":"working")+'">'+(items.every(item=>item.status==="done")?"✓ 本轮子项本地验收通过":items.some(item=>item.status==="active")?"本轮执行中 · 待验收":"已安排 · 待开始")+'</span></div><button type="button" class="execution-link" data-open-node="'+esc(node.id)+'"><span>'+esc(node.number)+'</span>'+esc(node.title)+'<b aria-hidden="true">↗</b></button><p class="execution-task">'+items.map(item=>esc(item.title)).join("；")+'</p><p class="execution-boundary"><b>父节点仍部分完成</b> · 点击查看剩余工作与验收标准</p></article>';
  }).join("")+'</div><p class="assignment-state">'+esc(plan.state)+'</p><p class="execution-rule">'+esc(plan.rule)+'</p>';
}
function openNode(id) {
  activeFilter="all"; searchInput.value="";
  document.querySelectorAll(".filter").forEach(item=>item.classList.toggle("active",item.dataset.filter==="all"));
  selectNode(id);
  detailPanel.scrollTop=0;
  requestAnimationFrame(()=> {
    const target=window.matchMedia("(max-width:850px)").matches?detailPanel:document.querySelector('[data-node-id="'+id+'"]');
    target?.scrollIntoView({behavior:"smooth",block:"center"});
  });
}
function detailSection(title, items) {
  return items?.length ? '<section class="detail-section"><h4>'+esc(title)+'</h4><ul>'+items.map(item=>'<li>'+esc(item)+'</li>').join("")+'</ul></section>' : "";
}
function render() {
  const query = searchInput.value.trim().toLowerCase();
  roadmap.innerHTML = phases.map(phase => {
    const visible = phase.nodes.filter(node => {
      const search = !query || JSON.stringify(node).toLowerCase().includes(query);
      const filter = activeFilter === "all" || (activeFilter === "critical" && node.priority === "critical") ||
        (activeFilter === "offline" && /通过|覆盖|验证/.test(node.offline) && !/尚未|待补|未完成/.test(node.offline)) || activeFilter === node.status;
      return search && filter;
    });
    if (!visible.length) return "";
    const done = phase.nodes.filter(n=>n.status === "done").length;
    return '<section class="phase" id="'+esc(phase.id)+'"><header class="phase-head"><span class="phase-number">'+esc(phase.code)+'</span><div class="phase-title"><h3>'+esc(phase.title)+'</h3><p>'+esc(phase.subtitle)+'</p></div><span class="phase-count">'+done+' / '+phase.nodes.length+' 节点范围完成</span></header><div class="node-list">'+visible.map(node=> {
      const symbol = node.status === "done" ? "✓" : node.status === "blocked" ? "!" : node.status === "active" ? "↻" : node.recommended ? "→" : "";
      return '<button class="node '+(node.status==="done"?"completed":node.status==="active"?"in-progress":node.status==="blocked"?"blocked":"")+' '+(node.recommended?"recommended":"")+' '+(selectedId===node.id?"selected":"")+'" data-node-id="'+esc(node.id)+'" type="button" aria-pressed="'+(selectedId===node.id)+'"><span class="node-orb">'+symbol+'</span><span class="node-meta"><span class="node-id">'+esc(nodeNumber(node.id)+" · "+node.id)+'</span><span class="priority critical">'+(node.recommended?"待收口":"主线")+'</span></span><h4>'+esc(node.title)+'</h4><p>'+esc(node.cardSummary || node.summary)+'</p><span class="node-status">'+esc(node.progress)+'</span>'+(node.workItems?.length?'<span class="node-subtasks">'+node.workItems.filter(item=>item.status==="done").length+' / '+node.workItems.length+' 个执行子项已本地通过 · 查看分工 ↗</span>':"")+'<span class="node-facts">'+node.badges.map(t=>'<span>'+esc(t)+'</span>').join("")+'</span>'+(marks[node.id]?'<span class="personal-mark">个人标记：'+esc(labels[marks[node.id]] || "待核对")+'（不改变证据）</span>':"")+'</button>';
    }).join("")+'</div></section>';
  }).join("") || '<p class="empty-results">没有匹配节点。历史记录在下方单独保留，不参与筛选进度。</p>';
  document.querySelectorAll("[data-node-id]").forEach(button=>button.addEventListener("click",()=>selectNode(button.dataset.nodeId)));
}
function selectNode(id) {
  const node=allNodes().find(n=>n.id===id);
  if (!node) return;
  selectedId=id;
  detailPanel.innerHTML='<div class="detail-content"><div class="detail-top"><div><span class="detail-code">'+esc(node.number+" "+node.phase)+' · '+esc(node.id)+'</span><h3>'+esc(node.title)+'</h3></div></div><p class="detail-summary">'+esc(node.summary)+'</p><div class="fact-grid"><div><b>实现进度</b><span>'+esc(node.implementation)+'</span></div><div><b>离线验证</b><span>'+esc(node.offline)+'</span></div><div><b>当前模型 / 真实验证</b><span>'+esc(node.live)+'</span></div></div>'+workItemsSection(node)+detailSection("实现范围",node.goal)+detailSection("还缺什么",node.pending)+detailSection("验证方式",node.verify)+detailSection("完成标准",node.acceptance)+detailSection("当前证据",node.evidence)+detailSection("风险与边界",node.risks)+'<section class="status-control"><h4>浏览器个人标记 · 不修改项目事实</h4><div class="status-buttons">'+Object.entries(labels).map(([value,label])=>'<button class="status-button '+(marks[id]===value?"selected":"")+'" data-mark="'+value+'" type="button">'+esc(label)+'</button>').join("")+'</div><p class="status-hint" id="markHint">个人标记仅保存在当前浏览器，不作为完成、外部不支持或模型验收证据；阻塞不会自动从交付范围排除。</p></section><section class="detail-section"><h4>迁移自旧节点</h4><p>'+esc(node.sourceIds.length?node.sourceIds.join(" · "):"新增明确的框架接入检查节点")+'</p></section><div class="tags">'+node.tags.map(t=>'<span class="tag">'+esc(t)+'</span>').join("")+'</div></div>';
  document.querySelectorAll("[data-mark]").forEach(button=>button.addEventListener("click",()=>{
    marks[id]=button.dataset.mark;
    const saved=persistMarks();
    render(); selectNode(id);
    if (!saved) document.querySelector("#markHint").textContent="浏览器禁止持久化；本次标记只在当前页面有效，项目证据不变。";
  }));
  render();
}
function renderOverview() {
  document.querySelector("#currentModel").textContent=mission.meta.currentModel;
  document.querySelector("#totalCount").textContent=allNodes().length;
  document.querySelector("#offlineCount").textContent=mission.meta.offlineTests+" 项";
  document.querySelector("#activeCount").textContent=allNodes().filter(n=>n.status==="active").length;
  document.querySelector("#nextWork").textContent=mission.meta.nextWork;
  document.querySelector("#constraints").innerHTML=mission.constraints.map(item=>'<article class="notice '+esc(item.level)+'"><h3>'+esc(item.title)+'</h3><p>'+esc(item.text)+'</p></article>').join("");
}
function renderHistory() {
  document.querySelector("#historySummary").innerHTML=mission.history.map(item=>'<details class="history-card"><summary>'+esc(item.title)+'<span>'+esc(item.scope)+'</span></summary>'+detailSection("保留证据",item.items)+'</details>').join("");
  document.querySelector("#legacyArchive").innerHTML=mission.legacyPhases.map(phase=>'<section class="archive-phase"><h4>'+esc(phase.title)+' · '+phase.nodes.length+'条</h4>'+phase.nodes.map(node=> {
    const current=allNodes().find(n=>n.id===mission.migration[node.id]);
    const oldStatus=node.blocked?"当时标阻塞":node.done?"当时标完成":node.inProgress?"当时进行中":"当时待处理";
    return '<details class="legacy-record" data-history-id="'+esc(node.id)+'"><summary>'+esc(node.title)+'<small>'+esc(node.id)+' · '+oldStatus+' → '+esc(current?.title || "历史归档")+'</small></summary><p>'+esc(node.summary)+'</p>'+detailSection("当时实现范围",node.goal)+detailSection("当时验证方式",node.verify)+detailSection("当时完成标准",node.acceptance)+detailSection("当时风险",node.risks)+detailSection("当时证据（原样保留）",node.evidence)+'<p class="archive-tags">'+esc((node.tags||[]).join(" · "))+'</p></details>';
  }).join("")+'</section>').join("");
  let oldCount=0;
  for (const key of ["cc-genai-roadmap-status-v2","cc-genai-roadmap-progress-v1"]) {
    try { const value=JSON.parse(localStorage.getItem(key)||"{}"); if(value&&typeof value==="object") oldCount+=Object.keys(value).length; } catch {}
  }
  document.querySelector("#legacyMarksNote").textContent="旧版29节点与验证记录完整归档，不纳入当前15节点完成统计。"+(oldCount ? "检测到旧版浏览器个人标记，原存储已保留，不覆盖新版事实。" : "旧版浏览器标记如存在将保留，不覆盖新版事实。");
}
document.querySelectorAll(".filter").forEach(button=>button.addEventListener("click",()=>{
  activeFilter=button.dataset.filter;
  document.querySelectorAll(".filter").forEach(item=>item.classList.toggle("active",item===button));
  render();
}));
searchInput.addEventListener("input",render);
document.querySelector("#nextButton").addEventListener("click",()=>{
  const node=allNodes().find(n=>n.recommended);
  if(node) openNode(node.id);
});
document.addEventListener("click",event=>{
  const button=event.target.closest("[data-open-node]");
  if(button) openNode(button.dataset.openNode);
});
document.querySelector("#resetButton").addEventListener("click",()=>{
  for(const key of Object.keys(marks)) delete marks[key];
  persistMarks();
  render();
  if(selectedId) selectNode(selectedId);
});
renderOverview();
renderExecution();
renderHistory();
render();
selectNode("signature");
