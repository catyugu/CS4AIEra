# CS4AIEra：AI 时代的计算机科学自学课程

[![CI](https://github.com/catyugu/CS4AIEra/actions/workflows/ci.yml/badge.svg)](https://github.com/catyugu/CS4AIEra/actions/workflows/ci.yml)

官方部署网址：<https://cs4aiera.dpdns.org/>

CS4AIEra 是一套面向专业自学者的计算机科学课程，以及承载这套课程的静态 Web 教材。课程不要求已有计算机科学背景，但默认读者能够阅读技术定义、代码与形式化论证。

目标不是罗列语言特性、算法名称或工具用法，而是建立一套可以反复使用的计算机科学推理方法：理解程序与系统的状态、接口和表示，说明结论成立所依赖的假设，用不变量和反例判断正确性，用成本模型分析性能，并通过可复现的实验检验自己的判断。

## 教材形态

课程以 Web 应用呈现，但内容本身是仓库里的版本化文本，而不是依赖某个在线教学平台的数据。

主要特性包括：

- 分层的课程树、课时与术语表；
- Markdown / MDX 正文与构建期 KaTeX 数学渲染；
- 可编辑、运行、停止和重置的 Python 与 SQL 代码单元格；
- 部分章节有 Python / SQL 代码，在浏览器的独立 Web Worker 中执行，不在服务器执行学习者代码；
- 构建期检查课程 ID、引用、实验配置、数学与内容结构；
- 静态站点输出，可部署到普通静态托管或 CDN；

## 本地运行

需要：

- Node.js 22 或更高版本；
- npm；项目使用的版本记录在 `package.json` 中。

克隆仓库并安装依赖：

```bash
git clone https://github.com/catyugu/CS4AIEra.git
cd CS4AIEra
npm ci
```

下载课程使用的固定浏览器运行时：

```bash
npm run setup:runtime
```

启动开发服务器：

```bash
npm run dev
```

Astro 会在终端中给出本地访问地址。

## 检查与构建

提交修改前运行：

```bash
npm run check
npm run build
```

`npm run check` 依次执行内容校验、类型检查与测试。`npm run build` 生成最终静态站点到 `dist/`。

需要在本地查看生产构建时：

```bash
npm run preview
```

CI 使用同一套检查和构建流程。具体发布流程以 [.github/workflows/ci.yml](.github/workflows/ci.yml) 为准。

## 仓库结构

```text
content/
  curriculum/       课程正文与课程树
  glossary/         可独立查阅的术语条目
  labs/             可执行实验使用的夹具

src/
  content-model/    内容 schema、解析与校验
  markdown/         MDX / Markdown 构建管线
  components/       页面与交互组件
  runtime/          浏览器执行运行时协议
  workers/          Python / SQL Web Worker
  pages/            站点页面
  styles/           样式

scripts/            内容校验与运行时准备脚本
tests/              自动化测试
doc/                架构、课程地图与写作规范
```

精确的课程树、课时顺序和发布状态由 `content/` 中的 `_section.yaml` 与课时 frontmatter 定义，不在 README 中维护第二份清单。

## 修改课程内容

第一次修改仓库前，建议按下面的职责阅读文档：

- [AGENTS.md](AGENTS.md)：仓库不变量、修改纪律与完成标准；
- [doc/CONTENT_GUIDE.md](doc/CONTENT_GUIDE.md)：一节课应该怎样组织、论证和使用实验；
- [doc/CURRICULUM.md](doc/CURRICULUM.md)：课程教什么、模块怎样分工；
- [doc/DESIGN.md](doc/DESIGN.md)：产品架构、内容模型与浏览器运行时设计。

其中，一条事实只应有一个权威来源。

## 内容原则

这套课程面向没有正式 CS 前置知识、但能够进行专业技术推理的读者。因此课程写作遵循几个基本原则：

- 在依赖一个概念之前必须先定义它；
- 从可以观察的现象、失败或选择进入，再建立一般模型；
- 不用类比替代机制、定义或证明；
- 可执行实验用于检验核心论断，而不是装饰正文；

## 技术栈

项目当前以以下技术为基础：

- Astro + TypeScript
- MDX
- KaTeX
- CodeMirror 6
- Pyodide
- Vitest
- Cloudflare Workers Static Assets

## 许可证

本项目以 MIT 许可证开源，许可证全文见 [LICENSE](LICENSE)。
