# CURRICULUM.md

本文件是课程地图：模块顺序、每个模块的教学范围、课时树与实际完成状态。

`content/` 中实际存在的章节与课时是权威内容，本文件记录结构、边界与进度。写作方法（读者假设、内容分级、论证与示例规则、风格）见 `doc/CONTENT_GUIDE.md`；产品与运行时实现见 `doc/DESIGN.md`；仓库级不变量与验证要求见 `AGENTS.md`。

## 1. 结构约定

| 约定 | 内容 |
| --- | --- |
| 模块 | 目录名与模块 `id` 一致，如 `python`、`algorithms`；模块 `order` 取 10 的倍数 |
| 子章节 | 模块下的目录；其 `_section.yaml` 只提供子章节的 `id`、`label`、`order`、`summary`，不提供页面（见 `doc/DESIGN.md` 第 5 节） |
| 课时 id | `<模块>.<主题>`，全小写点分隔，需要区分同名的不同子章节时才加入子章节段（如 `db.sql.joins`）；唯一性与稳定性规则见 `doc/DESIGN.md` 第 5.3 节 |
| slug | 扁平形式 `/python/mutability-and-copy`，不体现子章节层级 |
| order | 同级唯一，取 10 的倍数 |
| 状态 | 本文件的课时表给出每个课时的落盘与发布状态；作者流程与可见性规则见 `doc/CONTENT_GUIDE.md` 第 3.3 节 |
| 落盘 | 章节与它的课时同一批次落盘，避免空章节 |

课时的内容要求（可执行单元格、术语与引用标记）由 `doc/CONTENT_GUIDE.md` 规定，本文件不重复。

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

状态列：`✓` 已发布，`草稿` 已落盘但不进入站点，`—` 计划中。

### 3.1 Python 语言（`python`，order 10）

定位：课程的编程基础与唯一的在线实验载体。本模块建立后续模块反复使用的程序语义模型，使它们可以直接给出 Python 实验而不必再解释语言。

范围与重点：语言的基本使用（程序、值、控制流、函数、类、内置容器）；程序语义模型（求值、绑定、对象与共享状态、调用、作用域、迭代协议、异常与资源生命周期、属性查找）；数据表示与语言保证的边界；协作式异步的调度模型、异步迭代与异步上下文协议、取消与清理、超时与结构化任务生命周期。重点是把「能写出程序」推进到「能精确预测程序的行为」：对象、调用、迭代三条语义线占据模块主体，语法与标准库清单不进正文。验收标准是：给定一段陌生的 Python，读者能预测其状态变化、控制流与失败行为；不能预测时，知道该构造什么实验来验证。

排除并指定去处：线程、GIL 与共享内存归 `operating-systems`（线程是操作系统的执行模型，本模块只讲语言的协作式异步语义）；剖析与数据驱动的性能调查归 `software-engineering`，它需要成本模型与 I/O 知识在前；`venv`、依赖声明与锁文件归 `software-engineering`，本模块只说明依赖属于环境而不属于源码；异常层次与失败契约设计归 `software-engineering`，语言机制在本模块讲完；结构化并发在本模块讲创建关系、等待边与任务组作用域，以及取消、收尾和异常组的选择性处理，真实并发与 I/O 下的任务生命周期由 `operating-systems` 与 `networks` 重新连接。结构模式匹配（`match`）不进入本模块的入门路径：后续课程不使用它，需要时由首次使用它的模块引入。

深度：`python.basics` 以识别与正确使用为主（B）；`python.objects`、`functions`、`iteration` 覆盖语义、不变量与失败行为（C/D）；`python.data-model`、`representation`、`program`、`async` 以 C 级为主，个别主题到 D。

入门层：`python.basics` 是有意设置的 onboarding 层，面向完全没有 Python 经验的读者，必须自洽地提供足以阅读、修改和编写后续课程示例的工作语言。它的知识深度以 B 级为主，但覆盖广度与示例密度可以高于普通 B 级主题。收录判据是该操作是否频繁出现在后续课程的示例中，而不是它能否查文档：`strip`/`split`/`join`、`append`/`sort`/`get`/`items`、推导式、`enumerate`/`zip` 这一级的内容即使属于 Working Knowledge 也在本层教一次。不得因为相关机制会在后续专题课中深入解释，就删掉第一次使用时所需的基本规则；后续专题课（`python.call-semantics`、`python.mutability-and-copy`、`python.equality-and-hashing` 等）拥有完整语义模型，与本层的关系是先建立可工作的第一层规则，再由专题课建立完整模型。删除判据是删掉之后零经验的读者还能否顺畅读后续代码，新增判据是不学它会不会妨碍后续普通代码。

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

定位：建立成本模型与表示选择的语言。目标不是算法清单，而是让读者能自己推导复杂度、判断常数与局部性、在真实约束下选择结构。

范围与重点：操作成本模型与输入规模的度量；`O`、`Ω`、`Θ` 与最坏、平均、摊还三种情形的区分；抽象契约与具体表示的分离；线性结构、映射、堆、树、图的表示不变量与操作成本；排序与查找族；分治、贪心、动态规划等技术的正确性论证；在内存与局部性约束下选择结构。重点是用「表示决定成本」这一条线索贯穿全部结构：每个复杂度的论断都带上成本模型、输入规模与它属于哪一类情形。

每种结构必须回答：它表示什么抽象关系、representation invariant 是什么、支持哪些操作、成本结论采用什么成本模型、属于最坏还是平均或摊还、内存占用与局部性如何、哪些约束改变选择、Python 内置结构与理论模型的差异。Python 只是实验语言，本模块不是 Python 容器教程，也不是面试题集。

排除并指定去处：冷门命名算法的实现、非教学必要的手写平衡树、排序常数因子对比表属于 A 级（查文档即可）；并发下的数据结构归 `operating-systems`；查询计划与 B 树在存储引擎中的形态归 `databases`。

深度：`algorithms.complexity`、`algorithms.sequences`、`algorithms.maps` 以 C/D 为主（推导与反例）；`graphs`、`techniques` 覆盖模型与正确性论证；`selection` 是跨模块的连接点。

| 子章节 | order | 课时 id | 标题 | 落盘 |
| --- | --- | --- | --- | --- |
| `algorithms.complexity` | 10 | `algorithms.cost-model` | 操作成本与渐进记号 | 草稿 |
| | 20 | `algorithms.amortized` | 摊还分析 | 草稿 |
| | 30 | `algorithms.average-and-randomized` | 平均情形与随机化 | 草稿 |
| | 40 | `algorithms.lower-bounds` | 下界与不可近似 | — |
| `algorithms.sequences` | 10 | `algorithms.arrays-and-lists` | 数组、动态数组与局部性 | 草稿 |
| | 20 | `algorithms.stacks-and-queues` | 栈、队列与 deque | 草稿 |
| | 30 | `algorithms.linked-structures` | 链表与指针结构 | 草稿 |
| | 40 | `algorithms.strings` | 字符串搜索与表示 | — |
| `algorithms.maps` | 10 | `algorithms.hash-tables` | 哈希表与关联映射 | 草稿 |
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

现有六个课时的正文质量尚未达标，计划整体重写；结构位置（关系模型 → SQL 语义 → 模式 → 存储与索引 → 事务 → 运维）与 `id` 保留。

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

批次按模块顺序推进，模块内按子章节顺序推进。一个子章节为一个批次：落盘后运行 `npm run check`，再在开发服务器下实机运行该批次的可执行单元格。

| 批次 | 范围 | 状态 |
| --- | --- | --- |
| 1 | `python.basics` 精度修订（9 节正文） | 完成 |
| 2 | `python.classes`、`python.modules-basics`、`python.errors-basics` | 完成 |
| 3 | `python.objects`：对象与共享状态的三节课 | 完成 |
| 4 | `python.functions`：调用语义、作用域与闭包、装饰器 | 完成 |
| 5 | `python.iteration`：迭代协议、generator、异常、上下文管理器 | 完成 |
| 6 | `python.data-model`：属性查找、特殊方法、继承与 MRO | 完成 |
| 7 | `python.representation`：数值与浮点、文本与 bytes | 完成 |
| 8 | `python.program`：语言保证与实现细节、导入边界、类型标注 | 完成 |
| 9 | `python.async`：coroutine 与调度、异步迭代与上下文、取消与清理、超时与任务生命周期 | 完成 |
| 10 | `python` 全章语义审校、工作集补全与大纲冻结 | 完成 |
| 11 | `algorithms.complexity`、`algorithms.sequences` | 已落盘待审核（`lower-bounds`、`strings` 待写） |
| 12 | `algorithms.maps`：哈希表、有序映射、堆 | `hash-tables` 已落盘；其余计划 |
| 13 | `algorithms.graphs` | 计划 |
| 14 | `algorithms.techniques`、`algorithms.selection` | 计划 |
| 15 | `os.processes`、`os.memory` | 计划 |
| 16 | `os.concurrency`、`os.io`、`os.resources` | 计划 |
| 17 | `net.foundations`、`net.transport` | 计划 |
| 18 | `net.application`、`net.operations` | 计划 |
| 19 | `db.relational`、`db.schema` | 计划（先重写现有六节） |
| 20 | `db.storage`（含新夹具） | 计划 |
| 21 | `db.transactions`、`db.operations` | 计划 |
| 22 | `swe.git`、`swe.design` | 计划 |
| 23 | `swe.testing`、`swe.delivery`、`swe.debugging` | 计划 |
| 24 | `dist.foundations`、`dist.communication` | 计划 |
| 25 | `dist.data`、`dist.architecture`、`dist.operations` | 计划 |
| 26 | `sec.foundations`、`sec.crypto`、`sec.web`、`sec.systems` | 计划 |

「已落盘待审核」表示课时已按 `draft` 落盘、全部可执行单元格已在本地运行，等待逐节通读后改为 `published`。

## 5. 维护

- 新增课时：先在本文件登记 `id` 与标题，再落盘；落盘后若与计划不一致，改本文件，不留下两份互相矛盾的大纲。
- 拆分课时：新课时取新 `id`，旧 `id` 保留给拆分后覆盖原有范围的那一节。
- 删除课时：先清引用（`<CrossRef>`、术语与示例的使用），再删文件与可能空掉的章节。
- 调整模块或子章节顺序：改本文件与对应 `_section.yaml` 的 `order`，两者必须一致。
