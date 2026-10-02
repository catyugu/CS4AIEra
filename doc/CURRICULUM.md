# CURRICULUM.md

本文件是课程路线图：模块顺序、章节树、每节课的定位，以及每个模块的取舍理由。

## 1. 本文件的作用

`content/` 中实际存在的章节与课时是权威内容；本文件记录计划、边界与理由。

- 新课时先在这里登记 `id`、标题与定位，再落盘。
- 落盘后若与计划不一致，改本文件，不留下两份互相矛盾的大纲。
- `doc/CONTENT_GUIDE.md` 规定深度政策：分级判据与各模块的默认解释。本文件给出具体选择：哪些主题进入课时树，哪些被有意排除，以及排除的理由。
- 课时 `id` 在登记时确定并长期稳定；标题、slug 与所在目录可以改。

## 2. 全局约定

| 约定 | 内容 |
| --- | --- |
| 顺序 | `order` 取 10 的倍数，模块之间留出插入空间；同级唯一 |
| 课时 id | `<模块>.<子章节>.<主题>`，全小写点分隔；子章节名可省略 |
| slug | `/python/mutability-and-copy` 这类扁平形式，不体现子章节层级，章节不产生页面 |
| 状态 | 新课时以 `draft` 落盘，本地通读并运行全部单元格后改为 `published` |
| 可执行单元格 | 校验器对没有可执行单元格的课时给出警告，仓库测试要求问题列表为空，因此每节课至少要有一个能暴露模型或故障模式的单元格 |
| 单元格约定 | 默认隔离；需要连续状态时用具名 session；输出确定，不依赖当前时间、随机源、网络或未规定的迭代顺序 |
| 章节落盘 | 章节与它的课时同一批次落盘，避免出现空章节警告 |
| 交付粒度 | 一个子章节为一个批次：写完运行 `bun run check`，再用浏览器实机运行该批次的全部单元格 |

## 3. 取舍的三个问题

写作任何一节课之前先回答，并把答案写进本文件对应的模块小节。

1. **哪些细节交给 AI 与文档？** 判据：忘掉它是否会实质损害推理能力。API 目录、语法表、命令行参数、厂商管理命令、安装步骤、面试题清单属于此类。它们不进正文，课程只教如何提问与如何验证。
2. **哪些细节必须掌握？** 判据：读普通代码、使用常见工具、在生产中识别正确用法时处处遇到，但不需要死记。语言惯例、常见库行为、模式定义语法、基本工具操作属于此类。精确解释一次，目标是识别与正确使用。
3. **哪些观念值得深入学习？** 判据：反复决定真实系统的正确性、性能、可运维性或安全性，且生成代码容易看起来合理却错误。这类内容按 C、D 级讲授：先定义、再推导、给反例、配可执行实验、连到其他模块。

## 4. 模块顺序

| order | 模块 id | 名称 | 定位 |
| --- | --- | --- | --- |
| 10 | `python` | Python 语言 | 课程的编程基础与唯一的在线实验载体；对象与共享状态、调用与作用域、迭代与资源生命周期、协作式并发在这里建立 |
| 20 | `algorithms` | 数据结构、算法与复杂度 | 成本模型与表示选择；为后续每个模块提供分析语言 |
| 30 | `operating-systems` | 操作系统 | 进程、内存、I/O 与资源；上层所有系统的运行时底座 |
| 40 | `networks` | 计算机网络 | 分组、传输与应用协议；延迟、超时与重试的来源 |
| 50 | `databases` | 数据库 | 关系语义、索引、事务与查询计划；持久状态与并发的核心 |
| 60 | `software-engineering` | 软件工程、Git 与测试 | 变更与验证的方法论；把前面所有内容落到可维护的工程实践 |
| 70 | `distributed-systems` | 系统设计与分布式系统 | 部分失败下的推理；复制、一致性、投递语义与容量 |
| 80 | `security` | 安全 | 威胁模型与信任边界；把前面的系统知识用于对抗性场景 |

顺序理由：Python 是唯一能在线运行的语言，其余模块的实验都在它上面建立；复杂度是后续所有性能与容量论断的记法，因此紧随其后；操作系统与网络提供数据库、分布式系统与安全所依赖的运行时与通信假设；软件工程放在系统类模块之后，因为它讨论的是变更这些系统的方法；安全最后，因为它需要前七个模块的具体机制才能建立可信的威胁模型。

跨模块连接见 `doc/CONTENT_GUIDE.md` 第 11 节。

## 5. 各模块计划

### 5.1 Python 语言（`python`，order 10）

定位：课程的编程基础与唯一的在线实验载体。本模块承担三件事：建立全课程唯一的可执行语言，使后续模块可以直接给出 Python 实验而不必再解释语言；建立后续模块反复使用的程序语义模型（求值、绑定、对象与共享状态、调用、作用域、协议、异常、资源生命周期、协作式异步）；让读者能审查生成代码的状态变化、控制流与失败行为，而不只是写出能运行的程序。语法目录、标准库清单、工具链命令与格式化规则不进正文。

验收标准：给读者一段陌生的 Python，他能精确预测其状态变化、控制流与失败行为；不能直接预测时，他知道该构造什么实验来验证。

**交给 AI 与文档**：字符串、列表、字典的方法全集；`re` 语法细节；`itertools` 与 `collections` 的完整清单；`typing` 的全部构造；打包与工具链命令参数；`venv`、`pip` 的操作步骤；格式化与风格规则。

**必须掌握**：表达式与语句；值与类型；数值与字符串的常用操作；赋值与控制流；函数定义与调用；内置容器的使用；类与实例；模块与导入；异常捕获；生产代码中常见的类型标注写法；文件与上下文管理器基础。

**值得深入**：名称绑定与对象身份；可变性、原地更新与复制；相等与哈希契约；调用与参数绑定；作用域与闭包；迭代协议与生成器；异常传播与 `finally`；上下文管理与资源生命周期；属性查找、特殊方法与读码所需的 MRO；数值表示与近似；文本、字节与编码；类型标注作为可机械检查的契约；`async`/`await` 的调度、取消与清理；语言保证与 CPython、课程运行时的边界。

**有意排除并指定去处**：线程、GIL 与共享内存归 `os.threads`、`os.concurrency`——线程是操作系统的执行模型，在 Python 章完整讲授会与 OS 章重复，本模块只讲语言的协作式异步语义；剖析与数据驱动的性能调查归 `swe.debugging`，它需要算法成本模型与 I/O 知识在前；`venv`、依赖声明、锁文件与可复现环境归 `swe.dependencies`，属于工程与供应链问题，本模块只说明依赖属于环境而不属于源码；异常层次与失败契约设计归 `swe.error-contracts`，语言机制在本模块讲完，契约设计属于接口设计。

深度分配：`python.basics` 为 B；`python.objects`、`python.functions`、`python.iteration` 以 C/D 为主；`python.data-model`、`python.representation`、`python.program`、`python.async` 为 C 与 C/D。

状态列：`✓` 已发布，`草稿` 已落盘但不进入站点，`—` 计划中。

| 子章节 | order | 课时 id | 标题 | 落盘 |
| --- | --- | --- | --- | --- |
| `python.basics` | 10 | `python.programs-and-expressions` | 程序、表达式与语句 | ✓ |
| | 20 | `python.values-and-types` | 值与类型 | ✓ |
| | 30 | `python.numbers-and-arithmetic` | 数值与算术 | ✓ |
| | 40 | `python.strings` | 字符串 | ✓ |
| | 50 | `python.names-and-assignment` | 名称与赋值 | ✓ |
| | 60 | `python.conditionals` | 比较、布尔与条件 | ✓ |
| | 70 | `python.loops` | 循环 | ✓ |
| | 80 | `python.functions` | 函数 | ✓ |
| | 90 | `python.collections` | 列表、元组、字典与集合 | ✓ |
| | 100 | `python.classes` | 类与实例 | 草稿 |
| | 110 | `python.modules-basics` | 模块、导入与文件读写 | — |
| | 120 | `python.errors-basics` | 错误与异常处理入门 | — |
| `python.objects` | 10 | `python.names-and-objects` | 对象、身份与别名 | 草稿 |
| | 20 | `python.mutability-and-copy` | 可变性、原地更新与复制 | 草稿 |
| | 30 | `python.equality-and-hashing` | 相等与哈希契约 | 草稿 |
| `python.functions` | 10 | `python.call-semantics` | 调用与参数绑定 | — |
| | 20 | `python.scope-and-closure` | 作用域与闭包 | — |
| | 30 | `python.decorators` | 函数作为值与装饰器 | — |
| `python.iteration` | 10 | `python.iteration-protocol` | iterable 与 iterator | — |
| | 20 | `python.generators` | generator 与 `yield` | — |
| | 30 | `python.exceptions` | 异常、传播与 `finally` | — |
| | 40 | `python.context-managers` | 上下文管理器与资源生命周期 | — |
| `python.data-model` | 10 | `python.attributes-and-descriptors` | 属性查找与方法绑定 | — |
| | 20 | `python.dunder-protocols` | 特殊方法与 Python 协议 | — |
| | 30 | `python.inheritance-and-mro` | 继承与 MRO | — |
| `python.representation` | 10 | `python.numbers-and-floats` | 整数、浮点数与近似 | 草稿 |
| | 20 | `python.text-and-bytes` | 文本、bytes 与编码 | 草稿 |
| `python.program` | 10 | `python.runtime-vs-language` | 语言保证与实现细节 | 草稿 |
| | 20 | `python.modules-and-imports` | 模块、包与导入边界 | — |
| | 30 | `python.typing` | 类型标注与静态契约 | — |
| `python.async` | 10 | `python.asyncio-scheduling` | coroutine、task 与调度 | — |
| | 20 | `python.cancellation-and-timeouts` | 取消、超时与清理 | — |

### 5.2 数据结构、算法与复杂度（`algorithms`，order 20）

定位：建立成本模型与表示选择的语言。本模块的目标不是算法清单，而是让读者能自己推导复杂度、判断常数与局部性、并在真实约束下选择结构。

**交给 AI 与文档**：冷门命名算法的实现；非教学必要时手写平衡树；面试题集合；排序算法之间的常数因子比较表。

**必须掌握**：数组与序列；栈、队列、deque；映射与集合；堆；树；图；排序与搜索族；基本递归与动态规划模式。

**值得深入**：带显式成本模型的渐进记号；最坏、平均与摊还分析；表示不变量；哈希与冲突行为；局部性与缓存后果；贪心正确性论证；动态规划作为状态分解；下界直觉；在真实内存与局部性约束下选择结构；识别名义上渐进更优却在实际规模下更慢的算法。

| 子章节 | order | 课时 id | 标题 | 落盘 |
| --- | --- | --- | --- | --- |
| `algorithms.complexity` | 10 | `algorithms.cost-model` | 操作成本模型与渐进记号 | — |
| | 20 | `algorithms.amortized` | 摊还分析 | — |
| | 30 | `algorithms.average-and-randomized` | 平均情形与随机化 | — |
| | 40 | `algorithms.lower-bounds` | 下界与不可近似 | — |
| `algorithms.sequences` | 10 | `algorithms.arrays-and-lists` | 数组、动态数组与局部性 | — |
| | 20 | `algorithms.linked-structures` | 链表与指针结构 | — |
| | 30 | `algorithms.strings` | 字符串搜索与表示 | — |
| `algorithms.maps` | 10 | `algorithms.hash-tables` | 哈希表与冲突处理 | — |
| | 20 | `algorithms.ordered-maps` | 平衡树与有序映射 | — |
| | 30 | `algorithms.heaps` | 堆与优先队列 | — |
| `algorithms.graphs` | 10 | `algorithms.graph-representation` | 图的表示与遍历 | — |
| | 20 | `algorithms.shortest-paths` | 最短路径 | — |
| | 30 | `algorithms.dags-and-components` | DAG、拓扑序与连通性 | — |
| `algorithms.techniques` | 10 | `algorithms.sorting` | 排序与稳定性 | — |
| | 20 | `algorithms.divide-and-conquer` | 分治 | — |
| | 30 | `algorithms.greedy` | 贪心与交换论证 | — |
| | 40 | `algorithms.dynamic-programming` | 动态规划 | — |
| | 50 | `algorithms.search-and-pruning` | 二分、剪枝与回溯 | — |
| `algorithms.selection` | 10 | `algorithms.choosing-structures` | 数据结构选择的判据 | — |
| | 20 | `algorithms.complexity-in-practice` | 渐进之外：常数、局部性与内存 | — |

### 5.3 操作系统（`operating-systems`，order 30）

定位：解释上层所有系统的运行时底座。内核边界、虚拟内存、调度、同步与 I/O 路径是后续数据库、分布式与安全模块反复依赖的机制。

线程在本模块首次引入，实验载体是 Python 的 `threading`：Python 章只建立对象共享状态与协作式异步，共享地址空间、调度、竞态与同步原语属于本模块，GIL 作为 CPython 的实现约束一并说明。

**交给 AI 与文档**：系统调用号与名称记忆；冷门调度器参数；与概念无关的发行版管理命令。

**必须掌握**：进程与线程；文件与文件描述符；管道与 socket；权限；实用层面的信号；进程创建与终止；常见可观测性工具的基本用法。

**值得深入**：用户与内核边界；系统调用成本；虚拟内存与地址空间；页、缺页与映射；调度与阻塞；同步原语与内存序；文件系统语义与缓存；I/O 路径与缓冲；进程与线程的隔离和共享；容器作为隔离与资源机制的组合；竞态与 happens-before；死锁条件；存储层次与性能；fsync 与持久性误解；资源耗尽与背压；从证据诊断 CPU、内存、I/O 与锁争用。

| 子章节 | order | 课时 id | 标题 | 落盘 |
| --- | --- | --- | --- | --- |
| `os.processes` | 10 | `os.process-model` | 进程、地址空间与内核边界 | — |
| | 20 | `os.syscalls` | 系统调用接口与成本 | — |
| | 30 | `os.process-lifecycle` | 创建、终止与父子关系 | — |
| | 40 | `os.threads` | 线程、共享与调度单位 | — |
| `os.memory` | 10 | `os.virtual-memory` | 虚拟内存与地址转换 | — |
| | 20 | `os.paging` | 缺页、置换与工作集 | — |
| | 30 | `os.memory-mapping` | 内存映射与共享内存 | — |
| | 40 | `os.allocators` | 用户态分配器与碎片 | — |
| `os.concurrency` | 10 | `os.scheduling` | 调度策略与延迟 | — |
| | 20 | `os.synchronization` | 锁、原子操作与内存序 | — |
| | 30 | `os.deadlock` | 死锁条件与处理 | — |
| | 40 | `os.races` | 竞态与 happens-before | — |
| `os.io` | 10 | `os.files-and-descriptors` | 文件、描述符与打开文件描述 | — |
| | 20 | `os.io-paths` | 缓冲、page cache 与 I/O 路径 | — |
| | 30 | `os.durability` | fsync、持久性与崩溃一致性 | — |
| | 40 | `os.filesystem-semantics` | 目录、链接与原子重命名 | — |
| `os.resources` | 10 | `os.resource-limits` | 资源耗尽、限额与背压 | — |
| | 20 | `os.containers` | 容器：命名空间与 cgroup | — |
| | 30 | `os.diagnosis` | 从证据诊断 CPU、内存、I/O 与锁 | — |

### 5.4 计算机网络（`networks`，order 40）

定位：协议行为与它的运维后果。重点在延迟的构成、可靠性机制的真实契约，以及超时与重试如何把传输层行为传播到应用层。

**交给 AI 与文档**：头部字段的逐位记忆；端口号表；厂商 CLI 语法；协议头长度与选项编号。

**必须掌握**：IP 编址与子网；DNS；TCP 与 UDP 的基本行为；HTTP；运维层面的 TLS；代理、负载均衡与 NAT；socket 编程接口。

**值得深入**：分组交换与统计复用；分层是接口分解；路由与端到端传输的分工；TCP 的顺序、重传、流控与拥塞行为；延迟构成与尾延迟；DNS 解析与缓存；HTTP 方法与缓存语义；TLS 信任与密钥建立；连接生命周期与资源成本；超时、重试与幂等的相互作用；排队与拥塞；部分连通；keep-alive 与连接池的权衡；解读抓包与请求链路。

| 子章节 | order | 课时 id | 标题 | 落盘 |
| --- | --- | --- | --- | --- |
| `net.foundations` | 10 | `net.layering` | 分层是接口分解 | — |
| | 20 | `net.packet-switching` | 分组交换与统计复用 | — |
| | 30 | `net.ip-addressing` | IP 编址、子网与路由 | — |
| | 40 | `net.end-to-end` | 路由与端到端传输的分工 | — |
| `net.transport` | 10 | `net.tcp-connection` | TCP 连接、序号与重传 | — |
| | 20 | `net.flow-and-congestion` | 流控、拥塞控制与排队 | — |
| | 30 | `net.udp` | UDP 与不可靠传输 | — |
| | 40 | `net.timeouts-and-retries` | 超时、重试与幂等 | — |
| | 50 | `net.latency` | 延迟构成与尾延迟 | — |
| `net.application` | 10 | `net.dns` | DNS 解析与缓存 | — |
| | 20 | `net.http` | HTTP 方法与语义 | — |
| | 30 | `net.http-caching` | 缓存语义与条件请求 | — |
| | 40 | `net.tls` | TLS：信任、握手与密钥建立 | — |
| | 50 | `net.connections` | 连接生命周期与连接池 | — |
| `net.operations` | 10 | `net.proxies` | 代理、负载均衡与 NAT | — |
| | 20 | `net.sockets` | socket、描述符与阻塞 | — |
| | 30 | `net.traffic-analysis` | 抓包与请求链路诊断 | — |

### 5.5 数据库（`databases`，order 50）

定位：持久状态与并发的核心。本模块用 SQL 夹具做可执行实验，把关系语义、约束、索引与事务后果直接呈现为可观察的输出与计划。

**交给 AI 与文档**：完整 SQL 语法；厂商管理命令目录；ORM 方法清单；具体版本的配置项。

**必须掌握**：SELECT、WHERE、GROUP BY、ORDER BY；连接；CTE 与子查询；INSERT、UPDATE、DELETE；模式定义；常见索引形式；迁移的基本操作。

**值得深入**：关系模型与键；SQL 的包语义；`NULL` 与三值逻辑；约束作为完整性规则；连接是关系组合；B 树式索引与访问路径；查询计划与基数估计；事务与日志；锁与 MVCC；隔离级别与可串行化；崩溃恢复；复制基础；索引对写入的代价；模式约束与应用层校验的分工；热点键与争用；在线模式与数据变更；分布式数据系统的一致性权衡。

SQL 夹具计划：`sql.orders.basic` 覆盖关系语义、`NULL`、聚合、连接与约束；索引与查询计划需要一个更大的夹具（更多行与多个索引），在写 `db.storage` 批次时新增；事务与隔离需要能并发访问的夹具，按同一模式扩展。

| 子章节 | order | 课时 id | 标题 | 落盘 |
| --- | --- | --- | --- | --- |
| `db.relational` | 10 | `db.relational-model` | 关系、键与完整性 | — |
| | 20 | `db.sql.null-semantics` | NULL 与三值逻辑 | ✓ |
| | 30 | `db.sql.aggregation` | 分组与聚合 | — |
| | 40 | `db.sql.joins` | 连接是关系组合 | — |
| | 50 | `db.sql.subqueries` | 子查询、CTE 与求值 | — |
| | 60 | `db.sql.mutations` | 变更语句与状态转移 | — |
| `db.schema` | 10 | `db.constraints` | 约束作为完整性规则 | — |
| | 20 | `db.schema-evolution` | 迁移、回填与在线变更 | — |
| `db.storage` | 10 | `db.storage-layout` | 页、行格式与存储布局 | — |
| | 20 | `db.b-tree-indexes` | B 树索引与访问路径 | — |
| | 30 | `db.index-tradeoffs` | 索引的写入代价 | — |
| | 40 | `db.query-plans` | 查询计划与基数估计 | — |
| `db.transactions` | 10 | `db.transactions` | 事务、日志与 ACID | — |
| | 20 | `db.isolation` | 隔离级别与并发现象 | — |
| | 30 | `db.mvcc-and-locks` | MVCC、锁与可串行化 | — |
| | 40 | `db.recovery` | 日志与崩溃恢复 | — |
| | 50 | `db.replication` | 复制与一致性权衡 | — |
| `db.operations` | 10 | `db.contention` | 热点键与争用 | — |
| | 20 | `db.orm-boundary` | ORM 边界与生成查询 | — |

### 5.6 软件工程、Git 与测试（`software-engineering`，order 60）

定位：变更与验证的方法论。前面所有模块讲系统如何工作，本模块讲如何安全地改动它们，以及什么证据能支持"改动正确"这一结论。

性能调查在本模块展开：它需要算法模块的成本模型与操作系统模块的 I/O 知识在前，因此剖析与数据驱动的优化归入 `swe.debugging` 批次，而不放在 Python 章。

**交给 AI 与文档**：每个 Git 参数的含义；IDE 点击路径；格式化器与 linter 机械执行的风格细节；测试框架的断言 API 清单。

**必须掌握**：仓库工作流；commit、分支与 tag；实用层面的 merge 与 rebase；包与依赖管理；单元、集成与端到端测试的分工；CI 基础；代码评审；调试工具。

**值得深入**：足以从错误中恢复的 Git 对象与 DAG 模型；接口与信息隐藏；耦合、内聚与依赖方向；兼容、弃用与迁移；测试判据设计；确定性与状态隔离；基于属性与不变量的测试；可复现构建；可观测性作为设计的一部分；从证据调试；用不变量、diff、测试与契约评审生成代码。

| 子章节 | order | 课时 id | 标题 | 落盘 |
| --- | --- | --- | --- | --- |
| `swe.git` | 10 | `swe.git.objects` | Git 对象模型与 DAG | — |
| | 20 | `swe.git.branches` | 分支、合并与 rebase 的模型 | — |
| | 30 | `swe.git.recovery` | 从错误中恢复 | — |
| | 40 | `swe.git.collaboration` | 提交卫生、评审与历史 | — |
| `swe.design` | 10 | `swe.interfaces` | 接口、信息隐藏与不变量 | — |
| | 20 | `swe.coupling` | 耦合、内聚与依赖方向 | — |
| | 30 | `swe.error-contracts` | 错误处理与契约设计 | — |
| | 40 | `swe.compatibility` | 兼容、弃用与迁移 | — |
| `swe.testing` | 10 | `swe.testing.criteria` | 测试判据设计 | — |
| | 20 | `swe.testing.determinism` | 确定性、隔离与夹具 | — |
| | 30 | `swe.testing.properties` | 基于属性与不变量的测试 | — |
| | 40 | `swe.testing.levels` | 单元、集成与端到端的分工 | — |
| `swe.delivery` | 10 | `swe.dependencies` | 依赖、锁文件与供应链 | — |
| | 20 | `swe.reproducible-builds` | 可复现构建 | — |
| | 30 | `swe.ci` | CI 作为验证管道 | — |
| | 40 | `swe.observability` | 可观测性作为设计 | — |
| `swe.debugging` | 10 | `swe.debugging` | 从证据调试 | — |
| | 20 | `swe.review-ai-changes` | 评审生成代码 | — |

### 5.7 系统设计与分布式系统（`distributed-systems`，order 70）

定位：部分失败下的推理。分布式系统与单机系统的差别在于失败模型、时间假设与状态所有权，因此本模块从失败模型与时钟开始，再进入复制、一致性与容量。

**交给 AI 与文档**：背诵式面试脚本；云厂商服务目录与产品名对照；具体产品的配置项。

**必须掌握**：缓存；负载均衡；队列；对象存储；关系型与键值存储的角色分工；分片与分区；复制；后台任务；指标、日志与追踪。

**值得深入**：负载刻画与容量估算；延迟、吞吐与资源的权衡；状态所有权；复制与 quorum 概念；时钟、顺序与超时；失败模型；一致性模型；幂等；投递语义；背压；分区与再平衡；共识的概念与算法；部分失败下的推理；区分 exactly-once 声称与端到端效果；安全的重试设计；热点分区；恢复与对账；让不变量在分布式执行中存活。

| 子章节 | order | 课时 id | 标题 | 落盘 |
| --- | --- | --- | --- | --- |
| `dist.foundations` | 10 | `dist.why-distribute` | 分布的成本与动机 | — |
| | 20 | `dist.failure-models` | 失败模型与部分失败 | — |
| | 30 | `dist.clocks-and-order` | 时钟、顺序与超时 | — |
| `dist.communication` | 10 | `dist.rpc` | RPC 的抽象泄漏 | — |
| | 20 | `dist.idempotency` | 幂等与重试安全 | — |
| | 30 | `dist.delivery-semantics` | 投递语义与 exactly-once | — |
| `dist.data` | 10 | `dist.replication` | 复制与主从模型 | — |
| | 20 | `dist.consistency-models` | 一致性模型与可线性化 | — |
| | 30 | `dist.quorums` | quorum 与读写交集 | — |
| | 40 | `dist.partitioning` | 分片、再平衡与热点 | — |
| | 50 | `dist.consensus` | 共识与领导者选举 | — |
| | 60 | `dist.distributed-transactions` | 分布式事务与两阶段提交 | — |
| `dist.architecture` | 10 | `dist.caching` | 缓存、失效与一致性 | — |
| | 20 | `dist.queues` | 队列、背压与后台任务 | — |
| | 30 | `dist.capacity` | 负载刻画与容量估算 | — |
| | 40 | `dist.state-ownership` | 状态所有权与不变量的边界 | — |
| `dist.operations` | 10 | `dist.reconciliation` | 恢复、对账与修复 | — |
| | 20 | `dist.observability` | 分布式可观测性 | — |

### 5.8 安全（`security`，order 80）

定位：对抗性场景下的系统推理。本模块从资产、对手与信任边界开始，把前七个模块的机制放进威胁模型，再讨论密码学与 Web 与供应链的具体控制。

**交给 AI 与文档**：不理解机制就背漏洞缩写；没有威胁模型的检查表；本应来自受维护标准或库的密码学参数表。

**必须掌握**：认证与授权；会话与令牌；口令处理；TLS 的正确使用；输入校验与编码；常见 Web 攻击类别；密钥管理；依赖卫生。

**值得深入**：威胁建模先于控制；授权不变量；引用监控器；最小权限；密码学原语的目标与组合限制；随机数与 nonce；口令哈希；注入与解析歧义；XSS、CSRF 与源模型；沙箱与隔离；混淆代理与能力问题；密钥与秘密的生命周期；安全更新与供应链；审计与隐私的取舍；识别"已加密"或"已签名"并不等于所需性质。

| 子章节 | order | 课时 id | 标题 | 落盘 |
| --- | --- | --- | --- | --- |
| `sec.foundations` | 10 | `sec.threat-modeling` | 资产、对手与攻击面 | — |
| | 20 | `sec.trust-boundaries` | 信任边界与最小权限 | — |
| | 30 | `sec.access-control` | 访问控制与授权不变量 | — |
| `sec.crypto` | 10 | `sec.crypto-primitives` | 原语的目标与组合限制 | — |
| | 20 | `sec.hashing-and-integrity` | 哈希、MAC 与完整性 | — |
| | 30 | `sec.passwords` | 口令存储与哈希 | — |
| | 40 | `sec.randomness` | 随机数、nonce 与唯一性 | — |
| | 50 | `sec.tls-trust` | 证书、信任链与误用 | — |
| `sec.web` | 10 | `sec.injection` | 注入与解析歧义 | — |
| | 20 | `sec.xss-and-csrf` | XSS、CSRF 与源模型 | — |
| | 30 | `sec.sessions-and-tokens` | 会话、令牌与认证 | — |
| | 40 | `sec.confused-deputy` | 混淆代理与能力 | — |
| `sec.systems` | 10 | `sec.sandboxing` | 沙箱与隔离 | — |
| | 20 | `sec.secrets` | 密钥生命周期与秘密管理 | — |
| | 30 | `sec.supply-chain` | 依赖、构建与供应链 | — |
| | 40 | `sec.audit-and-privacy` | 审计日志与隐私 | — |

## 6. 写作批次

| 批次 | 范围 | 状态 |
| --- | --- | --- |
| 1 | `python.basics` 精度修订（9 节正文） | 完成 |
| 2 | `python.classes`（已落盘）、`python.modules-basics`、`python.errors-basics`：封闭 `python.basics` | 进行中 |
| 3 | `python.objects`：对象、身份与别名 → 可变性、原地更新与复制 → 相等与哈希契约 | 进行中 |
| 4 | `python.functions`：调用与参数绑定、作用域与闭包、函数作为值与装饰器 | 计划 |
| 5 | `python.iteration`：iterable 与 iterator → generator → 异常传播与 `finally` → 上下文管理器 | 计划 |
| 6 | `python.data-model`：属性查找与方法绑定、特殊方法、继承与 MRO | 计划 |
| 7 | `python.representation`：整数与浮点、文本与 bytes | 进行中 |
| 8 | `python.program`：语言保证与实现细节、模块与包导入边界、类型标注与静态契约 | 进行中 |
| 9 | `python.async`：coroutine 与调度、取消与超时清理 | 计划 |
| 10 | `algorithms.complexity`、`algorithms.sequences` | 计划 |
| 11 | `algorithms.maps`、`algorithms.graphs` | 计划 |
| 12 | `algorithms.techniques`、`algorithms.selection` | 计划 |
| 13 | `os.processes`、`os.memory` | 计划 |
| 14 | `os.concurrency`、`os.io` | 计划 |
| 15 | `os.resources` | 计划 |
| 16 | `net.foundations`、`net.transport` | 计划 |
| 17 | `net.application`、`net.operations` | 计划 |
| 18 | `db.relational`、`db.schema` | 计划 |
| 19 | `db.storage`（含新夹具） | 计划 |
| 20 | `db.transactions`、`db.operations` | 计划 |
| 21 | `swe.git`、`swe.design` | 计划 |
| 22 | `swe.testing`、`swe.delivery`、`swe.debugging` | 计划 |
| 23 | `dist.foundations`、`dist.communication` | 计划 |
| 24 | `dist.data`、`dist.architecture`、`dist.operations` | 计划 |
| 25 | `sec.foundations`、`sec.crypto` | 计划 |
| 26 | `sec.web`、`sec.systems` | 计划 |

批次顺序按模块顺序推进，模块内按子章节顺序推进。每个批次落盘后更新本表。

## 7. 维护

- 模块内部新增课时：在本文件的对应表格中登记 `id` 与标题，再落盘。
- 拆分一节课：新课时取新 `id`，旧 `id` 保留给拆分后覆盖原有范围的那一节。
- 删除课时：先清引用（`<CrossRef>`、术语与实验的使用），再删文件与可能空掉的章节。
- 调整模块顺序：改本文件第 4 节与 `_section.yaml` 的 `order`，两者必须一致。
- 版本敏感的论断：升级 Pyodide 或数据库引擎后，复查本文件标记为依赖运行时行为的课时。
