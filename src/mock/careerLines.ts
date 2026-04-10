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
]
