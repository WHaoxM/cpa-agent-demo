/* ══ 职业生涯发展报告 Mock 数据 — 聚合入口 ══ */
/* 类型、数据已拆至独立文件；此文件向后兼容，所有原有 import 无需修改 */

// 类型统一从 @/types 导出
export type { SevenDim, JobLevel, JobPortrait, CareerPathEdge, MetroLine, TransferEdge, GrowthAction } from '@/types'

// 数据从各分包导出
export { JOB_PORTRAITS } from './careerPortraits'
export { METRO_LINES, CAREER_PATH_EDGES, TRANSFER_EDGES } from './careerLines'

// 工具函数内部依赖
import type { SevenDim, GrowthAction } from '@/types'
import { JOB_PORTRAITS } from './careerPortraits'

/* ══ 辅助：根据 resumeStore 匹配结果推算学生七维能力 ══ */
export function deriveStudentSevenDim(
  skillWeights: Array<{ name: string; weight: number; category: string }>,
  confidence: number,
): SevenDim {
  // 返回钟梓珉的硬编码数据，与 TalentPortrait.vue 保持一致
  return {
    专业技能: 90,
    证书资质: 85,
    创新能力: 92,
    学习能力: 93,
    抗压能力: 88,
    沟通能力: 82,
    实习经验: 65,
  }
}

/* ══ 成长计划 mock（按选定岗位生成）══ */

/* 15 职业专属模板（按 lineId + stack 映射） */
type GrowthTemplate = { shortGoal: string; shortTasks: string[]; shortMilestone: string; midGoal: string; midTasks: string[]; midMilestone: string }

function _tpl(shortGoal: string, shortTasks: string[], shortMilestone: string, midGoal: string, midTasks: string[], midMilestone: string): GrowthTemplate {
  return { shortGoal, shortTasks, shortMilestone, midGoal, midTasks, midMilestone }
}

const CAREER_TEMPLATES: Record<string, GrowthTemplate> = {
  /* ── Vue 前端工程师 ── */
  'fe-vue': _tpl(
    '系统掌握 Vue 3 + TypeScript 技术栈，能独立完成中小型业务模块开发',
    [
      '精读 Vue 3 官方文档，完成 Composition API + Pinia + Vue Router 完整实战项目',
      '实现一套 Element Plus 二次封装组件库，上传 GitHub 并配套 README 文档',
      '用 TypeScript 重构已有项目，消灭所有 any，掌握泛型与工具类型',
      '学习 Vite 插件开发，自定义一个 SVG 图标自动导入插件',
      '刷 LeetCode 数组/字符串/哈希表类题 50 道，强化 JS 基本功',
      '阅读 Vue 3 源码响应式模块（reactivity），写一篇 2000 字以上源码解析博客',
    ],
    '3 个月内产出 3 个 Vue 3 项目，6 个月内投递前端实习',
    '通过实战积累独立负责前端模块的能力，形成可展示的项目矩阵',
    [
      '参与 3 个月以上前端实习，独立完成至少 2 个完整业务需求（含联调上线）',
      '搭建并维护一个个人前端脚手架模板（Vite + Vue 3 + TS + ESLint + Prettier）',
      '输出技术博客 6 篇（组件设计/性能优化/工程化/源码分析各 1–2 篇）',
      '完成微前端基础学习，了解 qiankun 或 Module Federation 工作原理',
      '参与 1 个开源 Vue 相关项目，提交 PR 并被合并',
      '备考并通过初级软件设计师或云计算相关认证（可选）',
    ],
    '18 个月内获得初/中级前端工程师 Offer，薪资达到目标范围',
  ),

  /* ── React 前端工程师 ── */
  'fe-react': _tpl(
    '扎实掌握 React 18 + TypeScript 技术栈，能独立开发 Hooks 驱动的业务应用',
    [
      '完成 React 官方文档 + Beta 文档全部内容，构建 3 个 Hooks 驱动项目',
      '从零搭建 Redux Toolkit + React Query 数据层架构，输出架构文档',
      '实现基础 Design System（Button/Form/Modal），写 Storybook 文档',
      '学习 Vite/Webpack 构建原理，完成 Bundle 分析 + Code Splitting 实践',
      '刷 LeetCode 中等题 50 道（以动态规划/树/图为重点）',
      '阅读 React 18 源码 scheduler 模块，写一篇 Fiber 架构解析文章',
    ],
    '3 个月内产出 React 全栈项目，6 个月内投递 React 方向实习',
    '通过实战证明 React 中大型应用的架构能力，建立差异化竞争力',
    [
      '参与 React 实习，独立负责从设计稿到上线的完整功能模块（≥ 3 个）',
      '完成 Next.js SSR 项目，掌握 ISR/SSR/CSR 各场景权衡',
      '参与或主导一次前端性能优化（LCP/FID/CLS 核心指标提升 30%+）',
      '在 GitHub 维护 1 个 React 开源组件/工具库，积累 50+ star',
      '输出技术分享 PPT 并在团队/社区分享，记录反馈并迭代',
      '学习微前端方案（Module Federation），完成 Demo 搭建',
    ],
    '18 个月内拿到 React 方向前端工程师 Offer',
  ),

  /* ── 可视化工程师 ── */
  'fe-vis': _tpl(
    '掌握 ECharts + D3.js 核心体系，能独立实现数据大屏和动态图表',
    [
      '系统学习 ECharts 5 全部系列类型，实现 10+ 种图表配置与事件交互',
      '学习 D3.js 数据绑定/scale/axis/shape，完成力导向图与地理热力图各一个',
      '学习 SVG + Canvas 2D API，手写一个简单折线图（不依赖第三方库）',
      '搭建大屏 Demo 项目（Vue 3 + ECharts），响应式适配 1920px/2560px',
      '学习 Three.js 基础（场景/材质/光照），实现一个 3D 地球或柱状图',
      'GeoJSON 地图处理实践：实现省市下钻可视化效果',
    ],
    '3 个月内产出大屏 Demo，6 个月内投递可视化岗位实习',
    '建立"数据表达 + 工程能力"双轮驱动的可视化工程师能力体系',
    [
      '参与商业数据大屏项目实习，独立完成从数据接口到图表展示的完整链路',
      '使用 D3.js 实现一个可交互的技能/职业关系图（力导向/层级树二选一）',
      '完成 WebGL/Three.js 进阶学习，实现 WebGPU 基础粒子特效',
      '输出 5 篇可视化技术博客（ECharts 踩坑/D3 布局算法/Canvas 优化等）',
      '参与 Apache ECharts 开源社区，提交 Issue 或文档 PR',
      '搭建个人可视化作品集网站，收录 10 个以上可交互作品',
    ],
    '18 个月内获得可视化工程师或数据大屏前端 Offer',
  ),

  /* ── Java 后端工程师 ── */
  'be-java': _tpl(
    '系统掌握 Java + Spring Boot 技术栈，能独立开发 RESTful 接口和数据库设计',
    [
      '完成 Java 并发编程（JUC）系统学习，实现线程池、阻塞队列等核心组件',
      '用 Spring Boot 3 + MyBatis-Plus 搭建完整的 RBAC 权限管理系统（含前端联调）',
      'MySQL 性能专题：掌握 EXPLAIN 分析、索引设计原则、事务隔离级别',
      'Redis 实战：实现分布式 Session、缓存穿透防护、延迟队列',
      '学习 Docker + docker-compose，完成本地开发环境容器化',
      '刷 LeetCode 中等题 60 道（链表/树/滑动窗口/动态规划）',
      '阅读 Spring Boot 自动装配源码，写一篇自定义 Starter 教程',
    ],
    '3 个月内完成项目搭建，6 个月内投递 Java 后端实习',
    '具备微服务开发与中间件集成能力，产出可上线的后端项目',
    [
      '参与 3 个月以上 Java 后端实习，独立开发 3 个以上接口模块并完成联调',
      '学习 Spring Cloud Alibaba（Nacos/Sentinel/Seata），搭建微服务 Demo',
      '完成 Kafka 消息队列实战项目（订单异步处理/日志采集场景）',
      '学习 JVM 调优（GC 日志分析/Arthas 诊断），完成线上问题排查复盘文档',
      '参与开源 Java 项目，提交代码改进 PR',
      '输出技术博客 6 篇（Spring Boot/MySQL/Redis/微服务各方向）',
      '备考软件设计师或 OCP 认证（可选）',
    ],
    '18 个月内获得 Java 后端工程师 Offer，薪资达到目标范围',
  ),

  /* ── Go 后端工程师 ── */
  'be-go': _tpl(
    '扎实掌握 Go 语言并发模型和主流后端框架，能独立开发高性能 API 服务',
    [
      '完整学习 Go Tour + Go by Example，掌握 goroutine/channel/select/context',
      '用 Gin + GORM 搭建一个完整 RESTful API 项目（含 JWT 鉴权、分页、参数校验）',
      '学习 gRPC + Protobuf，实现服务间通信 Demo（含 Streaming 模式）',
      'MySQL + Redis 双写一致性实践（延迟双删策略实现）',
      'Docker 多阶段构建优化 Go 镜像，完成 CI/CD 流水线搭建',
      '刷 LeetCode 中等题 50 道，重点关注哈希/BFS/双指针',
      '阅读 Gin 框架源码路由与中间件部分，写一篇源码解析',
    ],
    '3 个月内产出 Go 项目，6 个月内投递 Go 方向后端实习',
    '具备 Go 微服务开发与高并发调优能力，形成可展示的工程实践',
    [
      '参与 Go 后端实习，独立开发并上线 2 个以上高并发服务模块',
      '学习 Kratos/Go-Zero 微服务框架，完成服务治理（限流/熔断/服务发现）Demo',
      '实现 pprof 性能分析 + 调优实践（CPU 火焰图、goroutine 泄漏排查）',
      'Kubernetes 部署实战：完成 Deployment/Service/Ingress/HPA 配置',
      '阅读 Go 运行时 GMP 调度器源码，输出 2000 字原理分析文章',
      '参与开源 Go 项目（gin/wire/GORM 等），提交有价值的 PR',
    ],
    '18 个月内获得 Go 后端工程师 Offer',
  ),

  /* ── Python 后端工程师 ── */
  'be-python': _tpl(
    '扎实掌握 Python 异步 Web 开发，能独立交付 FastAPI 服务和 AI 接口',
    [
      '精通 Python async/await 并发模型，完成 FastAPI 全功能项目（依赖注入/中间件/后台任务）',
      'Pydantic V2 + SQLAlchemy 2.0 数据层实践，实现完整 CRUD + 事务管理',
      'Celery + Redis 异步任务队列实战（邮件发送/数据报表生成场景）',
      'Docker 多阶段构建 Python 服务，实现 GitHub Actions 自动部署',
      '接入 OpenAI / 通义 API，封装一套 LLM 对话服务接口',
      '刷 LeetCode Python 版中等题 50 道，重点掌握字典/堆/二分',
    ],
    '3 个月内完成 FastAPI 项目，6 个月内投递 Python 后端实习',
    '具备 Python 后端 + AI 集成双核心能力，形成稀缺竞争力',
    [
      '参与 Python 后端实习，独立负责 AI 服务接口或异步任务模块',
      '完成 vLLM/Triton 模型服务化部署，支持并发推理',
      'Kafka + aiokafka 高并发消息消费实战（用户行为流日志场景）',
      '实现 Python 性能调优（uvloop/cython 热路径加速，profiling 分析）',
      '输出 5 篇技术博客（FastAPI/Pydantic/AI 接口设计/Python 调优各方向）',
      'Kubernetes 部署 Python 微服务，实现滚动升级与自动扩缩',
    ],
    '18 个月内获得 Python 后端工程师 Offer',
  ),

  /* ── 自动化测试工程师 ── */
  'qa-auto': _tpl(
    '掌握 Python + Playwright 自动化测试体系，能独立搭建测试框架并驱动质量提升',
    [
      '系统学习测试理论（等价类/边界值/因果图），完成 100 道 Bug 分析练习',
      '用 Python pytest 搭建接口自动化框架（requests + allure + Jenkins CI）',
      'Playwright 实战：实现 5 个核心业务场景的 E2E 自动化用例',
      'SQL 测试专题：掌握数据库验证用例设计（数据一致性/边界值）',
      'Charles 抓包实战：mock 接口并设计弱网测试场景',
      'Docker 搭建测试环境，实现一键启动 + 测试 + 报告三步流程',
      '在 GitHub 维护自动化测试框架项目，写完整 README',
    ],
    '3 个月内产出自动化框架，6 个月内投递测试实习',
    '具备测试平台开发和 AI 测试生成能力，形成测试开发复合竞争力',
    [
      '参与测试实习，推动接口自动化覆盖率从 0 提升到 60% 以上',
      '学习 JMeter 性能测试，完成接口压测 + 瓶颈定位 + 优化建议报告',
      '实现 CI/CD 质量门禁（单元测试覆盖率/接口测试通过率卡点）',
      '输出 1 篇测试平台设计文档（用例管理/执行调度/报告可视化模块设计）',
      '学习 AI 测试用例生成工具（GitHub Copilot/Codium），探索效率提升',
      '参与 Playwright 或 pytest 开源社区，提交 Issue 或 PR',
      '备考 ISTQB Foundation Level 认证（可选）',
    ],
    '18 个月内获得自动化测试工程师/测试开发 Offer',
  ),

  /* ── 质量平台工程师 ── */
  'qa-plat': _tpl(
    '具备"测试 + 开发"双轮能力，能独立开发测试平台核心功能',
    [
      '完成 Python/Go 后端 + Vue 3 前端的全栈基础学习，实现 CRUD 管理系统',
      '学习测试平台核心模块设计（用例管理/执行引擎/报告系统），写设计文档',
      'Celery + Redis 实现异步测试任务调度，支持并行执行',
      'ECharts 实现质量看板（用例通过率/缺陷趋势图/执行耗时分布）',
      '接入 Jenkins/GitLab CI，实现 CI 触发 → 执行 → 回调结果全链路',
      'Docker 容器化部署测试平台，支持一键启动',
    ],
    '3 个月内产出测试平台 MVP，6 个月内投递质量平台相关实习',
    '打造企业级测试工程平台能力，推动测试智能化与自动化融合',
    [
      '参与质量平台团队实习，独立负责 2 个以上平台功能模块',
      '实现 AI 测试用例生成接口（调用 LLM API 根据接口文档生成测试用例）',
      '搭建代码覆盖率差量分析系统（Jacoco + Git diff 联动）',
      '完成测试效能度量看板（DORA 指标：变更频率/部署频率/恢复时间/失败率）',
      '参与开源测试平台（MeterSphere/Metersphere）贡献代码',
      '输出技术文章：《测试平台架构设计与落地实践》',
    ],
    '18 个月内获得质量平台工程师 Offer',
  ),

  /* ── 性能测试工程师 ── */
  'qa-perf': _tpl(
    '掌握 JMeter/Gatling 压测体系，能独立完成接口性能测试与瓶颈分析',
    [
      '完成 JMeter 全功能学习（线程组/断言/参数化/监听器），实现 5 个接口压测场景',
      'Linux 性能监控专题：掌握 top/vmstat/iostat/netstat 实时分析',
      'MySQL 慢查询分析：用 EXPLAIN + 索引优化降低 3 个慢查询执行时间 50%',
      'Prometheus + Grafana 搭建基础监控面板（CPU/内存/响应时间/吞吐量）',
      'JMeter + Jenkins 实现 CI 压测集成，自动输出 HTML 报告',
      'HTTP/HTTPS 协议专题：掌握 TCP 三次握手、TLS 握手、Keep-Alive 原理',
    ],
    '3 个月内完成压测实践，6 个月内投递性能测试相关实习',
    '具备全链路压测能力和性能调优建议输出能力，成为性能领域专家',
    [
      '参与实习，主导完成 1 次全链路压测（设计→执行→分析→优化建议）',
      '实现 JMeter 分布式压测集群（Master + 2 Agent），完成万级并发压测',
      '完成 JVM 性能调优实战（Arthas 诊断 + GC 日志分析 + 堆内存优化）',
      '输出 3 篇技术博客（全链路压测方案/JVM 调优/MySQL 性能分析）',
      '学习全链路压测平台原理（影子表/流量染色），完成方案设计文档',
      '备考软件评测师认证（可选）',
    ],
    '18 个月内获得性能测试工程师/测试开发 Offer',
  ),

  /* ── 商业数据分析师 ── */
  'da-biz': _tpl(
    '掌握 SQL + Python + BI 分析三件套，能独立完成业务专题分析报告',
    [
      'SQL 系统学习：完成窗口函数/CTE/多表联查/性能优化全部专题，刷 50 道 SQL 题',
      '用 Python Pandas 完成 3 个完整数据分析项目（清洗→分析→可视化）',
      'Tableau/PowerBI 入门：完成销售/用户留存数据看板各 1 个',
      'A/B 测试原理：手动实现 t 检验/卡方检验，理解显著性与置信区间',
      '阅读 1 本业务分析书籍（《精益数据分析》或《数据化管理》）',
      '用 Python + Matplotlib/Seaborn 实现 RFM 用户分层可视化',
      '完成一份完整的商业分析报告（MECE 结构，含数据支撑和建议）',
    ],
    '3 个月内产出 3 个分析项目，6 个月内投递数据分析实习',
    '具备业务洞察与数据产品化能力，成为数据驱动决策的桥梁',
    [
      '参与数据分析实习，独立完成 3 个以上业务专题分析（含 PPT 汇报）',
      '主导一次 A/B 实验全流程（假设→设计→上线→评估→结论）',
      '完成 LTV 用户价值模型搭建与 Cohort 留存分析可视化',
      '搭建 Metabase/Superset 自助分析平台 Demo，接入真实业务数据',
      '输出 5 篇数据分析博客/微信文章（A/B 测试/漏斗分析/增长分析等方向）',
      '参与数据分析社区（DataFun/Kaggle），完成 1 个竞赛并进前 50%',
    ],
    '18 个月内获得商业数据分析师 Offer',
  ),

  /* ── 数据开发工程师 ── */
  'da-dev': _tpl(
    '掌握数仓 ETL 开发与大数据生态，能独立完成数仓分层建模任务',
    [
      '搭建本地 Hadoop + Hive + Spark 学习环境（Docker 版），跑通完整数据流',
      '完成数仓建模专题：ODS/DWD/DWS/ADS 分层实战（以电商数据为例）',
      '掌握 Hive SQL/Spark SQL 高级语法（窗口函数/UDF/动态分区）',
      'DataX 数据同步：实现 MySQL → Hive 全量 + 增量同步方案',
      'Azkaban/DolphinScheduler 调度：完成 5 个 ETL 任务的依赖编排',
      'Shell 脚本实践：实现数据分区管理、数据质量检查自动化脚本',
    ],
    '3 个月内完成数仓搭建，6 个月内投递数据开发实习',
    '具备流批一体与数据治理能力，成为数据中台核心开发者',
    [
      '参与数据开发实习，独立负责 1–2 个业务域数仓模型建设',
      '完成 Flink CDC 实时数仓链路实践（MySQL → Flink → Kafka → ClickHouse）',
      '实现数据质量监控系统（DQC 规则引擎 + 告警 + 修复流程）',
      '完成 Delta Lake/Iceberg 湖仓格式实践，理解 ACID + 增量查询原理',
      '输出 4 篇数据工程博客（数仓建模/Flink 实时/数据质量/湖仓一体）',
      '参与 Apache Flink/Hudi 社区，提交 Issue 或文档改进',
    ],
    '18 个月内获得数据开发工程师 Offer',
  ),

  /* ── 增长分析师 ── */
  'da-growth': _tpl(
    '掌握增长分析方法论和数据工具，能独立设计并评估增长实验',
    [
      'SQL 专题：完成用户行为漏斗、渠道归因、留存曲线的全套查询模板',
      'A/B 测试全流程：完成样本量估算→分流→数据采集→统计检验实战',
      '学习 Mixpanel/Amplitude 用户行为分析平台，完成 5 个分析报告',
      'Python 增长分析：用 Pandas 实现 RFM 分层 + CLV 预测 Demo',
      '阅读《增长黑客》《精益数据分析》，整理 AARRR 框架 + 30 个增长策略',
      '渠道归因分析实践：用 Python 实现 Last Click/Linear 模型对比',
    ],
    '3 个月内产出增长分析报告集，6 个月内投递增长/数据分析实习',
    '具备增量评估与用户生命周期驱动业务增长的能力',
    [
      '参与增长分析实习，主导完成 2 次 A/B 实验全流程并输出决策报告',
      '搭建用户生命周期模型（Churn Prediction + LTV 预测），完成模型评估',
      '完成 Uplift Modeling 增量实验框架，与 A/B 测试结果对比分析',
      '输出增长分析知识库（Notion 或 Confluence），供团队共享',
      '参与 Kaggle 竞赛（推荐/CTR 预测方向），完成模型并输出分析文档',
      '建立个人增长分析作品集（含 3 个以上完整案例+结论+建议）',
    ],
    '18 个月内获得增长分析师 Offer',
  ),

  /* ── 算法工程师（推荐算法）── */
  'algo-recsys': _tpl(
    '掌握推荐系统核心算法和实验方法，能参与推荐链路特征与模型迭代',
    [
      '实现协同过滤（User-CF/Item-CF）与矩阵分解（ALS/BPR）从零到完整 Demo',
      '学习 Spark MLlib，完成百万规模电影推荐 Pipeline（含数据处理到预测）',
      'Python 特征工程专题：完成交叉特征/离散化/嵌入表示 3 套实验',
      '搭建 A/B 测试框架（含流量分桶/显著性检验/提前停止判断）',
      'SQL 高级查询：完成推荐效果评估 SQL（Precision/Recall/Coverage/Diversity）',
      '阅读经典论文（NCF/DeepFM/DIN），整理算法原理笔记',
    ],
    '3 个月内完成推荐系统项目，6 个月内投递算法实习',
    '具备深度推荐模型工程化落地能力，形成端到端推荐链路经验',
    [
      '参与推荐算法实习，完成召回或精排至少一个模块的迭代上线',
      '完成深度学习推荐模型（DSSM/BST）训练与离线评估',
      '实现实时特征工程（Redis + Flink）：用户实时行为序列接入',
      '参与 Kaggle 推荐系统竞赛（RecSys/CriteoAI），进前 30%',
      '输出 4 篇技术博客（召回/精排/特征/实验各 1 篇）',
      '阅读并复现 1 篇顶会推荐论文（RecSys/WWW/SIGIR）',
    ],
    '18 个月内获得推荐算法工程师 Offer',
  ),

  /* ── 深度学习工程师 ── */
  'dl': _tpl(
    '扎实掌握 PyTorch 深度学习框架，能独立训练和调优主流神经网络模型',
    [
      '完成 fast.ai + PyTorch 官方 Tutorial，手写 CNN/RNN/Transformer 各一遍',
      '搭建完整训练 Pipeline（DataLoader + 混合精度 + Grad Scaler + WandB 追踪）',
      '模型压缩实践：完成知识蒸馏（KD）+ PTQ 量化，推理速度提升 2x',
      'ONNX 模型导出 + TensorRT 加速实战（FP16 部署在本地 GPU）',
      'Kaggle 图像分类竞赛：进前 40%（以 CIFAR-100 或自选比赛为目标）',
      '阅读 3 篇 SOTA 论文（ViT/DINO/SAM），整理架构对比笔记',
    ],
    '3 个月内完成深度学习项目，6 个月内投递算法/AI 相关实习',
    '具备大模型训练框架和多任务部署能力，成为 AI 系统工程化专家',
    [
      '参与 AI 研究/工程实习，独立完成模型训练→评估→部署全链路',
      '完成分布式训练实践（DDP + DeepSpeed ZeRO-2），支持多 GPU 训练',
      '实现端侧部署方案（TensorRT + ONNX → 移动端/边缘设备推理）',
      '复现并改进 1 篇顶会论文（CVPR/ICLR/NeurIPS），提交 arXiv 预印本',
      '完成 MLOps 全链路搭建（训练→实验追踪→部署→监控告警）',
      '参与开源项目（timm/diffusers/transformers），提交有价值 PR',
    ],
    '18 个月内获得深度学习工程师 Offer',
  ),

  /* ── LLM 应用工程师 ── */
  'ai-llm': _tpl(
    '掌握大模型 API 调用与 LangChain 生态，能独立构建 RAG 和对话应用',
    [
      '完成 OpenAI/通义/文心 API 调用全特性（Chat/Embedding/Function Calling/Vision）',
      'LangChain 系统学习：完成 Chain/Agent/Memory/Tools 全部核心模块实战',
      '搭建本地 RAG 系统：PDF 解析 + Embedding + Chroma 向量库 + 问答链路',
      'Prompt 工程专题：完成 Zero-shot/Few-shot/CoT/Self-consistency 对比实验',
      '用 FastAPI 封装 LLM 服务，支持流式输出（SSE）和并发请求',
      '阅读 RAG/Agent 相关论文（ReAct/Self-RAG/HyDE），整理原理对比',
    ],
    '3 个月内产出完整 AI 应用项目，6 个月内投递 LLM 应用方向实习',
    '具备企业级 LLM 平台设计与私有化部署能力，建立 AI 工程化专长',
    [
      '参与 AI 应用实习，独立完成 RAG 系统或 Agent 平台的核心功能开发',
      '实现 GraphRAG + 多路检索融合方案，显著提升复杂问答准确率',
      '完成 vLLM/Ollama 私有化部署，支持 10+ 并发推理请求',
      '搭建 LLM 评估框架（RAGAS/MT-Bench），建立自动化评估 CI',
      '参与开源 LLM 工具链项目（LangChain/LlamaIndex/vLLM），提交 PR',
      '输出 5 篇 AI 工程博客（RAG/Agent/部署/评测/Prompt 各方向）',
      '构建个人 AI 应用作品集（含 3 个完整落地案例）',
    ],
    '18 个月内获得 LLM 应用工程师/AI 工程师 Offer',
  ),
}

/* 职业 ID 到模板 Key 的映射 */
const JOB_TO_TEMPLATE: Record<string, string> = {
  'fe-intern': 'fe-vue', 'fe-junior': 'fe-vue', 'fe-mid': 'fe-vue', 'fe-senior': 'fe-vue', 'fe-lead': 'fe-vue',
  'fe-react-intern': 'fe-react', 'fe-react-junior': 'fe-react', 'fe-react-mid': 'fe-react', 'fe-react-senior': 'fe-react',
  'fe-vis-junior': 'fe-vis', 'fe-vis-mid': 'fe-vis', 'fe-vis-senior': 'fe-vis',
  'be-java-intern': 'be-java', 'be-java-junior': 'be-java', 'be-java-mid': 'be-java', 'be-java-senior': 'be-java',
  'be-go-intern': 'be-go', 'be-go-junior': 'be-go', 'be-go-mid': 'be-go', 'be-go-senior': 'be-go',
  'be-python-intern': 'be-python', 'be-python-junior': 'be-python', 'be-python-mid': 'be-python', 'be-python-senior': 'be-python',
  'qa-intern': 'qa-auto', 'qa-junior': 'qa-auto', 'qa-mid': 'qa-auto', 'qa-senior': 'qa-auto',
  'qa-plat-junior': 'qa-plat', 'qa-plat-mid': 'qa-plat', 'qa-plat-senior': 'qa-plat',
  'qa-perf-intern': 'qa-perf', 'qa-perf-junior': 'qa-perf', 'qa-perf-mid': 'qa-perf', 'qa-perf-senior': 'qa-perf',
  'da-biz-junior': 'da-biz', 'da-biz-mid': 'da-biz', 'da-biz-senior': 'da-biz',
  'da-dev-junior': 'da-dev', 'da-dev-mid': 'da-dev', 'da-dev-senior': 'da-dev',
  'da-growth-junior': 'da-growth', 'da-growth-mid': 'da-growth', 'da-growth-senior': 'da-growth',
  'algo-recsys-intern': 'algo-recsys', 'algo-recsys-junior': 'algo-recsys', 'algo-recsys-mid': 'algo-recsys', 'algo-recsys-senior': 'algo-recsys',
  'dl-junior': 'dl', 'dl-mid': 'dl', 'dl-senior': 'dl',
  'ai-llm-intern': 'ai-llm', 'ai-llm-junior': 'ai-llm', 'ai-llm-mid': 'ai-llm', 'ai-llm-senior': 'ai-llm',
}

export function getGrowthPlan(jobId: string): GrowthAction[] {
  const job = JOB_PORTRAITS.find(j => j.id === jobId)
  if (!job) return []

  const tplKey = JOB_TO_TEMPLATE[jobId]
  const tpl = tplKey ? CAREER_TEMPLATES[tplKey] : null

  if (tpl) {
    return [
      {
        phase: 'short',
        phaseLabel: '短期（0–6个月）',
        goal: tpl.shortGoal,
        tasks: tpl.shortTasks,
        milestone: tpl.shortMilestone,
      },
      {
        phase: 'mid',
        phaseLabel: '中期（6–18个月）',
        goal: tpl.midGoal,
        tasks: tpl.midTasks,
        milestone: tpl.midMilestone,
      },
    ]
  }

  /* 兜底：通用模板 */
  const skillList = job.keySkills.slice(0, 3).join('、')
  return [
    {
      phase: 'short',
      phaseLabel: '短期（0–6个月）',
      goal: `系统补齐 ${skillList} 等核心技能，达到岗位基础要求`,
      tasks: [
        `完成 ${job.keySkills[0] ?? '核心技能'} 系统性学习（慕课/文档/项目实践）`,
        `在 GitHub 产出 2 个以上相关 Demo 项目`,
        `参加本校或线上相关技术比赛/Hackathon`,
        `完成 ${job.keySkills[1] ?? '关键技术'} 实战项目并输出技术文档`,
        job.sevenDim.证书资质 > 60 ? '备考并取得行业认可证书（如软考中级）' : '持续刷 LeetCode，强化算法基础',
        '建立技术博客，输出 3 篇以上学习总结',
      ],
      milestone: `3 个月内完成学习，6 个月内投递 ${job.title} 实习`,
    },
    {
      phase: 'mid',
      phaseLabel: '中期（6–18个月）',
      goal: `通过实战项目证明 ${job.title} 岗位能力，形成差异化竞争力`,
      tasks: [
        `参与至少 1 段与 ${job.title} 强相关的实习（3 个月以上）`,
        `输出 1 份技术分享/博客，展示对 ${job.keySkills[1] ?? '关键技术'} 的深度理解`,
        `积累 2–3 个可展示的完整业务项目经验`,
        '主动参与开源社区，积累 PR 贡献记录',
        '完成 1 次技术分享（团队/社区/Meetup），锻炼表达与总结能力',
        '拓展边界：学习 1 个相邻领域技术，形成 T 型能力结构',
      ],
      milestone: `18 个月内拿到 ${job.title} 正式 Offer，薪资达到 ${job.salaryRange}`,
    },
  ]
}