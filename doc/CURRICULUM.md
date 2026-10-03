# CURRICULUM.md

本文件是课程地图：模块顺序、每个模块的教学范围、课时树与实际完成状态。

`content/` 中实际存在的章节与课时是权威内容，本文件记录结构、边界与进度。写作方法（读者假设、内容分级、论证与示例规则、风格）见 `doc/CONTENT_GUIDE.md`；产品与运行时实现见 `doc/DESIGN.md`；仓库级不变量与验证要求见 `AGENTS.md`。

## 1. 结构约定

模块、子章节、课时 `id`、`slug`、`order` 与可见性由 `doc/DESIGN.md` 第 5 节规定，本文件按该约定列出课时树。一个子章节的课时同一批次落盘，避免空章节。课时的内容要求（可执行单元格、术语与引用标记）由 `doc/CONTENT_GUIDE.md` 规定，本文件不重复。

## 2. 模块顺序

| order | 模块 id | 名称 |
| --- | --- | --- |
| 10 | `python` | Python 语言 |
| 20 | `algorithms` | 数据结构、算法与复杂度 |
| 30 | `operating-systems` | 操作系统 |
| 40 | `networks` | 计算机网络 |
| 50 | `databases` | 数据库 |
| 60 | `software-engineering` | 软件工程、Git 与测试 |
| 70 | `distributed-systems` | 系统设计与分布式系统 |
| 80 | `security` | 安全 |

顺序理由：Python 是唯一能在线运行的语言，其余模块的实验都在它上面建立；复杂度是后续所有性能与容量论断的记法，因此紧随其后；操作系统与网络提供数据库、分布式系统与安全所依赖的运行时与通信假设；软件工程讨论如何安全地变更这些系统，因此排在系统类模块之后；安全最后，因为它需要前七个模块的具体机制才能建立可信的威胁模型。

跨模块概念连接见 `doc/CONTENT_GUIDE.md` 第 10 节。

## 3. 各模块范围

每个模块给出：定位、范围与重点、有意排除并指定去处的主题、深度分配。深度级别（A/B/C/D）的定义见 `doc/CONTENT_GUIDE.md` 第 2 节，这里只写该模块的取舍。

状态列：`✓` 已发布；`已冻结` 已过逐段评审但尚未发布；`草稿` 已落盘待评审；`—` 计划中。

### 3.1 Python 语言（`python`，order 10）

定位：课程的编程基础与唯一的在线实验载体。本模块建立后续模块反复使用的程序语义模型，使它们可以直接给出 Python 实验而不必再解释语言。

范围与重点：语言的基本使用（程序、值、控制流、函数、类、内置容器）；程序语义模型（求值、绑定、对象与共享状态、调用、作用域、迭代协议、异常与资源生命周期、属性查找）；数据表示与语言保证的边界；协作式异步的调度模型、异步迭代与异步上下文协议、取消与清理、超时与结构化任务生命周期。重点是把「能写出程序」推进到「能精确预测程序的行为」：对象、调用、迭代三条语义线占据模块主体，语法与标准库清单不进正文。验收标准是：给定一段陌生的 Python，读者能预测其状态变化、控制流与失败行为；不能预测时，知道该构造什么实验来验证。

排除并指定去处：线程、GIL 与共享内存归 `operating-systems`（线程是操作系统的执行模型，本模块只讲语言的协作式异步语义）；剖析与数据驱动的性能调查归 `software-engineering`；`venv`、依赖声明与锁文件归 `software-engineering`，本模块只说明依赖属于环境而不属于源码；异常层次与失败契约设计归 `software-engineering`，语言机制在本模块讲完；结构化并发在本模块讲创建关系、等待边与任务组作用域，以及取消、收尾和异常组的选择性处理，真实并发与 I/O 下的任务生命周期由 `operating-systems` 与 `networks` 重新连接。结构模式匹配（`match`）不进入本模块的入门路径：后续课程不使用它，需要时由首次使用它的模块引入。

深度：`python.basics` 以识别与正确使用为主（B）；`python.objects`、`functions`、`iteration` 覆盖语义、不变量与失败行为（C/D）；`python.data-model`、`representation`、`program`、`async` 以 C 级为主，个别主题到 D。

入门层：`python.basics` 是有意设置的 onboarding 层，面向完全没有 Python 经验的读者，必须自洽地提供足以阅读、修改和编写后续课程示例的工作语言。它的深度以 B 级为主，覆盖广度与示例密度高于普通 B 级主题。

验收标准（本层）：此前没有 Python 经验的读者完成 `python.basics` 后，应能独立阅读课程后续的普通 Python 示例，能编写几十行规模、使用函数、容器、类、模块、文件与异常处理的小程序；遇到更细的语义问题时，知道进入哪一节专题课。

| 子章节 | order | 课时 id | 标题 | 落盘 |
| --- | --- | --- | --- | --- |
| `python.basics` | 10 | `python.programs-and-expressions` | 求值、值与名称绑定 | ✓ |
| | 20 | `python.numbers-and-arithmetic` | 数值与算术 | ✓ |
| | 30 | `python.strings` | 字符串 | ✓ |
| | 40 | `python.conditionals` | 比较、布尔与条件 | ✓ |
| | 50 | `python.loops` | 循环 | ✓ |
| | 60 | `python.functions` | 函数 | ✓ |
| | 70 | `python.collections` | 列表、元组、字典与集合 | ✓ |
| | 80 | `python.classes` | 类与实例 | ✓ |
| | 90 | `python.modules-basics` | 模块、导入与文件 | ✓ |
| | 100 | `python.errors-basics` | 错误与异常处理 | ✓ |
| `python.objects` | 10 | `python.names-and-objects` | 对象、身份与别名 | ✓ |
| | 20 | `python.mutability-and-copy` | 可变性、原地更新与复制 | ✓ |
| | 30 | `python.equality-and-hashing` | 相等与哈希契约 | ✓ |
| `python.functions` | 10 | `python.call-semantics` | 调用与参数绑定 | ✓ |
| | 20 | `python.scope-and-closure` | 作用域与闭包 | ✓ |
| | 30 | `python.decorators` | 函数作为值与装饰器 | ✓ |
| `python.iteration` | 10 | `python.iteration-protocol` | iterable 与 iterator | ✓ |
| | 20 | `python.generators` | generator 与 `yield` | ✓ |
| | 30 | `python.exceptions` | 异常、传播与 `finally` | ✓ |
| | 40 | `python.context-managers` | 上下文管理器与资源生命周期 | ✓ |
| `python.data-model` | 10 | `python.attributes-and-descriptors` | 属性查找与方法绑定 | ✓ |
| | 20 | `python.dunder-protocols` | 特殊方法与协议 | ✓ |
| | 30 | `python.inheritance-and-mro` | 继承与 MRO | ✓ |
| `python.representation` | 10 | `python.numbers-and-floats` | 整数、浮点数与近似 | ✓ |
| | 20 | `python.text-and-bytes` | 文本、bytes 与编码 | ✓ |
| `python.program` | 10 | `python.runtime-vs-language` | 语言保证与实现细节 | ✓ |
| | 20 | `python.modules-and-imports` | 模块、包与导入边界 | ✓ |
| | 30 | `python.typing` | 类型标注与静态契约 | ✓ |
| `python.async` | 10 | `python.asyncio-scheduling` | coroutine、task 与调度 | ✓ |
| | 20 | `python.async-iteration-and-context` | 异步迭代与异步上下文 | ✓ |
| | 30 | `python.cancellation-and-timeouts` | 取消与清理 | ✓ |
| | 40 | `python.timeout-and-task-lifecycle` | 超时与结构化任务生命周期 | ✓ |

### 3.2 数据结构、算法与复杂度（`algorithms`，order 20）

定位：建立成本模型与表示选择的语言。目标不是算法清单，而是让读者能自己推导复杂度、构造反例、判断常数与局部性、在真实约束下选择结构。

范围与重点：主线是「契约与表示 → 成本与正确性 → 线性结构 → 关联结构 → 树与优先结构 → 查找 / 排序 / 选择 → 图 → 算法设计范式 → 综合选择」。`algorithms.complexity` 先建立后续各子章节复用的分析语言（抽象数据类型与表示不变量、输入规模与成本模型、渐进记号、正确性、递归、摊还、期望）。必答项，以及每节课由一个具体问题连续推进、框架只在新机制出现时重述的要求，见 `doc/CONTENT_GUIDE.md` 第 3.5 节。

排除并指定去处：冷门命名算法的实现、非教学必要的手写平衡树、排序算法展览（`heap sort` 之外再罗列 shell sort、cocktail sort 等）、排序常数因子对比表属于 A 级（查文档即可），不进正文；复杂性理论与不可近似不属于本模块，`algorithms.lower-bounds` 只做比较模型与决策树下界，NP 完全性与近似困难性如需讲授另设模块；profiling 与基准测试方法论归 `software-engineering`；缓存局部性背后的硬件与虚拟内存机制归 `operating-systems`；B 树、外部内存结构与查询计划在存储引擎中的形态归 `databases`；并发下的数据结构归 `operating-systems`。Python 只是实验语言，本模块不是 Python 容器教程，也不是面试题集。

深度：以 C/D 为主，推导与反例是主要材料。`sequences`、`maps`、`trees` 覆盖表示不变量、成本分类与失败情形；`ordering`、`graphs` 覆盖正确性论证与模型；`techniques` 把已见过的算法抽象成设计范式；`selection` 是跨模块的连接点。

本模块同时维护跨章节复用的术语层。正文只在首次重要出现处标注 `<Term>`，分工与标记判据见 `doc/CONTENT_GUIDE.md` 第 4 节。

| 子章节 | order | 课时 id | 标题 | 落盘 |
| --- | --- | --- | --- | --- |
| `algorithms.complexity` | 10 | `algorithms.abstractions-and-invariants` | 抽象数据类型、表示与不变量 | ✓ |
| | 20 | `algorithms.cost-model` | 输入规模与成本模型 | ✓ |
| | 30 | `algorithms.asymptotic-analysis` | 渐进记号与增长率 | ✓ |
| | 40 | `algorithms.correctness` | 正确性、循环不变量与终止 | ✓ |
| | 50 | `algorithms.recursion` | 递归、归纳与调用树 | ✓ |
| | 60 | `algorithms.amortized` | 摊还分析 | ✓ |
| | 70 | `algorithms.average-and-randomized` | 平均情形与随机化 | ✓ |
| `algorithms.sequences` | 10 | `algorithms.arrays-and-lists` | 数组、动态数组与局部性 | ✓ |
| | 20 | `algorithms.linked-structures` | 链表与指针结构 | ✓ |
| | 30 | `algorithms.stacks-and-queues` | 栈、队列与 deque | ✓ |
| | 40 | `algorithms.strings` | 字符串匹配与预处理 | ✓ |
| `algorithms.maps` | 10 | `algorithms.maps-and-sets` | 集合、映射与关联查询 | ✓ |
| | 20 | `algorithms.hash-tables` | 哈希表与关联映射 | ✓ |
| `algorithms.trees` | 10 | `algorithms.tree-representation` | 树、递归结构与遍历 | ✓ |
| | 20 | `algorithms.ordered-maps` | 二叉搜索树与有序映射 | ✓ |
| | 30 | `algorithms.heaps` | 优先队列与堆 | ✓ |
| `algorithms.ordering` | 10 | `algorithms.binary-search` | 二分查找与单调边界 | ✓ |
| | 20 | `algorithms.sorting` | 排序契约、稳定性与成本 | ✓ |
| | 30 | `algorithms.comparison-sorting` | 比较排序：分区、快速排序与堆排序 | ✓ |
| | 40 | `algorithms.selection-and-top-k` | 选择、第 k 个元素与 Top-K | ✓ |
| | 50 | `algorithms.lower-bounds` | 下界与比较模型 | ✓ |
| `algorithms.graphs` | 10 | `algorithms.graph-representation` | 图的表示与不变量 | ✓ |
| | 20 | `algorithms.graph-traversal` | 遍历、连通分量与访问不变量 | ✓ |
| | 30 | `algorithms.dags-and-topological-order` | DAG、拓扑序与环检测 | ✓ |
| | 40 | `algorithms.shortest-paths` | 最短路径与松弛 | ✓ |
| | 50 | `algorithms.dijkstra` | 非负权与 Dijkstra | ✓ |
| | 60 | `algorithms.bellman-ford` | 负边、Bellman–Ford 与负环 | ✓ |
| | 70 | `algorithms.union-find` | 并查集与增量连通性 | ✓ |
| | 80 | `algorithms.connectivity-and-spanning-trees` | 最小生成树 | ✓ |
| `algorithms.techniques` | 10 | `algorithms.divide-and-conquer` | 分治 | ✓ |
| | 20 | `algorithms.greedy` | 贪心与交换论证 | ✓ |
| | 30 | `algorithms.dynamic-programming` | 动态规划 | ✓ |
| | 40 | `algorithms.search-and-pruning` | 状态空间搜索与剪枝 | ✓ |
| | 50 | `algorithms.randomized-algorithms` | 随机化算法 | ✓ |
| `algorithms.selection` | 10 | `algorithms.choosing-structures` | 从操作工作负载选择数据结构 | ✓ |
| | 20 | `algorithms.complexity-in-practice` | 渐进之外：常数、局部性与内存 | ✓ |

### 3.3 操作系统（`operating-systems`，order 30）

定位：解释上层所有系统的运行时底座。内核边界、虚拟内存、调度、同步与 I/O 路径是数据库、分布式与安全模块反复依赖的机制。线程在本模块首次引入，实验载体是 Python 的 `threading`。

范围与重点：进程与线程、文件与描述符、管道与 socket、权限与信号；内核边界的代价；虚拟内存、地址转换与分页；调度与阻塞；同步原语、内存序、竞态与死锁；文件系统语义、缓冲与持久性；资源限额与背压；容器作为隔离机制。重点是机制与可观测证据的对应：每个概念都要落到能观察到的资源、延迟或错误上，而不是术语与命令的复述。系统调用号、冷门调度器参数与发行版管理命令属于 A 级。

深度：以 C/D 为主。

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

### 3.4 计算机网络（`networks`，order 40）

定位：协议行为与它的运维后果。重点在延迟的构成、可靠性机制的真实契约，以及超时与重试如何把传输层行为传播到应用层。

范围与重点：分层与分组交换；IP 编址与路由；TCP 与 UDP 的真实契约；延迟构成与尾延迟；DNS、HTTP 与缓存语义；TLS 的信任建立；连接生命周期与连接池；超时、重试与幂等的相互作用；排队与部分连通。重点是协议承诺与运维后果之间的距离：字节级头部记忆、端口号表与厂商 CLI 语法不进正文。

深度：以 C 级为主；TCP 行为、超时重试与延迟构成到 D。

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

### 3.5 数据库（`databases`，order 50）

定位：持久状态与并发的核心。本模块用 SQL 夹具做可执行实验，把关系语义、约束、索引与事务后果呈现为可观察的输出与查询计划。

范围与重点：关系模型与键、SQL 的包语义与三值逻辑、约束作为完整性规则、连接作为关系组合、变更语句与状态转移；B 树索引与访问路径、查询计划与基数估计、索引的写入代价；事务与日志、隔离级别、MVCC 与锁、崩溃恢复；热点键、在线模式变更与 ORM 边界。重点是「声明式语句与它实际触发的执行之间的距离」：同一查询在不同计划下的成本差异是本模块的核心模型。完整 SQL 语法、厂商管理命令与 ORM 方法清单属于 A 级。

排除并指定去处：分布式数据系统的一致性权衡归 `distributed-systems`；持久性的文件系统机制归 `operating-systems`。

深度：以 C/D 为主。

夹具计划：`sql.orders.basic` 覆盖关系语义、`NULL`、聚合、连接与约束；索引与查询计划需要更大的夹具（更多行与多个索引），在写 `db.storage` 批次时新增；事务与隔离需要能并发访问的夹具，按同一模式扩展。

现有六个课时的正文质量尚未达标，计划整体重写；结构位置与 `id` 保留。

| 子章节 | order | 课时 id | 标题 | 落盘 |
| --- | --- | --- | --- | --- |
| `db.relational` | 10 | `db.relational-model` | 关系、键与完整性 | 草稿（待重写） |
| | 20 | `db.sql.null-semantics` | NULL 与三值逻辑 | 草稿（待重写） |
| | 30 | `db.sql.aggregation` | 分组与聚合 | 草稿（待重写） |
| | 40 | `db.sql.joins` | 连接是关系组合 | 草稿（待重写） |
| | 50 | `db.sql.subqueries` | 子查询、CTE 与求值 | 草稿（待重写） |
| | 60 | `db.sql.mutations` | 变更语句与状态转移 | 草稿（待重写） |
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

### 3.6 软件工程、Git 与测试（`software-engineering`，order 60）

定位：变更与验证的方法论。前面所有模块讲系统如何工作，本模块讲如何安全地改动它们，以及什么证据能支持「改动正确」这一结论。

范围与重点：仓库工作流与 Git 对象模型；接口与信息隐藏、耦合与依赖方向；兼容、弃用与迁移；测试判据设计、确定性与隔离、基于属性与不变量的测试；依赖与可复现构建；CI 作为验证管道；可观测性作为设计；从证据调试与评审生成代码。重点是「什么证据支持改动正确」这一条线索，而不是工具用法：每个 Git 参数的含义与断言 API 清单属于 A 级。性能剖析与优化在本模块展开，它需要算法模块的成本模型与操作系统模块的 I/O 知识在前。

深度：`swe.testing` 与 `swe.debugging` 到 D，其余以 C 为主。

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

### 3.7 系统设计与分布式系统（`distributed-systems`，order 70）

定位：部分失败下的推理。与单机系统的差别在于失败模型、时间假设与状态所有权，因此从失败模型与时钟开始，再进入复制、一致性与容量。

范围与重点：失败模型与部分失败；时钟、顺序与超时；复制与一致性模型；quorum 与读写交集；分片与再平衡；幂等与投递语义；背压与容量估算；缓存、队列与状态所有权；恢复与对账。重点是从失败模型出发推导系统行为，而不是罗列产品与架构模式。

排除并指定去处：单机并发原语归 `operating-systems`；持久化与事务语义归 `databases`。

深度：以 C/D 为主；一致性模型、投递语义与容量估算到 D。

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

### 3.8 安全（`security`，order 80）

定位：对抗性场景下的系统推理。从资产、对手与信任边界开始，把前七个模块的机制放进威胁模型，再讨论密码学与 Web 与供应链的具体控制。

范围与重点：威胁建模与信任边界；认证、授权与会话；口令与密钥的生命周期；TLS 与哈希的正确使用；注入与解析歧义；XSS、CSRF 与源模型；沙箱与隔离；依赖与供应链；审计与隐私的取舍。重点是先建威胁模型再谈控制，以及识别「已加密」「已签名」这类表述并不等于所需性质。不理解机制就背漏洞缩写、没有威胁模型的检查表、密码学参数表属于 A 级。

深度：以 C/D 为主；威胁建模、授权不变量与解析歧义到 D。

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

## 4. 写作批次

批次按模块顺序推进，模块内按子章节顺序推进，一个子章节为一个批次。模块结构本身可以作为单独批次先行：只改本文件、`doc/CONTENT_GUIDE.md` 与 `_section.yaml`，不动正文。批次落盘后的验证口径见 `AGENTS.md` 与 `doc/CONTENT_GUIDE.md` 第 3.3 节。

| 批次 | 范围 | 状态 |
| --- | --- | --- |
| 1 | `python`：整模块（basics onboarding 层，objects / functions / iteration，data-model / representation / program / async） | 已发布 |
| 2 | `algorithms`：整模块（complexity / sequences / maps / trees / ordering / graphs / techniques / selection） | 已发布 |
| 3 | `os.processes`、`os.memory` | |
| 4 | `os.concurrency`、`os.io`、`os.resources` | |
| 5 | `net.foundations`、`net.transport` | |
| 6 | `net.application`、`net.operations` | |
| 7 | `db.relational`、`db.schema`（先重写现有六节） | |
| 8 | `db.storage`（含新夹具） | |
| 9 | `db.transactions`、`db.operations` | |
| 10 | `swe.git`、`swe.design` | |
| 11 | `swe.testing`、`swe.delivery`、`swe.debugging` | |
| 12 | `dist.foundations`、`dist.communication` | |
| 13 | `dist.data`、`dist.architecture`、`dist.operations` | |
| 14 | `sec.foundations`、`sec.crypto`、`sec.web`、`sec.systems` | |

状态列只登记已经冻结或已经发布的批次；未标注的批次尚未落盘，其课时在各模块的落盘列中为 `—`。

「冻结」与「发布」是两件正交的事，各有各的载体：

| 状态 | 含义 | 载体 |
| --- | --- | --- |
| 冻结 | 内容治理状态：已过逐段评审，除事实错误、前置缺口与跨章节接口问题外不再主动扩写 | 本文件的「落盘」列 |
| 发布 | 部署状态：生产静态站是否为该课生成路由 | 课时 frontmatter 的 `status`（`draft` 与 `review` 只在 dev 的 `includeUnpublished` 下可见，生产路由只接受 `published`） |

发布以模块为单位，用一个独立的发布提交一次性完成：批量把该模块课时的 `status` 改为 `published`，同时把本文件的批次行改为已发布，确认课程路由数量按预期增加，并核对已发布课时的 `CrossRef` 不指向生产环境不可见的课时。子章节 `_section.yaml` 的 `status: active` 与课时的 `LessonStatus` 是两套枚举。

跨批次的 `CrossRef` 只要求目标 `id` 已登记且稳定，不要求目标课时已经冻结，因此冻结顺序可以晚于引用它的课时。

## 5. 维护

- 新增课时：先在本文件登记 `id` 与标题，再落盘；落盘后若与计划不一致，改本文件，不留下两份互相矛盾的大纲。
- 拆分课时：新课时取新 `id`，旧 `id` 保留给拆分后覆盖原有范围的那一节。
- 删除课时：先清引用（`<CrossRef>`、术语与示例的使用），再删文件与可能空掉的章节。
- 调整模块或子章节顺序：改本文件与对应 `_section.yaml` 的 `order`，两者必须一致。
- 已冻结的模块（见批次表）：只在后续课程暴露前置缺口或发现事实错误时回来修改，不主动增加主题；改动仍走上面的登记流程，并同时改 `doc/CONTENT_GUIDE.md` 中与之相关的写作规则。
- 尚未落盘的子章节只登记在本文件；它的 `_section.yaml`、`summary` 与第一节内容一起落盘，不预先建目录，否则验证器会报 `empty-section`。因此本文件的树会暂时领先于磁盘，这是有意为之，不是不一致。
