import type { MetroLine, TransferEdge, CareerPathEdge } from '@/types'

/* ══ 地铁线路（全技术栈细分，共 17 条）══ */
export const METRO_LINES: MetroLine[] = [
  {
    id: 'frontend', name: '前端工程线', color: '#C4622D', trackColor: 'rgba(196,98,45,0.7)',
    stationIds: ['fe-intern', 'fe-junior', 'fe-mid', 'fe-senior', 'fe-lead', 'fe-react-junior', 'fe-react-senior', 'fe-angular-junior', 'fe-angular-senior', 'fe-mini-junior', 'fe-mini-senior'],
  },
  {
    id: 'data', name: '数据/AI线', color: '#B8962E', trackColor: 'rgba(184,150,46,0.7)',
    stationIds: ['da-junior', 'da-mid', 'ml-engineer'],
  },
  {
    id: 'qa', name: '测试开发线', color: '#3A8A7A', trackColor: 'rgba(58,138,122,0.7)',
    stationIds: ['qa-junior', 'qa-senior', 'qa-func-junior', 'qa-func-senior', 'qa-perf-junior', 'qa-perf-senior', 'qa-sec-junior', 'qa-sec-senior'],
  },
  {
    id: 'fullstack', name: '跨界路线', color: '#6A5B8A', trackColor: 'rgba(106,91,138,0.7)',
    stationIds: ['fullstack', 'tech-pm'],
  },
  {
    id: 'general', name: '软件工程线', color: '#7A6F5A', trackColor: 'rgba(122,111,90,0.7)',
    stationIds: ['se-java-junior', 'se-java-senior', 'se-python-junior', 'se-python-senior', 'se-cpp-junior', 'se-cpp-senior', 'se-go-junior', 'se-go-senior'],
  },
  {
    id: 'algorithm', name: '算法研究线', color: '#5B7E91', trackColor: 'rgba(91,126,145,0.7)',
    stationIds: ['algo-recsys-junior', 'algo-recsys-senior', 'algo-cv-junior', 'algo-cv-senior', 'algo-nlp-junior', 'algo-nlp-senior', 'algo-search-junior', 'algo-search-senior'],
  },
  {
    id: 'data-analyst', name: '数据分析线', color: '#B8962E', trackColor: 'rgba(184,150,46,0.6)',
    stationIds: ['da-sql-junior', 'da-sql-senior', 'da-py-junior', 'da-py-senior', 'da-bi-junior', 'da-bi-senior'],
  },
  {
    id: 'backend', name: '后端开发线', color: '#2E7D5E', trackColor: 'rgba(46,125,94,0.7)',
    stationIds: ['be-java-junior', 'be-java-senior', 'be-go-junior', 'be-go-senior', 'be-cpp-junior', 'be-cpp-senior', 'be-python-junior', 'be-python-senior', 'be-node-junior', 'be-node-senior'],
  },
  {
    id: 'ai', name: '人工智能线', color: '#8B4A9C', trackColor: 'rgba(139,74,156,0.7)',
    stationIds: ['ai-cv-junior', 'ai-cv-senior', 'ai-nlp-junior', 'ai-nlp-senior', 'ai-llm-junior', 'ai-llm-senior', 'ai-mm-junior', 'ai-mm-senior'],
  },
  {
    id: 'bigdata', name: '大数据线', color: '#C45E2A', trackColor: 'rgba(196,94,42,0.7)',
    stationIds: ['bd-spark-junior', 'bd-spark-senior', 'bd-flink-junior', 'bd-flink-senior', 'bd-dw-junior', 'bd-dw-senior', 'bd-olap-junior', 'bd-olap-senior'],
  },
  {
    id: 'ops', name: '运维工程线', color: '#4A6FA5', trackColor: 'rgba(74,111,165,0.7)',
    stationIds: ['ops-linux-junior', 'ops-linux-senior', 'ops-cloud-junior', 'ops-cloud-senior', 'ops-devops-junior', 'ops-devops-senior'],
  },
  {
    id: 'embedded', name: '嵌入式线', color: '#6B5E3A', trackColor: 'rgba(107,94,58,0.7)',
    stationIds: ['emb-mcu-junior', 'emb-mcu-senior', 'emb-linux-junior', 'emb-linux-senior', 'emb-fpga-junior', 'emb-fpga-senior', 'emb-bsp-junior', 'emb-bsp-senior'],
  },
  {
    id: 'security', name: '网络安全线', color: '#9C2E2E', trackColor: 'rgba(156,46,46,0.7)',
    stationIds: ['sec-pen-junior', 'sec-pen-senior', 'sec-soc-junior', 'sec-soc-senior', 'sec-dev-junior', 'sec-dev-senior', 'sec-rev-junior', 'sec-rev-senior'],
  },
  {
    id: 'cloud', name: '云计算线', color: '#2E6B9C', trackColor: 'rgba(46,107,156,0.7)',
    stationIds: ['cloud-aws-junior', 'cloud-aws-senior', 'cloud-k8s-junior', 'cloud-k8s-senior', 'cloud-ali-junior', 'cloud-ali-senior', 'cloud-sl-junior', 'cloud-sl-senior'],
  },
  {
    id: 'database', name: '数据库线', color: '#5A7A4A', trackColor: 'rgba(90,122,74,0.7)',
    stationIds: ['db-mysql-junior', 'db-mysql-senior', 'db-oracle-junior', 'db-oracle-senior', 'db-dist-junior', 'db-dist-senior', 'db-nosql-junior', 'db-nosql-senior'],
  },
  {
    id: 'support', name: '技术支持线', color: '#8A7A5A', trackColor: 'rgba(138,122,90,0.7)',
    stationIds: ['sup-it-junior', 'sup-it-senior', 'sup-pre-junior', 'sup-pre-senior', 'sup-post-junior', 'sup-post-senior'],
  },
  {
    id: 'multimedia', name: '音视频线', color: '#9C5E2E', trackColor: 'rgba(156,94,46,0.7)',
    stationIds: ['av-stream-junior', 'av-stream-senior', 'av-rtc-junior', 'av-rtc-senior', 'av-codec-junior', 'av-codec-senior', 'av-sdk-junior', 'av-sdk-senior'],
  },
]

/* ══ 换乘连接（转岗路径，至少 5 条）══ */
export const TRANSFER_EDGES: TransferEdge[] = [
  {
    fromId: 'fe-mid',
    toId: 'fullstack',
    skills: ['Node.js', 'MySQL', 'Docker'],
    label: '补齐后端基础',
  },
  {
    fromId: 'fe-mid',
    toId: 'tech-pm',
    skills: ['产品思维', '用户调研', 'Axure'],
    label: '转型产品方向',
  },
  {
    fromId: 'fullstack',
    toId: 'da-mid',
    skills: ['Python', 'SQL 进阶', '统计学'],
    label: '数据化转型',
  },
  {
    fromId: 'fe-senior',
    toId: 'ml-engineer',
    skills: ['Python', '机器学习基础', 'PyTorch'],
    label: '转 AI 方向',
  },
  {
    fromId: 'qa-senior',
    toId: 'fe-mid',
    skills: ['Vue 3', 'TypeScript', '性能优化'],
    label: '转开发方向',
  },
  {
    fromId: 'da-mid',
    toId: 'ml-engineer',
    skills: ['深度学习', 'PyTorch', '特征工程'],
    label: '进阶 ML 方向',
  },
  {
    fromId: 'fe-junior',
    toId: 'qa-junior',
    skills: ['测试框架', '用例设计', 'CI/CD'],
    label: '转测试开发',
  },
]

/* ══ 职业路径图谱（真实 JD 要求技能）══ */
export const CAREER_PATH_EDGES: CareerPathEdge[] = [
  /* ── 前端线晋升路径 ── */
  {
    fromId: 'fe-intern', toId: 'fe-junior', type: 'promote',
    skills: ['Vue3 Composition API', 'TypeScript 基础类型与接口', 'Pinia 状态管理', 'Vue Router 路由守卫', 'Axios 请求封装与拦截器', 'Element Plus 组件二次封装', 'Git Flow 工作流'],
  },
  {
    fromId: 'fe-junior', toId: 'fe-mid', type: 'promote',
    skills: ['Vue3 高级特性（自定义指令/插件）', 'TypeScript 泛型与工具类型', 'Vite 插件开发与构建优化', 'Webpack 性能分析与 Tree Shaking', 'React Hooks 与状态管理', '前端性能监控（Core Web Vitals）', 'CSS Modules / Tailwind CSS', '微前端基础（qiankun 原理）'],
  },
  {
    fromId: 'fe-mid', toId: 'fe-senior', type: 'promote',
    skills: ['微前端架构（Module Federation）', 'Nuxt3 / Next.js SSR 方案', 'Node.js BFF 层设计', '前端安全（XSS / CSRF / CSP）', 'GitHub Actions CI/CD 流水线', '设计 Token 与组件库体系', '浏览器渲染原理与 V8 优化', 'Web Worker / WASM 实践'],
  },
  {
    fromId: 'fe-senior', toId: 'fe-lead', type: 'promote',
    skills: ['Monorepo 工程架构（Turborepo/pnpm）', '低代码平台设计与落地', 'OKR 技术规划与 Roadmap', '前端基础设施建设（埋点/监控平台）', '工程师招聘面试体系搭建', '技术债治理与大规模重构策略', '容灾降级与前端高可用方案'],
  },

  /* ── 数据/AI 线晋升路径 ── */
  {
    fromId: 'da-junior', toId: 'da-mid', type: 'promote',
    skills: ['Python Pandas 高级用法（groupby/pivot）', 'SQL 窗口函数与复杂子查询', 'Spark / Hive 大数据基础', 'Tableau / Power BI 高级可视化', 'A/B 测试设计与统计显著性', '指标体系搭建（OSM / MECE 方法）', '数仓分层建模（ODS/DWD/ADS）', '假设检验（t检验/卡方检验）'],
  },
  {
    fromId: 'da-mid', toId: 'ml-engineer', type: 'promote',
    skills: ['机器学习原理（梯度下降/正则化）', 'PyTorch 神经网络搭建与训练', '特征工程与特征选择方法', '模型评估（AUC/F1/交叉验证）', 'MLflow / DVC 实验管理', '模型服务化（FastAPI + Triton）', 'LLM Fine-tuning 与 Prompt 工程'],
  },

  /* ── 测试线晋升路径 ── */
  {
    fromId: 'qa-junior', toId: 'qa-senior', type: 'promote',
    skills: ['Python pytest + requests 接口自动化', 'Playwright E2E 自动化框架搭建', 'JMeter 性能测试与压测分析', 'Jenkins / GitLab CI 集成测试', '测试平台开发（用例管理/报告系统）', 'App 专项测试（adb / Charles 抓包）', '代码覆盖率分析（JaCoCo / Istanbul）'],
  },

  /* ── 跨线转岗路径 ── */
  {
    fromId: 'fe-junior', toId: 'qa-junior', type: 'transfer',
    skills: ['黑盒/白盒测试方法论', 'Postman 接口测试与 Mock', '等价类划分与边界值分析', 'Bug 生命周期管理', 'Jira / TAPD 缺陷跟踪', 'SQL 查询验证数据正确性'],
  },
  {
    fromId: 'fe-mid', toId: 'fullstack', type: 'transfer',
    skills: ['Node.js + Express/Koa 服务开发', 'RESTful API 设计规范', 'MySQL 索引优化与事务管理', 'Redis 缓存策略（缓存穿透/雪崩）', 'JWT 鉴权与 RBAC 权限模型', 'Docker + docker-compose 容器化', 'Nginx 反向代理与负载均衡'],
  },
  {
    fromId: 'fe-mid', toId: 'tech-pm', type: 'transfer',
    skills: ['产品需求文档（PRD）撰写规范', 'Axure / Figma 原型设计', '用户访谈与问卷调研方法', '数据埋点与用户行为漏斗分析', 'RICE / ICE 优先级评估模型', '敏捷开发 Scrum 流程与 Sprint 管理'],
  },
  {
    fromId: 'fe-senior', toId: 'ml-engineer', type: 'transfer',
    skills: ['Python 数据处理（NumPy / Pandas）', '机器学习基础（线性回归/随机森林）', 'PyTorch 入门（张量/自动微分）', '推荐系统基础（协同过滤/矩阵分解）', 'A/B 实验设计与因果推断', '大模型 API 调用与 RAG 实践'],
  },
  {
    fromId: 'qa-senior', toId: 'fe-mid', type: 'transfer',
    skills: ['Vue3 Composition API 深入', 'TypeScript 工程化配置', 'Vite / Webpack 构建工具', 'CSS 高级布局与动效', '前端监控与错误上报', '组件库设计规范'],
  },
  {
    fromId: 'fullstack', toId: 'da-mid', type: 'transfer',
    skills: ['Python 统计分析（SciPy / Statsmodels）', 'SQL 性能调优与执行计划', 'Airflow / DolphinScheduler ETL 管道', 'Metabase / Superset BI 工具', '指标体系设计方法论', '数据驱动决策（北极星指标体系）'],
  },

  /* ══ CAREER_DOMAINS 15 职业 新增晋升路径 ══ */

  /* ── React 前端工程师 晋升链 ── */
  {
    fromId: 'fe-react-intern', toId: 'fe-react-junior', type: 'promote',
    skills: ['React 18 Hooks 深度理解', 'TypeScript 泛型与类型推断', 'Redux Toolkit 状态管理', 'Ant Design 组件库使用', 'Vite 开发构建配置', 'Jest 单元测试入门', 'Git Flow 工作流'],
  },
  {
    fromId: 'fe-react-junior', toId: 'fe-react-mid', type: 'promote',
    skills: ['React 18 Concurrent Mode / Suspense', 'React Query / SWR 数据获取层', '微前端（Module Federation）基础', '前端性能监控（Core Web Vitals）', 'Webpack Bundle 分析与优化', 'Storybook 组件文档体系', 'E2E 测试（Playwright）'],
  },
  {
    fromId: 'fe-react-mid', toId: 'fe-react-senior', type: 'promote',
    skills: ['Next.js SSR/ISR 方案设计', 'Monorepo 工程架构（Nx/Turborepo）', 'GraphQL / tRPC 数据层', '设计系统构建与 Design Token', 'Node.js BFF 层设计', '浏览器渲染原理与 V8 调优', '工程师招聘与 Code Review 体系'],
  },

  /* ── 可视化工程师 晋升链 ── */
  {
    fromId: 'fe-vis-junior', toId: 'fe-vis-mid', type: 'promote',
    skills: ['D3.js 高级布局（树/力导向/地理）', 'WebGL + Three.js 三维可视化入门', 'Canvas 2D 性能优化技巧', 'ECharts 自定义渲染器开发', 'GeoJSON 地图数据处理', '大数据图表虚拟化（Virtual DOM）', '可视化组件库设计模式'],
  },
  {
    fromId: 'fe-vis-mid', toId: 'fe-vis-senior', type: 'promote',
    skills: ['WebGPU / WebGL2 Instancing 渲染加速', 'Apache ECharts 源码级深度定制', '实时流数据可视化（WebSocket + rAF）', '大数据 LOD 分层策略（亿级点云渲染）', 'AntV G6 图分析高级功能', '可视化叙事（Scrollytelling）设计', '跨团队技术推广与培训'],
  },

  /* ── Java 后端工程师 晋升链 ── */
  {
    fromId: 'be-java-intern', toId: 'be-java-junior', type: 'promote',
    skills: ['Spring Boot 2/3 自动装配原理', 'MyBatis-Plus CRUD 与动态 SQL', 'MySQL 事务与索引优化入门', 'Redis 基础数据结构与缓存策略', 'JWT 鉴权与 Spring Security 基础', 'Maven 多模块管理', 'Git/Linux 日常操作'],
  },
  {
    fromId: 'be-java-junior', toId: 'be-java-mid', type: 'promote',
    skills: ['Spring Cloud Alibaba 微服务全家桶', 'Kafka 消息队列消费与生产', 'MySQL 分库分表（ShardingSphere）', 'Redis 分布式锁与 Redisson', 'Docker + Compose 容器化', 'RESTful API 规范设计与 Swagger', 'JUnit 5 / Mockito 测试覆盖'],
  },
  {
    fromId: 'be-java-mid', toId: 'be-java-senior', type: 'promote',
    skills: ['分布式事务（Seata TCC/AT）', 'JVM 调优（GC 日志/内存分析/Arthas）', 'DDD 领域驱动设计落地', 'Sentinel 限流熔断策略', 'Elasticsearch 全文检索集成', 'Kubernetes 部署与滚动升级', '性能压测与容量规划（JMeter/k6）'],
  },

  /* ── Go 后端工程师 晋升链 ── */
  {
    fromId: 'be-go-intern', toId: 'be-go-junior', type: 'promote',
    skills: ['Go 语言特性（goroutine/channel/select）', 'Gin 框架中间件链路设计', 'GORM 复杂查询与关联', 'MySQL/Redis 基础集成', 'gRPC 基础（Protobuf 定义与生成）', 'Docker 镜像构建', 'Git 协作规范'],
  },
  {
    fromId: 'be-go-junior', toId: 'be-go-mid', type: 'promote',
    skills: ['Go 并发原语深度（sync.Map/atomic/errgroup）', 'Kratos/Go-Zero 微服务框架', 'Kafka 高并发消费实践', 'Redis Cluster 分布式缓存', 'Prometheus + Grafana 自定义指标', 'OpenTelemetry 链路追踪', 'Docker Compose 多服务编排'],
  },
  {
    fromId: 'be-go-mid', toId: 'be-go-senior', type: 'promote',
    skills: ['Go runtime 调优（pprof/trace/堆分析）', 'Kubernetes 服务部署与自动扩缩', 'ETCD 服务注册与分布式锁', 'Istio 服务网格流量管理', '高并发场景设计（百万 QPS 架构）', '分布式系统故障排查与复盘', '中间件设计与开源贡献'],
  },

  /* ── Python 后端工程师 晋升链 ── */
  {
    fromId: 'be-python-intern', toId: 'be-python-junior', type: 'promote',
    skills: ['FastAPI 路由/依赖注入/中间件', 'SQLAlchemy ORM 查询与关联', 'MySQL/PostgreSQL 基础事务', 'Redis 缓存集成', 'Celery 任务队列基础', 'Docker 镜像打包', 'Git 分支管理'],
  },
  {
    fromId: 'be-python-junior', toId: 'be-python-mid', type: 'promote',
    skills: ['FastAPI 异步编程（async/await 深度）', 'Pydantic V2 数据校验体系', 'Kafka aiokafka 高并发消费', 'PostgreSQL 高级查询（窗口函数/CTE）', 'AI 模型服务化（FastAPI + Triton/vLLM）', 'Kubernetes 部署与健康检查', 'gRPC 跨服务通信'],
  },
  {
    fromId: 'be-python-mid', toId: 'be-python-senior', type: 'promote',
    skills: ['Python 性能调优（cProfile/Cython/uvloop）', '大规模 AI 推理平台设计', 'DDD 架构实践（Python 版）', '微服务拆分与 API Gateway 设计', '混沌工程（故障注入与容灾）', '分布式追踪（Jaeger/Zipkin）', '团队技术规范制定'],
  },

  /* ── 自动化测试工程师 晋升链 ── */
  {
    fromId: 'qa-intern', toId: 'qa-junior', type: 'promote',
    skills: ['Python pytest 基础框架', 'Selenium 元素定位与等待策略', 'Postman + Newman 接口自动化', 'SQL 数据库验证查询', 'Git 版本管理', 'Jira 缺陷管理流程', 'Linux 基础运维'],
  },
  {
    fromId: 'qa-junior', toId: 'qa-mid', type: 'promote',
    skills: ['Playwright E2E 自动化框架', 'Allure 报告可视化', 'Jenkins CI 流水线集成', 'Docker 测试环境容器化', 'Page Object Model 设计模式', 'Charles 抓包与 Mock 数据', '接口压测基础（k6）'],
  },
  {
    fromId: 'qa-mid', toId: 'qa-senior', type: 'promote',
    skills: ['测试平台自研开发（Python/Go + Vue）', 'AI 测试用例智能生成', '代码覆盖率差量分析（JaCoCo/Istanbul）', '全链路灰度测试方案', '性能基线与监控（SLA 质量门禁）', '测试效能度量（DORA 指标）', '跨部门测试左移推广'],
  },

  /* ── 质量平台工程师 晋升链 ── */
  {
    fromId: 'qa-plat-junior', toId: 'qa-plat-mid', type: 'promote',
    skills: ['分布式测试调度（Celery Beat/K8s Job）', '质量看板可视化（ECharts + Vue）', '测试数据工厂（Factory Boy/Faker）', '多语言框架适配层设计', 'Prometheus 自定义指标接入', 'Docker 多环境测试矩阵', 'API 稳定性与版本管理'],
  },
  {
    fromId: 'qa-plat-mid', toId: 'qa-plat-senior', type: 'promote',
    skills: ['AI 辅助用例生成（GPT/CodeBERT 微调）', '变异测试（PIT Mutation Score）', '全链路质量门禁（构建/测试/发布）', '测试平台微服务架构重构', '混沌工程与质量维度集成', '研发效能度量平台（DORA 全面落地）', '跨事业部质量文化建设'],
  },

  /* ── 性能测试工程师 晋升链 ── */
  {
    fromId: 'qa-perf-intern', toId: 'qa-perf-junior', type: 'promote',
    skills: ['JMeter 压测脚本编写与参数化', 'Gatling Scala DSL 基础', 'Linux 资源监控（top/iostat/vmstat）', 'Prometheus/Grafana 基础监控面板', 'SQL 慢查询定位', 'HTTP/TCP 抓包分析', 'Git'],
  },
  {
    fromId: 'qa-perf-junior', toId: 'qa-perf-mid', type: 'promote',
    skills: ['JMeter 分布式压测集群搭建', 'APM 工具集成（SkyWalking/Arthas）', '全链路压测方案设计（影子库/流量染色）', 'JVM 调优（堆内存/GC 策略）', 'MySQL 执行计划深度分析', 'Nginx 性能参数调优', '压测报告撰写与优化建议输出'],
  },
  {
    fromId: 'qa-perf-mid', toId: 'qa-perf-senior', type: 'promote',
    skills: ['全链路压测平台自研（k6/Locust 分布式）', 'SLA 性能基线体系建立', 'JVM 高级诊断（async-profiler/火焰图）', 'MySQL 存储引擎底层调优（InnoDB Buffer Pool）', '微服务性能预算（Service Mesh 指标）', '容量规划模型（排队论/Little 定律）', '性能工程体系推广'],
  },

  /* ── 商业数据分析师 晋升链 ── */
  {
    fromId: 'da-biz-junior', toId: 'da-biz-mid', type: 'promote',
    skills: ['A/B 测试全流程（功效/样本量/显著性）', '用户分群建模（RFM/K-means）', 'Python Prophet 时序预测', 'LTV 用户价值模型构建', 'Metabase/Superset 自助分析平台', '漏斗与留存分析深化', '数据洞察报告叙事框架'],
  },
  {
    fromId: 'da-biz-mid', toId: 'da-biz-senior', type: 'promote',
    skills: ['因果推断（DID/断点回归/工具变量）', '北极星指标体系设计（OSM 框架）', '机器学习驱动业务决策（Churn/LTV 预测）', '自助分析平台建设（低代码 BI）', '数据伦理与隐私合规（差分隐私）', '高管数据叙事（MECE/金字塔原理）', '全公司数据素养培训体系'],
  },

  /* ── 数据开发工程师 晋升链 ── */
  {
    fromId: 'da-dev-junior', toId: 'da-dev-mid', type: 'promote',
    skills: ['Spark 离线计算调优（Shuffle/内存管理）', 'Flink CDC 实时数据同步（Debezium）', '数据质量监控（Great Expectations）', '维度建模方法论（Kimball 星型/雪花）', 'Delta Lake Upsert 与 ACID 事务', 'Airflow DAG 复杂依赖编排', '元数据管理（Apache Atlas/DataHub）'],
  },
  {
    fromId: 'da-dev-mid', toId: 'da-dev-senior', type: 'promote',
    skills: ['数据中台架构设计（OneData/OneModel）', '流批一体（Flink + Spark 协同）', '湖仓一体（Hudi + Trino 联邦查询）', '数据血缘全链路追踪', 'DataOps CI/CD for Data Pipeline', 'FinOps 大数据计算成本治理', '跨域数据标准化与治理委员会'],
  },

  /* ── 增长分析师 晋升链 ── */
  {
    fromId: 'da-growth-junior', toId: 'da-growth-mid', type: 'promote',
    skills: ['增长实验全流程（假设→设计→上线→评估）', '用户生命周期模型（CLV/Churn 预测）', 'AARRR 漏斗精细化量化分析', 'Segment/Amplitude 行为平台高级用法', 'Python 增长统计建模（回归/分类）', '个性化推荐逻辑（协同过滤入门）', '增长黑客思维与 Pirate Metrics'],
  },
  {
    fromId: 'da-growth-mid', toId: 'da-growth-senior', type: 'promote',
    skills: ['因果推断与增量价值评估（Uplift Model）', 'LTV 最大化策略（动态定价/补贴优化）', '实时个性化分析系统设计', '跨渠道归因模型（MMM 媒体组合）', '增长飞轮构建与复利效应分析', '增长数据治理与 OKR 数据化', '增长团队 × 产品 × 营销跨职能协作'],
  },

  /* ── 推荐算法工程师 晋升链 ── */
  {
    fromId: 'algo-recsys-intern', toId: 'algo-recsys-junior', type: 'promote',
    skills: ['协同过滤（User-CF/Item-CF）实现', '矩阵分解（ALS/SVD）原理与实践', 'Spark MLlib 基础特征工程', 'A/B 实验流量分桶方案', 'SQL 特征拼接与离线评估', 'Python 数据分析（Pandas/NumPy）', 'Git/Linux 工程规范'],
  },
  {
    fromId: 'algo-recsys-junior', toId: 'algo-recsys-mid', type: 'promote',
    skills: ['深度召回模型（DSSM/Two-tower）', 'Transformer 精排（BST/SIM/DIEN）', '实时特征工程（Redis/Flink Online）', 'TensorFlow/PyTorch 训练优化', 'MLflow 实验追踪与版本管理', '在线 A/B 实验全流程（AA 验证/SRM）', '推荐多目标优化（Click/Stay/Convert）'],
  },
  {
    fromId: 'algo-recsys-mid', toId: 'algo-recsys-senior', type: 'promote',
    skills: ['推荐系统端到端架构设计（召回/粗排/精排/重排）', '多目标学习（MMoE/PLE 架构）', '图神经网络推荐（GNN/GraphSAGE）', '大规模分布式训练（PS + All-Reduce）', 'MLOps 全链路（训练→A/B→上线→监控）', '实验平台与增益评估体系', '增长策略与推荐业务融合'],
  },

  /* ── 深度学习工程师 晋升链 ── */
  {
    fromId: 'dl-junior', toId: 'dl-mid', type: 'promote',
    skills: ['Transformer 深度定制（自注意力/位置编码变种）', '模型蒸馏（KD）与量化（PTQ/QAT）', 'ONNX 模型导出与跨框架推理', 'TensorRT 推理加速（FP16/INT8）', '混合精度训练（torch.cuda.amp）', '分布式训练（DDP/ZeRO）', '系统化误差分析与可解释性'],
  },
  {
    fromId: 'dl-mid', toId: 'dl-senior', type: 'promote',
    skills: ['Foundation Model 预训练（百亿参数级别）', '大规模分布式训练（Megatron-LM/FSDP）', '自研网络架构搜索（NAS/EfficientNet 类）', 'MLOps 全链路自动化（AutoML → 模型监控）', '多任务 / 持续学习系统设计', 'AI 安全与对抗样本防御', '顶会论文追踪与工业落地转化'],
  },

  /* ── LLM 应用工程师 晋升链 ── */
  {
    fromId: 'ai-llm-intern', toId: 'ai-llm-junior', type: 'promote',
    skills: ['OpenAI/通义/智谱大模型 API 调用', 'LangChain 基础链路构建', 'Prompt 工程（Zero-shot/Few-shot/CoT）', '向量检索基础（Chroma/Pinecone）', 'FastAPI AI 接口封装', 'Docker 环境配置', 'Git/Markdown 工程规范'],
  },
  {
    fromId: 'ai-llm-junior', toId: 'ai-llm-mid', type: 'promote',
    skills: ['RAG 系统全链路（Embedding/混合检索/Reranker）', 'LangChain/LlamaIndex 高级用法', '向量数据库选型与调优（Milvus/Weaviate）', 'Function Calling & Tool Use 设计', 'LLM 评估体系（RAGAS/MT-Bench）', 'Prompt 工程进阶（自一致性/思维树）', '流式输出与多轮对话状态管理'],
  },
  {
    fromId: 'ai-llm-mid', toId: 'ai-llm-senior', type: 'promote',
    skills: ['LLM 私有化部署（vLLM/Ollama/TGI）', 'Agent 框架架构（AutoGen/CrewAI/LangGraph）', '知识库系统架构（GraphRAG/长文档）', '多模态 LLM 集成（GPT-4V/Gemini/LLaVA）', '推理加速与量化（GPTQ/AWQ）', 'LLM 安全与对齐（越狱防御/输出过滤）', 'AI 产品化与商业化落地路径'],
  },

  /* ══ 跨领域转岗路径 ══ */
  {
    fromId: 'fe-vis-mid', toId: 'fe-react-junior', type: 'transfer',
    skills: ['React 18 Hooks 体系', 'Redux Toolkit 状态管理', 'TypeScript 类型安全', 'CSS-in-JS / Tailwind CSS', 'Vite 构建配置'],
  },
  {
    fromId: 'fe-react-mid', toId: 'fe-vis-junior', type: 'transfer',
    skills: ['D3.js 数据绑定与 SVG 操作', 'ECharts 配置与事件系统', 'Canvas 2D 绘图基础', '数据驱动动画原理', 'WebGL 三维可视化入门'],
  },
  {
    fromId: 'qa-mid', toId: 'fe-react-junior', type: 'transfer',
    skills: ['React 基础组件与 Hooks', 'TypeScript 类型定义', 'CSS Modules / Tailwind CSS', '前端性能基础（DevTools 分析）', 'Jest 单元测试'],
  },
  {
    fromId: 'qa-mid', toId: 'qa-plat-junior', type: 'transfer',
    skills: ['Python/Go 后端 API 开发', 'Vue 3 前端基础', 'MySQL 数据建模', 'Docker 容器化部署', 'RESTful API 设计规范'],
  },
  {
    fromId: 'be-java-mid', toId: 'be-go-junior', type: 'transfer',
    skills: ['Go 语言语法与 goroutine 并发', 'Gin 框架路由与中间件', 'GORM ORM 操作', 'Go 模块管理（go mod）', '协程与通道设计模式'],
  },
  {
    fromId: 'be-python-mid', toId: 'da-dev-junior', type: 'transfer',
    skills: ['Hive SQL / Spark SQL 大数据查询', 'Airflow ETL 调度', '数仓分层建模（ODS/DWD/ADS）', 'DataX 数据同步', 'Hadoop 生态基础（HDFS/YARN）'],
  },
  {
    fromId: 'da-biz-mid', toId: 'da-growth-mid', type: 'transfer',
    skills: ['AARRR 增长漏斗分析', 'A/B 实验增量评估', '渠道归因分析（MTA 模型）', 'Segment/Amplitude 用户行为平台', '增长黑客实验设计方法论'],
  },
  {
    fromId: 'da-dev-senior', toId: 'algo-recsys-junior', type: 'transfer',
    skills: ['Python 机器学习基础（sklearn）', '特征工程（离散化/交叉/嵌入）', '协同过滤原理与实现', 'TensorFlow/PyTorch 入门', 'A/B 实验与评估指标'],
  },
  {
    fromId: 'algo-recsys-mid', toId: 'dl-junior', type: 'transfer',
    skills: ['深度神经网络原理（正向/反向传播）', 'PyTorch 模型构建与训练循环', 'CNN/RNN 经典架构理解', 'Transformer 注意力机制', 'GPU 训练环境配置（CUDA）'],
  },
  {
    fromId: 'dl-mid', toId: 'ai-llm-junior', type: 'transfer',
    skills: ['大语言模型原理（预训练/微调/RLHF）', 'LangChain 应用框架', 'Prompt 工程方法论', 'RAG 检索增强基础', 'LLM API 调用与流式输出'],
  },

  /* ══ 补充转岗路径：保证每个晋升链节点都有 1-2 条转岗可达 ══ */

  /* 前端 Vue 线 → 其他线 */
  { fromId: 'fe-intern', toId: 'qa-intern', type: 'transfer',
    skills: ['测试用例设计方法论', 'Postman 接口验证', 'Bug 提报与缺陷跟踪', 'SQL 查询验证', 'Linux 基础操作'] },
  { fromId: 'fe-junior', toId: 'fe-react-junior', type: 'transfer',
    skills: ['React 18 Hooks 体系', 'Redux Toolkit 状态管理', 'JSX 语法与组件模式', 'React Router v6', 'React DevTools 调试'] },
  { fromId: 'fe-mid', toId: 'fe-vis-junior', type: 'transfer',
    skills: ['D3.js 数据绑定与选择集', 'ECharts 基础配置', 'Canvas 2D 绑定与动画', 'SVG 编程基础', '数据可视化设计原则'] },
  { fromId: 'fe-senior', toId: 'be-java-mid', type: 'transfer',
    skills: ['Spring Boot 核心原理', 'MySQL 索引与事务', 'Redis 缓存策略', 'Docker 容器化', 'RESTful API 规范设计'] },
  { fromId: 'fe-lead', toId: 'be-java-senior', type: 'transfer',
    skills: ['微服务架构设计', '分布式系统原理', 'Kubernetes 部署', '性能压测方法论', '技术团队管理'] },

  /* React 前端线 → 其他线 */
  { fromId: 'fe-react-intern', toId: 'fe-intern', type: 'transfer',
    skills: ['Vue 3 Composition API', 'Pinia 状态管理', 'Element Plus 组件库', 'Vue Router 守卫', 'Vite 构建配置'] },
  { fromId: 'fe-react-junior', toId: 'fe-vis-junior', type: 'transfer',
    skills: ['D3.js SVG 操作', 'Canvas 绑定与绘图', 'ECharts React 集成', '数据驱动可视化原理', '动画与过渡设计'] },
  { fromId: 'fe-react-senior', toId: 'fe-lead', type: 'transfer',
    skills: ['Vue 生态全栈能力', '技术规划与 Roadmap', '工程师面试体系', '跨部门协作能力', '技术债治理策略'] },

  /* 可视化线 → 其他线 */
  { fromId: 'fe-vis-junior', toId: 'da-biz-junior', type: 'transfer',
    skills: ['SQL 数据提取', 'Python Pandas 入门', '数据可视化叙事', 'A/B 测试基础', '业务指标理解'] },
  { fromId: 'fe-vis-senior', toId: 'dl-junior', type: 'transfer',
    skills: ['Python 数据处理', '深度学习基础', 'WebGL / GPU 编程原理', 'PyTorch 入门', '可视化与模型解释'] },

  /* Java 后端线 → 其他线 */
  { fromId: 'be-java-intern', toId: 'qa-intern', type: 'transfer',
    skills: ['测试基础方法论', 'Postman 接口测试', 'SQL 查询验证', 'Bug 管理流程', 'Linux 基本运维'] },
  { fromId: 'be-java-junior', toId: 'be-python-junior', type: 'transfer',
    skills: ['Python FastAPI 框架', 'SQLAlchemy ORM', 'Celery 任务队列', 'Docker 部署', 'Python 异步编程'] },
  { fromId: 'be-java-senior', toId: 'da-dev-mid', type: 'transfer',
    skills: ['Spark 离线计算', 'Flink 实时处理', '数仓建模方法论', 'Airflow ETL 管道', '数据质量监控'] },

  /* Go 后端线 → 其他线 */
  { fromId: 'be-go-intern', toId: 'be-java-intern', type: 'transfer',
    skills: ['Spring Boot 自动装配', 'MyBatis CRUD', 'Maven 依赖管理', 'Java 面向对象', 'JUnit 测试入门'] },
  { fromId: 'be-go-junior', toId: 'be-java-junior', type: 'transfer',
    skills: ['Spring Boot 微服务', 'MyBatis-Plus 高级用法', 'Redis 分布式锁', 'Docker 容器化', 'RabbitMQ 消息队列'] },
  { fromId: 'be-go-mid', toId: 'be-java-mid', type: 'transfer',
    skills: ['Spring Cloud 微服务', 'Kafka 消息队列', 'MySQL 分库分表', 'Kubernetes 部署', '分布式事务方案'] },
  { fromId: 'be-go-senior', toId: 'da-dev-senior', type: 'transfer',
    skills: ['数据中台架构', '流批一体设计', 'ETCD/Consul 服务发现', '大规模数据管道', '分布式计算原理'] },

  /* Python 后端线 → 其他线 */
  { fromId: 'be-python-intern', toId: 'da-biz-junior', type: 'transfer',
    skills: ['Python Pandas 数据分析', 'SQL 聚合查询', 'Matplotlib 可视化', '统计基础', 'Jupyter Notebook'] },
  { fromId: 'be-python-junior', toId: 'ai-llm-intern', type: 'transfer',
    skills: ['OpenAI API 调用', 'LangChain 基础', 'Prompt 工程入门', 'FastAPI AI 接口', '向量检索基础'] },
  { fromId: 'be-python-senior', toId: 'ai-llm-mid', type: 'transfer',
    skills: ['RAG 系统设计', '向量数据库调优', 'LLM 推理服务部署', 'Function Calling 设计', '流式对话管理'] },

  /* 自动化测试线 → 其他线 */
  { fromId: 'qa-intern', toId: 'fe-intern', type: 'transfer',
    skills: ['HTML/CSS 基础', 'JavaScript 入门', 'Vue 3 基础', 'Git 工作流', '浏览器 DevTools'] },
  { fromId: 'qa-junior', toId: 'qa-perf-junior', type: 'transfer',
    skills: ['JMeter 压测脚本', 'Linux 资源监控', 'SQL 慢查询分析', 'Prometheus 基础', '性能报告撰写'] },
  { fromId: 'qa-senior', toId: 'qa-plat-mid', type: 'transfer',
    skills: ['测试平台架构设计', 'Vue + FastAPI 全栈', '分布式调度', '质量看板可视化', 'CI/CD 深度集成'] },

  /* 质量平台线 → 其他线 */
  { fromId: 'qa-plat-junior', toId: 'be-python-junior', type: 'transfer',
    skills: ['FastAPI 服务开发', 'SQLAlchemy ORM', 'Celery 定时任务', 'Docker 部署', 'RESTful API 设计'] },
  { fromId: 'qa-plat-senior', toId: 'be-java-senior', type: 'transfer',
    skills: ['Spring Cloud 微服务', 'JVM 调优', 'DDD 架构设计', 'Kubernetes 运维', '研发效能度量体系'] },

  /* 性能测试线 → 其他线 */
  { fromId: 'qa-perf-intern', toId: 'qa-intern', type: 'transfer',
    skills: ['Python pytest 框架', 'Selenium 自动化', 'Postman 接口测试', 'SQL 验证', '缺陷管理流程'] },
  { fromId: 'qa-perf-junior', toId: 'be-java-junior', type: 'transfer',
    skills: ['Spring Boot 开发', 'MySQL 索引优化', 'Redis 缓存策略', 'Docker 部署', 'JVM 基础调参'] },
  { fromId: 'qa-perf-mid', toId: 'be-go-mid', type: 'transfer',
    skills: ['Go 高并发原语', 'Kubernetes 部署', 'Prometheus 自定义指标', 'pprof 性能分析', '分布式压测设计'] },
  { fromId: 'qa-perf-senior', toId: 'be-java-senior', type: 'transfer',
    skills: ['JVM 深度调优', '分布式系统架构', '全链路压测方案', 'Kubernetes 扩缩', '容量规划模型'] },

  /* 商业数据分析线 → 其他线 */
  { fromId: 'da-biz-junior', toId: 'da-growth-junior', type: 'transfer',
    skills: ['AARRR 增长模型', '用户行为分析', 'A/B 测试设计', '渠道归因基础', '增长实验方法论'] },
  { fromId: 'da-biz-senior', toId: 'da-dev-senior', type: 'transfer',
    skills: ['数据中台架构', '指标体系治理', 'Spark SQL 高级', '数据血缘追踪', 'DataOps 流程'] },

  /* 数据开发线 → 其他线 */
  { fromId: 'da-dev-junior', toId: 'be-python-junior', type: 'transfer',
    skills: ['FastAPI 服务开发', 'Python 异步编程', 'SQLAlchemy ORM', 'Docker 部署', 'Redis 缓存'] },
  { fromId: 'da-dev-mid', toId: 'algo-recsys-junior', type: 'transfer',
    skills: ['Python sklearn 入门', '特征工程方法', '协同过滤实现', 'A/B 实验评估', '模型评估指标'] },

  /* 增长分析线 → 其他线 */
  { fromId: 'da-growth-junior', toId: 'da-biz-junior', type: 'transfer',
    skills: ['SQL 数据提取', 'Tableau 可视化', '统计假设检验', '用户分群分析', '指标体系理解'] },
  { fromId: 'da-growth-mid', toId: 'algo-recsys-junior', type: 'transfer',
    skills: ['Python sklearn 建模', '特征工程基础', '协同过滤入门', '推荐 A/B 评估', 'TensorFlow 入门'] },
  { fromId: 'da-growth-senior', toId: 'ai-llm-mid', type: 'transfer',
    skills: ['RAG 系统设计', 'LLM 增长策略', '个性化推荐与 LLM', '数据驱动 AI 产品', '用户画像与 Embedding'] },

  /* 推荐算法线 → 其他线 */
  { fromId: 'algo-recsys-intern', toId: 'da-biz-junior', type: 'transfer',
    skills: ['SQL 数据分析', 'A/B 测试设计', '用户分群方法', 'Python Pandas', '业务指标理解'] },
  { fromId: 'algo-recsys-junior', toId: 'dl-junior', type: 'transfer',
    skills: ['深度学习基础', 'PyTorch 训练循环', 'CNN/RNN 架构', 'Transformer 原理', 'GPU 环境配置'] },
  { fromId: 'algo-recsys-senior', toId: 'ai-llm-mid', type: 'transfer',
    skills: ['RAG 检索增强', 'LLM 推荐融合', 'Embedding 技术', 'LangChain 高级', '大模型服务化'] },

  /* 深度学习线 → 其他线 */
  { fromId: 'dl-junior', toId: 'algo-recsys-junior', type: 'transfer',
    skills: ['协同过滤算法', '特征工程实践', 'Spark MLlib', 'A/B 实验评估', '推荐系统基础'] },
  { fromId: 'dl-senior', toId: 'ai-llm-senior', type: 'transfer',
    skills: ['LLM 私有化部署', 'Agent 框架设计', 'RLHF 对齐技术', '推理加速（vLLM）', 'AI 安全与合规'] },

  /* LLM 应用线 → 其他线 */
  { fromId: 'ai-llm-intern', toId: 'be-python-intern', type: 'transfer',
    skills: ['FastAPI 基础开发', 'Python 数据处理', 'Docker 环境', 'SQL 入门', 'Git 协作'] },
  { fromId: 'ai-llm-junior', toId: 'da-dev-junior', type: 'transfer',
    skills: ['Spark SQL 查询', 'Airflow 调度', '数仓分层概念', '数据质量基础', 'ETL 管道设计'] },
  { fromId: 'ai-llm-mid', toId: 'dl-mid', type: 'transfer',
    skills: ['模型蒸馏与量化', 'PyTorch 高级训练', '分布式训练（DDP）', 'TensorRT 推理加速', '混合精度训练'] },
  { fromId: 'ai-llm-senior', toId: 'dl-senior', type: 'transfer',
    skills: ['Foundation Model 预训练', '大规模分布式训练', '自研架构搜索', 'MLOps 自动化', 'AI 安全防御'] },
]
