# DESIGN.md

本文件定义"AI 时代的计算机科学课程"的系统架构。

## 1. 目的与范围

目标产品是一个长期演进、内容优先的 Web 应用，面向可能无正式 CS 背景、但技术素养较高的自学者。系统须支持大型层级课程、精确技术阐述、显式术语，以及浏览器内可执行的 Python/SQL 演示；须便于版本化、评审、部署与多年扩展，而不退化成 LMS 或定制应用服务器。

核心设计选择是把产品分成四层：

1. 版本控制的课程内容；
2. 构建期的内容编译与校验；
3. 以静态为主的阅读 UI；
4. 用于交互实验的本地浏览器执行运行时。

服务器刻意保持简单：只分发静态文件。有价值的"状态"要么在创作期存在于 Git，要么短暂存在于学习者浏览器中。

产品范围之外（有意省略，它们让系统可理解、托管便宜、运行安全）：评论、论坛与社交功能；云端 IDE；协同编辑；浏览器内 Git 客户端；把任意第三方包安装当作保证能力；集成式 AI 辅导；离线模式与 Service Worker。等真实课时需要时再做：跨刷新的持久化、多文件 Python 项目、其他 SQL 引擎、JavaScript/C/Rust 执行、复杂图表编辑器。产品明确不做的事（账号、进度、成绩、服务端执行）属于仓库级约束，见 `AGENTS.md`。

## 2. 架构原则

| 原则 | 含义 |
| --- | --- |
| 内容优先 | 耐久资产是课程而不是 Web 框架。一节课作为 Git 中的源文本必须仍可读；渲染组件应增强正文，而不是拥有正文 |
| 默认静态，例外才交互 | 普通段落、定理、表格与静态代码块在构建期渲染为 HTML。客户端 JS 只留给真正交互的功能：可执行单元格、术语浮层与抽屉、树状态、搜索 UI 与少量本地控件 |
| 显式语义优于推断 | 术语引用、可执行代码、共享运行时 session 与规范概念都由作者显式标注；构建系统不得按拼写、源顺序或启发式文本匹配去推断 |
| 稳定身份与呈现分离 | 课程与术语有稳定 ID；标题、URL slug、章节与顺序可以变；内部引用指向 ID，并在构建期解析 |
| 浏览器执行可丢弃 | 运行时状态不是用户数据，可能被 Reset、Stop、跳转、刷新或浏览器内存压力销毁；创作模型不得依赖持久化 |

## 3. 技术基线

**框架**：Astro + TypeScript。应用绝大部分是内容，适合输出静态 HTML、只对选定组件做 hydration。TypeScript 用于内容 schema、构建工具、运行时协议与交互组件。架构不依赖 Astro 特有魔法；关键要求是静态生成加组件化 MDX。若框架被替换，内容模型与运行时协议应基本不变。

**课时格式**：MDX。保留 Markdown 写作手感，允许在 Markdown 不足处使用显式语义组件。MDX 组件是创作 DSL 的一部分，公开接口必须小而稳定，课时作者不需要任意 React 知识。

**数学记法**：`$...$` 与 `$$...$$`，构建期渲染为静态 KaTeX（HTML 与 MathML），页面不加载客户端数学运行时。样式与字体来自打包的 `katex` 依赖，因此不发出第三方请求，也不受 CDN 可用性影响；KaTeX 无法解析的公式会让构建失败。

**交互孤岛**：用小型 React 孤岛承载可执行代码单元格、编辑器控件、结构化输出渲染、术语浮层与抽屉、搜索 UI，以及可选的可折叠演示。不要 hydration 整个课时页面。

**编辑器**：CodeMirror 6。足以支撑嵌入式实验，又比整套桌面 IDE 抽象轻得多。要求：Python 与 SQL 语法高亮；键盘可达的 Run、Stop、Reset；源码可编辑；对不应修改的演示提供只读模式；可见的"已修改"状态；恢复为规范源码；合理移动端行为；不得有会改变教学示例的隐藏自动格式化。

**运行时**：固定版本、自托管的 Pyodide，运行在专用 Web Worker 中。Pyodide 支持异步 Python 执行、浏览器端文件访问与在 Web Worker 内运行，当前构建内置 SQLite，一个运行时即可覆盖基线的 Python 与 SQL 用例。Worker 把昂贵的解释器启动移出主 UI 线程，并提供终止失控循环的简单开关。相关用法见 Pyodide 文档中的 `runPythonAsync`、浏览器文件访问与 Web Worker 控制台模式。

生产环境不得从非固定版本的公共 CDN 加载 Pyodide。自托管带来可复现构建、可预测缓存、更简单的 CSP，以及不受第三方运行时故障影响的独立性。

**搜索**：构建期生成静态搜索索引，搜索不得需要应用服务器。索引覆盖课时标题、各级标题、术语、别名与正文，并把标题与标题层级的排名置于正文之上。具体库可以是 Pagefind 或等价静态索引器；这是实现选择，不是内容契约。

**工具链**：`npm` 是包管理器与脚本运行器，Node 是唯一运行时；内容校验与测试在 Node 下执行（`tsx`、`vitest`），SQL 夹具回放与测试套件依赖 `node:sqlite`。单元测试用 Vitest，浏览器与运行时集成测试用 Playwright。依赖的安装脚本按 `package.json` 的 `allowScripts` 白名单执行（当前仅 `esbuild`），未列入的包不运行生命周期脚本。

## 4. 系统拓扑与仓库组织

没有用户代码跨越浏览器与服务器的边界。代表性布局：

```text
/
├── AGENTS.md
├── DESIGN.md
├── CONTENT_GUIDE.md
├── package.json
├── package-lock.json
├── astro.config.*
│
├── content/
│   ├── curriculum/
│   │   ├── _section.yaml
│   │   ├── python/
│   │   │   ├── _section.yaml
│   │   │   ├── basics/
│   │   │   └── objects/
│   │   ├── algorithms/
│   │   ├── operating-systems/
│   │   ├── networks/
│   │   ├── databases/
│   │   ├── software-engineering/
│   │   ├── distributed-systems/
│   │   └── security/
│   │
│   ├── glossary/
│   │   ├── process.mdx
│   │   └── transaction.mdx
│   │
│   ├── labs/
│   │   └── sql-orders-basic/
│   │       ├── lab.yaml
│   │       ├── seed.sql
│   │       └── expected-schema.sql
│   │
│   └── assets/
│
├── src/
│   ├── content.config.ts   可渲染内容的集合定义
│   ├── components/
│   │   ├── CourseTree.astro
│   │   ├── PageToc.astro   课程树与页内目录的静态呈现
│   │   └── mdx/            课时可用的显式组件（Term、CrossRef、LabRef、CodeLab）
│   ├── content-model/      课程模型：加载、校验、导航、单元格元数据
│   ├── integrations/       构建集成（内容校验、实验夹具产出）
│   ├── layouts/
│   ├── markdown/           构建期插件：标题锚点、可执行 fence 改写
│   ├── runtime/            单元格 UI、运行时客户端、worker 协议、Python 侧运行时，
│   │                       以及阅读页的小模块（术语浮层定位、页内目录标记）
│   ├── workers/            Pyodide worker
│   ├── styles/             按区域拆分的样式表，由 global.css 按层叠顺序引入
│   └── pages/
│
├── public/
│   ├── pyodide/            自托管运行时资产（生成物，不入版本库）
│   └── labs/               实验夹具（构建产出）
│
├── scripts/                内容校验、运行时资产取回
└── tests/                  纯 TS 单元测试
```

文件系统按人的方便组织相关工作；身份来自稳定 ID，而不是路径。

渲染路径与校验路径读同一批文件，但职责不同：`content-model/load.ts` 走文件系统，产出校验与导航使用的课程模型；Astro 内容集合（`src/content.config.ts`）只负责把 MDX 正文渲染成页面。两者复用同一套 frontmatter schema，集合条目的 id 取自作者的稳定 `id`，因此不存在第二套身份。

## 5. 课程树模型

### 5.1 章节元数据

每个代表课程章节的目录有一个 `_section.yaml`：

```yaml
id: databases
label: 数据库
order: 50
summary: 关系模型、SQL、索引、事务、查询执行与分布式数据系统基础。
status: active
```

嵌套目录构成可见树。`order` 只在同级之间生效。一个章节可以同时包含课时与子章节。

### 5.2 课时元数据

每节课使用类似如下的 frontmatter：

```yaml
---
id: db.transactions.isolation
slug: /databases/transactions/isolation
order: 40
title: 事务隔离与并发现象
status: published
objectives:
  - 精确定义事务调度与可串行化
  - 区分 dirty read、non-repeatable read 与 phantom
  - 根据并发控制机制解释实际隔离级别行为
---
```

必填元数据保持精简，目前没有可选字段；未来的编辑元数据应可增长而不影响路由。正文的 token 数不进 frontmatter：它由构建期用 `o200k_base` BPE 词表（`content-model/tokens.ts`）从课时正文算出，写入课程模型，供课时页页首显示；该数字面向作者，因此只在开发构建中出现，生产构建不向读者显示。词表随包自托管、编码确定，因此数字与构建都在离线条件下可复现；中文正文下按字符估算误差过大，不采用。

### 5.3 稳定 ID 与 slug

- `id` 全局唯一，并在移动与改标题后保持不变。
- `slug` 是公开 URL。
- 引用使用 `id`，绝不使用相对文件路径。
- 课时删减时，清理旧引用并删除被合并课时；不为删除的 ID 或 URL 保留兼容性别名、归档页或重定向。

### 5.4 可见性与路由

`status` 决定内容是否进入站点，而不是进入哪个 URL：

- 课时 `published` 生成页面，并出现在导航与阅读顺序中；
- 课时 `draft` 与 `review` 在开发服务器下可见（便于作者自查），生产构建既不路由也不导航到它们；
- 课时 `archived` 在任何模式下都不可见；
- 章节 `active` 可见，`draft` 仅开发期可见，`archived` 不可见；不可见章节下的课时随之不可见。

课时的公开 URL 来自 frontmatter 的 `slug`，路由不读文件路径。章节目前没有页面，只出现在课程树与面包屑中；为章节引入稳定 slug 与落地页是后续工作，届时同样不得用目录路径充当身份。

阅读顺序是课程树的深度优先遍历：先排本节自己的课时，再进入子章节，同级之间按 `order` 排序。`order` 只在同级内比较。

## 6. 创作原语

创作面必须刻意保持小。已接入校验与渲染的原语：

- `<Term id="...">...</Term>`：显式术语引用；
- `<CrossRef id="..." />`：课时与章节引用；
- `<LabRef id="..." />`：较大的夹具；
- 可执行 Python 代码块；可执行 SQL 代码块；静态代码块；
- 普通数学记法：`$...$` 行内、`$$...$$` 行间，构建期由 `src/markdown/math-katex.ts` 渲染为静态 KaTeX。

不要建立庞大的定制组件动物园。只有当组件表达了对校验、可访问性或渲染有价值且稳定的语义时，它才应该存在：新增一个原语意味着同时补齐校验器与渲染器，并更新这份列表。

## 7. 可执行代码的创作模型

### 7.1 静态与可执行代码

普通 fenced 代码是静态的，只做语法高亮。

可执行代码块必须显式声明：信息串中写出 `run` 与页面内唯一的 `id`，语言只能是 `python` 或 `sql`。构建时把它转换为 `CodeLab` 描述符，作者不写运行时管道代码。作者面向的完整选项表与声明示例见 `doc/CONTENT_GUIDE.md` 第 7 节。

### 7.2 单元格元数据

单元格描述符应支持：

```ts
interface ExecutableCell {
  id: string;
  language: "python" | "sql";
  source: string;
  session?: string;            // absent => isolated
  timeoutMs?: number;
  packages?: string[];
  fixture?: string;            // SQL lab fixture ID
  editable?: boolean;
  /** Optional documentation snapshot of expected output. Never used for grading. */
  expectedOutput?: string;
}
```

元数据在构建期校验。

### 7.3 隔离模型

默认行为是**单元格状态相互隔离**。

当共享状态本身有教学价值时，作者可以让若干单元格加入同一个具名 session：

```text
session="iterator-demo"
```

session 状态只作用于当前页面运行时，页面刷新后不保留。默认隔离把「读到一个单元格的结果」变成必须显式声明的事，而不是靠执行顺序碰巧成立。

## 8. Pyodide 运行时架构

### 8.1 每个课时页面一个惰性 Worker

包含可执行单元格的课时拥有一个惰性创建的 Pyodide worker。生命周期：

1. 静态页面加载，不付出任何 Python 运行时成本；
2. 若课时含可运行单元格，可在浏览器空闲时预取运行时；
3. 首次 Run 在需要时创建并初始化 worker；
4. 执行请求串行排队；
5. Stop 或硬超时终止 worker；
6. 后续执行创建全新 worker，并按需重建声明的夹具与 session；
7. 页面跳转销毁该页 worker。

每页一个 worker 在启动成本与故障隔离之间取得平衡：每单元格一个 worker 浪费内存，整站一个 worker 会造成跨页隐藏状态与更大的故障半径。

### 8.2 Worker 协议

使用显式带版本的报文协议：

```ts
type RuntimeRequest =
  | { type: "init"; requestId: string }
  | { type: "run-python"; requestId: string; cellId: string; source: string; session?: string; packages: string[] }
  | { type: "run-sql"; requestId: string; cellId: string; source: string; session?: string; fixtureUrl: string; maxResultRows: number }
  | { type: "reset-session"; requestId: string; session: string };

type RuntimeResponse =
  | { type: "ready"; requestId: string; protocolVersion: number; pyodideVersion: string }
  | { type: "stdout"; requestId: string; chunk: string; truncated?: boolean }
  | { type: "stderr"; requestId: string; chunk: string; truncated?: boolean }
  | { type: "result"; requestId: string; value: RuntimeValue }
  | { type: "error"; requestId: string; error: RuntimeError }
  | { type: "done"; requestId: string; elapsedMs: number };
```

约定：

- `requestId` 由 UI 侧生成，响应必须原样带回；不匹配的报文一律丢弃。
- 每条请求最终都必须以 `done` 结束，`error` 只是结论的一部分，不是终止信号。这样"输出 + 报错 + 耗时"三者在 UI 侧总能同时拿到。
- `ready` 表示解释器已可用，而不是"worker 已创建"：初始化失败（运行时资产缺失、无法加载）同样以 `error` + `done` 上报，UI 必须把它当作启动失败处理，否则握手永不落定。
- SQL 的夹具以 URL 下发，由 worker 自行取用并缓存；`maxResultRows` 由页面决定，不由 worker 猜。
- 不要在 UI 与 worker 代码之间传递无结构的临时对象。

### 8.3 Python 命名空间

隔离单元格使用只含预期基线环境的全新 globals 字典执行。具名 session 每个 session 维护一个 globals 字典。

这既避免了朴素嵌入式 REPL"所有东西永远共享 `__main__`"的意外行为，又允许讲授有状态工作流。

运行时的辅助代码位于自己的模块命名空间，单元格代码不在其中执行，因此既读不到也遮蔽不了运行时自身的名字。JS 侧只暴露一个入口函数。

### 8.4 包加载

包由课时声明，而不是把"从学习者任意 import 中发现"当作正确性契约。worker 可以用 Pyodide 的包加载 API 加载已知包；包版本由固定版本的 Pyodide 发行版与项目锁文件决定。

若学习者改动单元格去 import 未声明的包，UI 可以：

- 在该包存在于固定 Pyodide 发行版中时尝试加载；或
- 返回明确的"该包在本课程运行时不可用"错误。

不要承诺任意 PyPI 或网络安装。可复现性比包的数量更重要。

### 8.5 实现状态

已实现：

- 每个课时页一个惰性 worker，首次 Run 时创建；不含可执行单元格的页面不加载任何脚本。
- 运行时自托管（`public/pyodide/`，由 `npm run setup:runtime` 取回），不依赖 CDN。
- 若课时声明了可执行单元格而自托管运行时缺失，构建直接失败并给出应执行的命令，而不是产出单元格全部失效的站点。
- 单元格默认隔离命名空间；`session="..."` 共享一个命名空间，SQL 的 session 共享一个连接。
- Stop 与硬超时都通过终止 worker 实现；随后一次执行重建 worker，并按需重建夹具与 session。
- 硬超时的计时从单元格开始执行算起，不包含解释器加载；加载期间 Run 已可被 Stop 中止。
- stdout/stderr 字节上限与 SQL 结果行数上限，两者都在 UI 上显式标注已截断。

尚未实现：

- 空闲预取（8.1 第 2 条）。首次 Run 承担全部加载成本。
- 单元格输出中的图像与图表（10 节列出的类型中，目前只有文本、表格、受影响行数）。

## 9. SQL 运行时

### 9.1 Pyodide 内的 SQLite

基线 SQL 引擎是同一个 worker 中 Python 的 `sqlite3` 模块。好处：不需要第二个 WASM 运行时；在有意设计时，Python 与 SQL 演示可以共享文件与数据；SQLite 语义稳定，足以在单引擎层面讲授关系查询、约束、索引、事务、查询计划与许多并发概念；作者提供的数据库易于复现。

课程必须清楚标注 SQLite 特有行为。PostgreSQL、MySQL 特有的语义应当被说明为如此，而不是悄悄模拟。

### 9.2 夹具格式

SQL 实验夹具可以是：

1. `seed.sql`：模式加插入语句，重放到全新的内存数据库；或
2. `database.sqlite3`：预构建的数据库，复制进 worker 文件系统。

`lab.yaml` 描述夹具：

```yaml
id: sql.orders.basic
engine: sqlite
source: seed.sql
reset: recreate
max_result_rows: 200
```

构建期校验被引用的夹具文件。

### 9.3 SQL 单元格执行语义

对全新的隔离单元格：

1. 建立新连接；
2. 载入夹具；
3. 执行学习者的 SQL；
4. 每条产生结果的语句渲染为表格；
5. 变更类语句渲染影响行数；
6. 暴露 SQLite 错误并附上语句上下文。

具名 SQL session 在 Reset、页面跳转或 worker 终止之前保持连接存活。

### 9.4 查询结果

结果是结构化的，而不是预格式化文本：

```ts
interface TableResult {
  columns: string[];
  rows: unknown[][];
  totalRows?: number;
  truncated: boolean;
}
```

UI 渲染可访问的表格，并在视觉上区分 SQL `NULL`、字符串 `"NULL"` 与空字符串。

结果行数与渲染输出都有上限，默认 200 行是合理的；当查询有意产生大量行时，作者可以调低。

### 9.5 查询计划

SQL 组件最终应支持声明的"explain 模式"，使数据库章节可以可视化 `EXPLAIN QUERY PLAN` 输出，而不需要另开一条特性路径。

## 10. 输出模型

输出是有类型的流，而不是任意 HTML。基线输出类型：

```ts
type RuntimeValue =
  | { kind: "text"; text: string }
  | { kind: "repr"; text: string }
  | { kind: "table"; columns: string[]; rows: unknown[][]; truncated: boolean }
  | { kind: "image"; mime: "image/png"; data: Uint8Array }
  | { kind: "none" };
```

规则：

- stdout 与 stderr 在视觉上可区分；
- 异常保留 Python traceback 信息，但以文本安全渲染；
- v1 不把学习者代码生成的任意 HTML 注入页面；
- 长文本截断并给出显式指示；
- 二进制与图像输出需显式开启且限制大小；
- 输出容器可键盘到达并有屏幕阅读器标签。

这个有类型的模型阻止了"notebook 输出可以是任何东西"的架构渗透到应用其余部分。

## 11. Run / Stop / Reset 语义

| 控件 | 语义 |
| --- | --- |
| Run | 运行编辑器当前内容，而不是原始源码 |
| Stop | 取消正在运行的作业。可靠基线实现是终止 worker 并惰性重建；这比试图让所有 Python 负载都可协作取消要强得多。若 Stop 同时销毁了同页的其他具名 session，UI 必须明确说明 |
| Reset code | 把编辑器内容恢复为作者源码 |
| Reset state | 对隔离单元格，重建其逻辑执行上下文；对具名 session，重建该 session；SQL 的 Reset 重建连接并重新应用夹具 |

如果分开的"代码 Reset"与"状态 Reset"会让每个单元格都变得杂乱，UI 可以只给一个 Reset 按钮加一个小菜单。

## 12. 资源控制与故障处理

学习者可能无意中写出死循环或巨量输出，因此浏览器执行需要护栏。建议基线：

- 可配置的硬执行超时，配保守默认值；
- 执行期间可用的显式 Stop 按钮；
- 硬超时后终止 worker；
- stdout/stderr 字节上限；
- SQL 结果行数上限；
- 图像大小上限；
- 包白名单或固定版本解析；
- 每个 worker 同时只允许一个执行；
- 运行时重启后给出清晰的恢复提示。

Web Worker 限制 UI 阻塞，但不构成强安全沙箱。页面不得包含学习者代码可以滥用的秘密、令牌、特权 API 或需要认证的后端端点。

## 13. 网络与安全

静态资产加载完成后，运行时应当能在无外网访问的情况下工作。推荐的生产策略：

- 自托管 Pyodide 与课程数据；
- 使用限制性的 Content Security Policy；
- 按部署需要把 `connect-src` 收紧到 `'self'` 或更严；
- 不向 JavaScript 暴露应用秘密；
- 不提供执行或代理学习者代码的服务端端点；
- 正常课时中避免远程包安装；
- 把所有渲染出的运行时输出当作不可信；
- 异常与输出文本绝不用 `innerHTML`；
- 固定第三方包版本并在适用处校验完整性。

目标不是声称 WASM 里的任意 Python 被完美沙箱化，而是确保它周围没有多少有价值的高权限可滥用。

## 14. 术语表与快速定义系统

术语表应减少局部上下文切换，但不取代正文中仔细的定义。

**三层模型**：

1. **行内术语引用**：显式标注术语上的低调标记；
2. **快速定义**：简短而精确的定义，桌面端在浮层中、触屏端在抽屉或浮层中给出；
3. **完整词条**：稳定 URL，含规范定义、适用范围说明、别名、相关术语，以及引入或使用该概念的课时链接。

**词条 schema**：

```yaml
---
id: invariant
term: 不变量
english: invariant
aliases:
  - invariant property
short: 在所讨论的操作或状态转移前后都保持成立的性质。
related:
  - precondition
  - postcondition
---
```

词条分两档，结构由它在课程里的复用范围决定：**普通词条**给出定义与辨析（一词一义、同类课程内复用的术语，如负载因子、frontier、稳定排序）；**模型词条**另外给出适用范围、判据与常见误用（跨模块复用的分析语言，如不变量、成本模型、工作负载、局部性、摊还分析）。三档与两档都不新增 frontmatter 字段，`short` 始终是浮层与索引使用的短定义。

正文给出更长的定义与适用范围说明。

**显式引用**：作者写 `<Term id="invariant">不变量</Term>`，构建系统不按术语文本自动链接：许多技术术语是多义的，屈折形式会造成误报，作者也可能有意使用日常含义。术语标记的写作规则见 `doc/CONTENT_GUIDE.md`。

**已实现的部分**：行内术语引用渲染为指向词条的链接，其快速定义在悬停或获得焦点时以纯 CSS 浮层显示，因此键盘与读屏可达且不需要客户端脚本；`/glossary/` 是快速定义索引；每个词条在 `/glossary/<id>/` 有稳定 URL，含规范定义、适用范围、与其他概念的关系与常见误用。词条不列出引用它的课时：术语在何处出现由正文的 `<Term>` 标记本身表达。全局术语表抽屉与命令面板入口尚未实现，其要求是按中文词、英文词、别名与 ID 搜索并展示相关概念，不依赖任何用户历史。

**首次出现行为**：一节课内，首次被显式标注的出现可以视觉上更强，后续出现更安静。

## 15. 页面布局与导航

桌面布局：

```text
┌──────────────┬──────────────────────────────┬──────────────────┐
│ 课程树       │ 课程正文                     │ 本页目录         │
│              │ 可执行单元格                 │                  │
│              │ 图表与推导                   │                  │
└──────────────┴──────────────────────────────┴──────────────────┘
```

窄屏下，侧栏变为抽屉或行内导航。

必需的导航能力：可展开的课程树；当前页位置；按编辑顺序的前后课时；面包屑；本页目录；稳定的标题锚点；全局搜索。

**已实现的阅读界面**：三栏静态布局（课程树 / 正文 / 本页目录）；宽度不足 78rem 时收起本页目录列，改由课时标题下方的一个 `details` 承载同一份列表；宽度不足 60rem 时折为单栏，课程树移入一个由页首按钮打开的 `popover` 抽屉（Esc、点击外部与焦点返回由平台提供），第一屏因此落在面包屑与标题上而不是整棵课程树上。课程树使用原生 `details`/`summary`，折叠与展开不需要客户端脚本，当前课时所在分支默认展开，不指向任何课时的页面（首页、术语表）只展开顶层章节，嵌套章节默认折叠。正文由 MDX 在构建期渲染；课时页给出面包屑、页首元信息（可运行单元格数量；正文 token 数只出现在开发构建中，读者无法据它行动）、学习目标与按阅读顺序的前后课时。首页是定位而不是站点地图：一段课程说明、一个开始阅读的入口，以及每个顶层模块的摘要与课时数，各模块入口取构建期算出的阅读顺序中的第一节课；完整课程树由左侧导航负责。阅读页面只在页面确实需要某项能力时加载对应脚本：含可执行单元格的课时加载单元格运行时，含术语引用的页面加载浮层定位，含标题的页面加载本页目录的当前位置标记。搜索尚未实现。

不存在进度系统时，不要显示虚假的完成状态。

## 16. 搜索与交叉引用图

构建期生成索引，覆盖：课时标题与别名；章节名；各级标题；术语与别名；正文；课时 ID；存在时的标签。

同时生成反向引用：使用某实验或数据集的课时；彼此相关的术语。

这张图让系统在没有任何数据库服务器的情况下具备有用的文档行为。

## 17. 构建期校验

构建应尽早因内容错误而失败。最低限度校验项：

1. 课时、章节、术语、实验与数据集的 ID 唯一；
2. 公开 slug 唯一；
3. 所有 `CrossRef` 与 `Term` 的 ID 可解析；
4. 所有可执行单元格在页面内 ID 唯一；
5. 被引用的包在白名单内或版本已固定；
6. SQL 夹具存在且能成功初始化；
7. 被引用的资产存在；
8. 标题不产生重复锚点；
9. 术语的 `related` 引用可解析；
10. frontmatter 符合 schema。

标题锚点由校验与渲染共享同一个函数（`slugifyHeading`）：校验器用它判断同一课时内是否出现重复锚点，渲染管线用它写出 `id`。页面上的锚点与构建期检查的对象因此是同一个字符串，而不是两套近似规则；代价是标题的 Markdown 语法被限制在行内代码与强调之内，更复杂的行内结构不在约定范围内。

警告可以覆盖孤立术语、异常大的资产这类编辑问题，但断开的引用必须是硬失败。

## 18. 测试策略

**内容与 schema 测试**：对解析、引用解析与顺序规则写出可独立运行的小测例；校验项本身见第 17 节。

**运行时单元测试**：测试 worker 报文协议、输出截断、session 查找、结果序列化、SQL 行与 `NULL` 转换、Reset 记账、错误规范化。

**浏览器集成测试**：Playwright 覆盖一个小而具代表性的矩阵：加载不含 Pyodide 的页面并确认没有运行时下载；运行一个简单 Python 单元格；修改并重跑；Reset 源码；运行死循环或长任务并 Stop；初始化 SQL 夹具；变更、查询并 Reset 该夹具；在显式具名 session 中共享状态；确认隔离单元格看不到另一个单元格的状态；键盘操作术语表与编辑器控件。

**内容片段验证**：不是每个代码示例都需要在每次 CI 中经过浏览器执行。分层处理：每次构建解析并校验所有可执行单元格；每个 PR 运行一组精选冒烟套件；可选地在较慢的 CI 作业中运行所有标记 `verify: true` 的单元格。

## 19. 可访问性

技术深度不构成 UI 不可访问的理由。要求：

- 课程树与代码控件可完整键盘操作；
- 可见的焦点样式；
- 术语快速定义可由焦点或点击访问，而不是只能悬停；
- 语义化的标题层级；
- 编辑器标签与快捷键有文档；
- 运行状态与错误以适当方式播报；
- SQL 结果渲染为语义化表格；
- `NULL` 的表示不依赖颜色即可理解；
- 图表需要有意义的长文本替代或相邻的文字说明；
- 在可行处用支持 MathML/ARIA 的方式渲染数学内容。

## 20. 部署与版本策略

**产物**：标准构建产出静态 `dist/` 目录，包含 HTML；带哈希的 CSS/JS；搜索索引；内容资产；自托管的 Pyodide 运行时文件；供客户端下载的实验夹具与数据集。静态资产在 Web 服务器或 CDN 层压缩（Brotli/gzip）。

**Web 服务器**：Nginx、Caddy、对象存储加 CDN、类 GitHub Pages 托管或任何等价的静态托管都可以。缓存与安全响应头的要求：带哈希的资产与固定版本的 Pyodide 文件使用长期不可变缓存，HTML 使用短期或需重验证的缓存，其余按第 13 节的策略执行。

**持续部署**：

```text
pull request
  -> 内容校验
  -> 类型检查
  -> 单元测试
  -> 静态构建
  -> Pyodide 浏览器冒烟测试
  -> 预览产物

merge to main
  -> 重复上述检查
  -> 不可变的生产构建
  -> 部署静态产物
```

Git 是正文与代码的权威历史。

**版本策略**：固定重要的教学运行时：Node 工具链；Astro 与 UI 依赖；Pyodide 发行版；可执行课时显式使用的任何包。会改变课时可观察行为的依赖升级是影响内容的变更，应按此评审。课时正文应区分规范级论断与实现或版本相关论断。例如"Python 语言语义"与"CPython 3.x 实现行为"不可互换。

## 21. 拒绝的替代方案

**不用 notebook 架构**：notebook 混合正文与可执行单元格，因此很诱人，但不是主要架构：隐藏的执行顺序造成状态歧义；文档变成有运行时状态的，而非 Web 原生的；深层层级导航是次要的；稳定交叉引用与术语语义难以表达；服务端 notebook 会违反"不在服务器执行"的目标。借用其中有用的部分——可编辑的可执行单元格——同时保留文档语义与显式状态。

**不用完整 SPA**：完整单页应用会让静态正文依赖 JavaScript，增加 bundle 复杂度，并鼓励产品并不需要的全局客户端状态。静态优先渲染更契合这一负载。

## 22. 非规范性实现参考

以下参考支撑当前的 Pyodide 可行性假设，不属于课程内容契约：

- Pyodide JavaScript API（`runPythonAsync`、包与运行时 API）：<https://pyodide.org/en/stable/usage/api/js-api.html>
- Pyodide 浏览器文件访问：<https://pyodide.org/en/stable/usage/accessing-files.html>
- Pyodide Web Worker 控制台示例：<https://pyodide.org/en/stable/examples/console_webworker.html>
- 说明 `sqlite3` 重新默认内置的 Pyodide 314.0 发行说明：<https://blog.pyodide.org/posts/314-release/>

Pyodide 发行版仍应固定在仓库中。在运行时升级时重新核对这些假设，而不要无限期依赖不断变化的 `stable` 文档。
