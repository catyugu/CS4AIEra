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

状态列：`✓` 已发布；`已冻结` 已过逐段评审但尚未发布；`草稿` 已落盘待评审；`—` 计划中。

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

定位：建立成本模型与表示选择的语言。目标不是算法清单，而是让读者能自己推导复杂度、构造反例、判断常数与局部性、在真实约束下选择结构。

范围与重点：主线是「契约与表示 → 成本与正确性 → 线性结构 → 关联结构 → 树与优先结构 → 查找 / 排序 / 选择 → 图 → 算法设计范式 → 综合选择」。`algorithms.complexity` 先建立分析语言（抽象数据类型与表示不变量、输入规模与成本模型、渐进记号、正确性、递归、摊还、期望），其余子章节的每一节课都复用这套语言，不再重复解释。全模块统一的分析框架是：抽象契约 → 表示 → 表示不变量 → 操作 → 不变量保持的论证 → 成本。每节课的必答项与实验优先级见 `doc/CONTENT_GUIDE.md` 第 3.5 节。

排除并指定去处：冷门命名算法的实现、非教学必要的手写平衡树、排序算法展览（`heap sort` 之外再罗列 shell sort、cocktail sort 等）、排序常数因子对比表属于 A 级（查文档即可），不进正文；复杂性理论与不可近似不属于本模块，`algorithms.lower-bounds` 只做比较模型与决策树下界，NP 完全性与近似困难性如需讲授另设模块；profiling 与基准测试方法论归 `software-engineering`；缓存局部性背后的硬件与虚拟内存机制归 `operating-systems`；B 树、外部内存结构与查询计划在存储引擎中的形态归 `databases`；并发下的数据结构归 `operating-systems`。Python 只是实验语言，本模块不是 Python 容器教程，也不是面试题集。

深度：以 C/D 为主，推导与反例是主要材料。`algorithms.complexity` 建立分析语言；`sequences`、`maps`、`trees` 覆盖表示不变量、成本分类与失败情形；`ordering`、`graphs` 覆盖正确性论证与模型；`techniques` 把已见过的算法抽象成设计范式；`selection` 是跨模块的连接点。

| 子章节 | order | 课时 id | 标题 | 落盘 |
| --- | --- | --- | --- | --- |
| `algorithms.complexity` | 10 | `algorithms.abstractions-and-invariants` | 抽象数据类型、表示与不变量 | 已冻结 |
| | 20 | `algorithms.cost-model` | 输入规模与成本模型 | 已冻结 |
| | 30 | `algorithms.asymptotic-analysis` | 渐进记号与增长率 | 已冻结 |
| | 40 | `algorithms.correctness` | 正确性、循环不变量与终止 | 已冻结 |
| | 50 | `algorithms.recursion` | 递归、归纳与调用树 | 已冻结 |
| | 60 | `algorithms.amortized` | 摊还分析 | 已冻结 |
| | 70 | `algorithms.average-and-randomized` | 平均情形与随机化 | 已冻结 |
| `algorithms.sequences` | 10 | `algorithms.arrays-and-lists` | 数组、动态数组与局部性 | 已冻结 |
| | 20 | `algorithms.linked-structures` | 链表与指针结构 | 草稿 |
| | 30 | `algorithms.stacks-and-queues` | 栈、队列与 deque | 草稿 |
| | 40 | `algorithms.strings` | 字符串匹配与预处理 | 草稿 |
| `algorithms.maps` | 10 | `algorithms.maps-and-sets` | 集合、映射与关联查询 | 已冻结 |
| | 20 | `algorithms.hash-tables` | 哈希表与关联映射 | 已冻结 |
| `algorithms.trees` | 10 | `algorithms.tree-representation` | 树、递归结构与遍历 | 已冻结 |
| | 20 | `algorithms.ordered-maps` | 二叉搜索树与有序映射 | 已冻结 |
| | 30 | `algorithms.heaps` | 优先队列与堆 | 已冻结 |
| `algorithms.ordering` | 10 | `algorithms.binary-search` | 二分查找与单调边界 | 已冻结 |
| | 20 | `algorithms.sorting` | 排序契约、稳定性与成本 | 已冻结 |
| | 30 | `algorithms.comparison-sorting` | 比较排序：分区、快速排序与堆排序 | 已冻结 |
| | 40 | `algorithms.selection-and-top-k` | 选择、第 k 个元素与 Top-K | 已冻结 |
| | 50 | `algorithms.lower-bounds` | 下界与比较模型 | 已冻结 |
| `algorithms.graphs` | 10 | `algorithms.graph-representation` | 图的表示与不变量 | 已冻结 |
| | 20 | `algorithms.graph-traversal` | 遍历、连通分量与访问不变量 | 已冻结 |
| | 30 | `algorithms.dags-and-topological-order` | DAG、拓扑序与环检测 | 已冻结 |
| | 40 | `algorithms.shortest-paths` | 最短路径：单位权、非负权与负边 | 已冻结 |
| | 50 | `algorithms.connectivity-and-spanning-trees` | 连通性、并查集与最小生成树 | 已冻结 |

评审给 `connectivity-and-spanning-trees` 定的边界与硬条件（batch 8）：顺序为静态连通性回顾 → 并查集 → 生成树/森林 → MST 目标 → cut safe-edge 引理 → Kruskal → Prim 短对照 → 断开图与最小生成森林；明确切回有限简单无向图；Kruskal 的边列表必须让每条无向边只出现一次（不能把 $2|E|$ 个邻接项当 $|E|$ 条边排序）；并查集的抽象状态是「一个划分」，parent/rank/size 只是表示，契约写成 $find(u)=find(v) \iff u,v$ 在 $(V,E_i)$ 中连通；能力边界要说清（支持边的加入、不支持一般删除、不给实际路径、不是有向可达或 SCC）；复杂度写摊还 $O(n+m)\alpha(n)$，不写成每次常数；闭合森林边数公式 $|E|=|V|-c$；输入契约取「非空连通无向图」，单点图有唯一 0 边生成树、断开图给最小生成森林、空图不卷入争论；MST 允许任意实数权重（含负边，与 shortest-path tree 的目标不同，用三角形 $w(s,a)=2,w(s,b)=2,w(a,b)=1$ 强制区分）；正确性走 cut safe-edge 引理的 exchange 证明，Kruskal 维护三条不变量（已接受边无环、划分等于 $(V,F)$ 的连通分量、始终存在某个最小生成森林包含 $F$，连通图是 $c = 1$ 的特例）；输出只承诺「返回一棵 MST」；Prim 的 key 分两层——$key[v]$ 是从当前树到该顶点的最轻边，只有 extract-min 选中者的父边才是跨整个 cut 的 light edge——两者都不是路径总权重，lazy heap 复用 $(key, serial, vertex)$；断开图由 Kruskal 自然返回森林而不是中途失败；复杂度把排序与 DSU 分开写；oracle 与生产算法独立（枚举 $\binom{|E|}{|V|-1}$ 个候选边集的组合爆炸对照），测试覆盖负边、等权多解（用两种输入顺序得到两棵边集不同、总权相同的最小生成树）、单点图、断开图、孤立点；Prim 与 Kruskal 在主图上比较的是 canonical 无向边集（同一集合、构造顺序不同），不要用列表顺序冒充边集差异；明确排除强连通分量、一般动态删边连通性、有向 arborescence、最小割/最大流、Steiner tree、second-best MST、动态 MST、Borůvka。

「落盘」列记录评审状态：`—` 表示尚未落盘，`草稿` 表示已落盘待审校，`已冻结` 表示已过评审且在本批次内冻结。跨批次的 CrossRef 只要求目标 ID 已登记且稳定，不要求上游课时已经冻结。
| `algorithms.techniques` | 10 | `algorithms.divide-and-conquer` | 分治 | 已冻结 |
| | 20 | `algorithms.greedy` | 贪心与交换论证 | — |
| | 30 | `algorithms.dynamic-programming` | 动态规划 | — |
| | 40 | `algorithms.search-and-pruning` | 状态空间搜索与剪枝 | — |
| | 50 | `algorithms.randomized-algorithms` | 随机化算法 | — |
| `algorithms.selection` | 10 | `algorithms.choosing-structures` | 从操作工作负载选择数据结构 | — |
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

批次按模块顺序推进；模块内一般按子章节顺序推进，一个子章节为一个批次。落盘后运行 `npm run check`，再在开发服务器下实机运行该批次的可执行单元格。模块结构本身可以作为单独批次先行：算法模块的批次 A 只改文档与 `_section.yaml`，不动正文。

| 批次 | 范围 | 状态 |
| --- | --- | --- |
| 1 | `python`：整模块完成并冻结（basics onboarding 层，objects / functions / iteration，data-model / representation / program / async） | 完成 |
| 2 | 算法 A：确定模块结构（本文件、`doc/CONTENT_GUIDE.md`、`_section.yaml`） | 完成 |
| 3 | 算法 B：`complexity` —— 补抽象与不变量、渐进记号、正确性、递归，重构已落盘的三节 | 进行中（七节均已草稿落盘：`abstractions-and-invariants`、`cost-model`、`asymptotic-analysis`、`correctness`、`recursion`、`amortized`、`average-and-randomized`。逐节评审按 order 推进：`abstractions-and-invariants`、`cost-model`、`asymptotic-analysis`、`correctness`、`recursion`、`amortized` 已过评审并**已冻结**，70 `average-and-randomized` 收缩后也已冻结——`complexity` 七课（order 10–70）全部冻结，可视为完成。已冻结的口径：成本模型只含操作与单价，规模度量与量化方式另行固定；最坏/平均/摊还不是互斥分类，摊还用 $F(m)/m$ 定义且不假设分布；$\Theta$ 是紧确的渐进界而不是精确值，多参数界定义在合法参数域上并要求 $n_1 + \cdots + n_k \ge N$ 统一成立，$f + g = \Theta(\max\{f, g\})$ 只在 $f = O(g)$ 时才化简为 $\Theta(g)$；摊还的对象是合法操作序列 $\sigma$，$T(\sigma)/m$ 只是该序列的实际平均成本，摊还收费由论证构造且不唯一，界必须覆盖任意合法前缀，势能法要求所有可达状态满足 $\Phi_k \ge \Phi_0$，确定性摊还与期望分析是两个独立维度；正确性的规约是状态关系（前置条件约束初始状态，后置条件可关联初始状态、最终状态与结果，异常也是一种可规定的结果），部分正确与终止在同一前置条件下分开论证，循环证明模板固定为 $\{P\}\ S_{\text{init}}\ \{I\}$、$\{I \wedge B\}\ S_{\text{body}}\ \{I\}$、$I \wedge \neg B \Rightarrow Q$（Hoare 三元组只保证部分正确、不含终止），终止用每轮严格下降的良基度量（「严格递减 + 有下界」不成立）；递归先证部分正确（归纳假设只说「子调用一旦返回」）再独立证终止，递归调用要求所选良基秩严格下降而不是输入尺寸变小，终止接口是「调用自身的非递归工作终止 + 子调用保持前置条件 + 每条递归边的良基秩严格下降」，候选度量不下降只说明该度量不足以完成证明；`RecursionError` 属运行时资源限制，与算法终止性分层；调用树直接给出总成本与递归栈空间，其余辅助空间（备忘表、存活容器、切片、frontier）另行计算，显式栈只在逐帧模拟递归时才与递归深度同阶。其余一节待审。评审口径：`average-and-randomized` 要**实质收缩**为「概率与期望的分析语言」（随机变量、期望、线性性、运行时间作为随机变量、输入分布 vs 算法随机性），Las Vegas/Monte Carlo、概率放大与具体随机算法移入 `techniques/randomized-algorithms`，不是保留原文再加一句 CrossRef。收缩已执行：本课从约 13.0k 字符降到 4.4k，删去随机化快速排序、全域哈希、Monte Carlo 三个单元格与「随机化拿掉对手的杠杆」「哈希函数的随机化」「期望之外：错误概率与重复」三节，改以「两种随机性来源」（量词位置、适应性对手的条件）+「随机变量与期望」（指示器、线性性不需要独立性，新增相关指示器单元格）+「平均情形要先写分布」（保留线性查找单元格）+「运行时间是随机变量」（期望界不约束单次运行、样本均值只是估计、期望与摊还分开陈述）组织，原三节内容留给 `techniques/randomized-algorithms`。冻结口径：平均情形固定规模并用分布族 $D_n$ 定义 $C_{\text{avg}}(n) = E_{X \sim D_n}[C(X)]$，随机化一侧对固定输入取算法随机位上的期望 $E_R[C(x, R)]$，「对每个输入成立」必须写成显式统一量词（$\exists c > 0, n_0, \forall x: \lvert x \rvert \ge n_0 \Rightarrow E_R[C(x, R)] \le c \cdot f(\lvert x \rvert)$，隐藏常数不许依赖 $x$）而不是 $\forall x, E_R[\cdot] = O(\cdot)$；期望的线性性对期望有限的随机变量恒成立、不是独立性的推论，独立性只在概率之积分解或以独立性为前提的概率界处才需要，零协方差不必由独立性推出；线性查找两种分布给出不同**精确**期望而渐进量级同为 $\Theta(n)$，分布改变量级的例子是 $\Theta(1)$ 与 $\Theta(n)$；「期望界不提供确定性的单次运行保证」与「高概率保证需另证尾概率界」分开，与摊还界 ≠ 硬延迟界平行；样本均值方差 $\sigma^2/m$ 但样本均值始终是估计。这课给 `techniques/randomized-algorithms` 留下四个出口：$D_n$ 上的平均情形、固定输入上对随机位取期望、期望的线性性、期望保证与高概率保证的区别，该课不再重复铺设基础概率分析语言） |
| 4 | 算法 C：`sequences` —— 审核已落盘三节的顺序与所有权，新写 `strings` | 进行中（四节均已草稿落盘，顺序经评审确认不动；`strings` 已过评审并按六处修正改定；`arrays-and-lists` 已按 `complexity` 冻结口径审校并**已冻结**：抽象 sequence 先定义抽象状态（有限序列 $S$，元素来自定义了相等关系的域）再列操作契约，非法下标的调用明确写成「不在契约范围内、本契约不规定其结果」（Python `list` 的负索引与 `insert` 截断属于具体类型自己的语义，不写成本课的契约规定），相等关系属于契约层而「一次相等判定的成本」属于成本模型（只能说「最多 $n$ 次相等比较」）；成本一律带模型限定——下标访问在固定宽度槽位 + 单位成本地址访问下是 $\Theta(1)$，`insert(i)` 移动 $n - i$ 个已有元素、总成本 $\Theta(n - i + 1)$，`delete(i)` 总成本 $\Theta(n - i)$（合法删除 $n - i \ge 1$），头部 $\Theta(n)$、靠近尾部 $\Theta(1)$、按位置取最坏才是 $\Theta(n)$，头删 $m$ 次是 $\Theta(nm)$（$n$ 初始长度、$1 \le m \le n$）；几何扩容只对「固定常数增长因子 $g > 1$ 的模型」断言 $O(\log n)$ 次扩容与 $\Theta(n)$ 总复制，空闲比例按确定性峰值陈述；`sys.getsizeof` 的证据只支持「容量不是每次追加都增长」，按比例 over-allocation 归实现事实，容器字节数还取决于已分配容量与增长历史（同长度不同历史的两个列表实测不同）；局部性只推出布局性质（间接寻址、通常更弱的空间局部性），不推出 Python 层 wall-clock 性能）；`linked-structures`、`stacks-and-queues` 待按同一框架审校） |
| 5 | 算法 D：`maps`、`trees` —— 先写集合与映射契约，再审核 `hash-tables`；新写树、有序映射、堆 | 完成（`maps` 两节与 `trees` 三节均已通过评审并冻结，接口链已闭合） |
| 6 | 算法 E：`ordering` —— 二分查找、排序契约、n log n 排序、选择与 Top-K、下界 | **完成**（`ordering` 五节全部过评审并冻结：`binary-search`、`sorting`、`comparison-sorting`、`selection-and-top-k`、`lower-bounds`；冻结前的接口闭合检查已做——CrossRef 目标、$r$ / $k$ 用词、四条成本轴口径、`_section.yaml` 的 summary 均已统一。`sorting.mdx` 有一处 CrossRef 指向 `algorithms.cost-model`（批次 B，仍为草稿），按「目标 ID 稳定即可依赖」的口径接受） |
| 7 | 算法 F：`graphs` —— 表示、遍历、DAG 与拓扑序、最短路、连通性与最小生成树 | **完成**（五课全部过评审并冻结：`graph-representation`（含 edge list 接口）、`graph-traversal`、`dags-and-topological-order`、`shortest-paths`、`connectivity-and-spanning-trees`。冻结前的接口与口径检查已做：表示层锁死 $G=(V,E,w)$、显式顶点集合、三种表示与三个操作成本、简单图默认（无平行边/无自环）、$|V|$/$|E|$ 口径；遍历层锁死三态访问机语义（discovered = 已发现但邻接扫描未完成；finished = 扫描完成）与「发现时标记」，迭代 DFS 用显式栈帧与递归同序；DAG 层把环的定义收紧到简单有向环，判环要求 DFS 覆盖整个 $V$，Kahn 只承诺拓扑前缀；最短路层统一三值 $\delta(s,v)$（下确界定义 + 分类定理）、predecessor 只作见证（存在性不变量）、Dijkstra settle 不变量指明非负条件用在后缀、Bellman–Ford 双向判据与逐顶点 $-\infty$ 闭包、heapq 用 $(key, serial, vertex)$；连通性层把并查集写成「划分 + 充要契约 $find(u)=find(v) \iff$ 连通」，统一到最小生成森林契约，Prim 的 key 分两层。跨课依赖：weight 属于边（表示）→ 遍历不读权重（遍历）→ 三色 DFS（DAG）→ 非负权前置（最短路）→ 无向切回 + 并查集（连通性）。`sorting.mdx` 指向 `algorithms.cost-model` 的 CrossRef 仍按「目标 ID 稳定即可依赖」的口径接受。五课 frontmatter 保持 `status: draft`，发布留到 `algorithms` 整模块通过 module-level release gate 后统一进行） |
| 8 | 算法 G：`techniques` —— 分治、贪心、动态规划、状态空间搜索、随机化 | 进行中（已建 `techniques` 子章节；`divide-and-conquer` 已落盘、经四轮评审落地并**已冻结**（正文口径：分治骨架只要求良基度量严格下降，$f(n)$ 是本层全部非递归工作，主定理含基本情形与正则条件方向，终止与深度分两层，Fibonacci 用 $C(n)+1$ 的移位形式），其余四节待写。边界已定：`greedy` 以「每次贪心选择后仍存在与之兼容的最优解」为主不变量，交换论证作为保持该不变量、并保留 0/1 背包按价值密度贪心失败的反例，拟阵最多作旁注不展开 basis/rank/intersection；`dynamic-programming` 按「有限状态递推 + 状态复用」定义，完整写 LCS 与 0/1 背包、编辑距离作同一套二维前缀状态的短对照、区间 DP 只示范按区间长度的拓扑顺序，明确 $O(nW)$ 是伪多项式并只留统一的最短路/拓扑视角小节；`search-and-pruning` 区分回溯与分支定界，只讲可行性剪枝与最优性剪枝两条义务，不纳入 minimax/alpha-beta/MCTS；`randomized-algorithms` 与 `complexity` 的 `average-and-randomized` 硬切分——前者是「随机化作为设计手段与契约」（Las Vegas/Monte Carlo、期望与高概率两类承诺、one-sided/two-sided error），后者收缩为「概率与期望的分析语言」） |
| 9 | 算法 H：`selection` 与全章审校、冻结 | 计划（收尾顺序固定为：冻结 `divide-and-conquer` → 按 order 逐节评审并冻结 `complexity` → 冻结 `sequences` → 依次写并评审 `greedy`、`dynamic-programming`、`search-and-pruning`、`randomized-algorithms` → 写并评审 `selection` 两节 → 整个 `algorithms` 模块做一次 integration audit 后整体冻结；不接受「先全写完再统一审」。`choosing-structures` 定位为按语义契约先过滤、再比较工作负载成本；`complexity-in-practice` 定位为渐进阶相同或模型过粗时的现实成本，不复述 $O/\Theta$ 定义） |
| 10 | `os.processes`、`os.memory` | 计划 |
| 11 | `os.concurrency`、`os.io`、`os.resources` | 计划 |
| 12 | `net.foundations`、`net.transport` | 计划 |
| 13 | `net.application`、`net.operations` | 计划 |
| 14 | `db.relational`、`db.schema` | 计划（先重写现有六节） |
| 15 | `db.storage`（含新夹具） | 计划 |
| 16 | `db.transactions`、`db.operations` | 计划 |
| 17 | `swe.git`、`swe.design` | 计划 |
| 18 | `swe.testing`、`swe.delivery`、`swe.debugging` | 计划 |
| 19 | `dist.foundations`、`dist.communication` | 计划 |
| 20 | `dist.data`、`dist.architecture`、`dist.operations` | 计划 |
| 21 | `sec.foundations`、`sec.crypto`、`sec.web`、`sec.systems` | 计划 |

「冻结」与「发布」是两件正交的事，仓库里各有各的载体：

```text
冻结   内容治理状态：本课已过逐段评审，除事实错误、前置缺口与跨章节接口问题外不再主动扩写。记录在本文件的「落盘」列。
发布   部署状态：生产静态站是否为该课生成路由。记录在课时 frontmatter 的 status 字段（draft/review 只在 dev 的 includeUnpublished 下可见，生产路由只接受 published）。
```

因此课时一律以 `status: draft` 落盘并参与 dev 验证；逐节评审通过后在本文件标记「已冻结」，但仍保持未发布。等整个模块全部冻结并通过模块级发布检查后，用一个独立的发布提交一次性完成：批量把该模块课时的 `status` 改为 `published`；更新本文件的模块/批次发布状态（完成（已冻结，待发布）→ 完成（已发布））；跑生产校验与构建，确认课程路由数量按预期增加；核对已发布课时的 `CrossRef` 不指向生产环境不可见的 draft 课时。子章节 `_section.yaml` 的 `status: active` 保持不变，它与课时的 `LessonStatus` 是两套枚举。

## 5. 维护

- 新增课时：先在本文件登记 `id` 与标题，再落盘；落盘后若与计划不一致，改本文件，不留下两份互相矛盾的大纲。
- 拆分课时：新课时取新 `id`，旧 `id` 保留给拆分后覆盖原有范围的那一节。
- 删除课时：先清引用（`<CrossRef>`、术语与示例的使用），再删文件与可能空掉的章节。
- 调整模块或子章节顺序：改本文件与对应 `_section.yaml` 的 `order`，两者必须一致。
- 已冻结的模块：`python` 已完成并冻结（见批次表）。冻结的模块只在后续课程暴露 prerequisite 缺口或发现事实错误时回来修改，不主动增加主题；改动仍走本文件的登记流程，并同时改 `doc/CONTENT_GUIDE.md` 中与之相关的写作规则。
- 尚未落盘的子章节只登记在本文件；它的 `_section.yaml`、`summary` 与第一节内容一起落盘，不预先建目录，否则验证器会报 `empty-section`。因此本文件的树会暂时领先于磁盘，这是有意为之，不是不一致。
