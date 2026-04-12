/**
 * 职业能力图谱 — 数据提供者 & 同心圆布局
 * 本期：本地 mock 数据，返回 Promise 预留后续接口替换
 */

/* ═══ 类型定义 ═══ */

export type AbilityGroup = 'job' | 'professional' | 'position' | 'cognitive' | 'general'

export type EdgeRelationType = 'belong' | 'prerequisite' | 'synergy' | 'dependency'

export interface AbilityNode {
  id: string
  name: string
  level: number          // 0=岗位, 1=板块, 2+=子节点
  group: AbilityGroup
  parentId?: string
  heat?: number          // 节点权重/热度 0-100
}

export interface AbilityEdge {
  source: string
  target: string
  relation: EdgeRelationType
  label?: string         // 可选的关系描述文案
}

export interface AbilityGraphData {
  nodes: AbilityNode[]
  edges: AbilityEdge[]
}

/* ═══ 板块颜色 ═══ */
export const GROUP_COLORS: Record<AbilityGroup, string> = {
  job:          '#C03418',   // 朱砂 — 岗位中心
  professional: '#3478CC',   // 靛蓝 — 专业技能
  position:     '#D49428',   // 赭金 — 岗位技能
  cognitive:    '#2EA86C',   // 竹绿 — 认知技能
  general:      '#9266E8',   // 藤紫 — 通用技能
}

export const GROUP_LABELS: Record<AbilityGroup, string> = {
  job:          '岗位',
  professional: '专业技能',
  position:     '岗位技能',
  cognitive:    '认知技能',
  general:      '通用技能',
}

export const RELATION_STYLES: Record<EdgeRelationType, { label: string; dash: number[]; curveness: number; color: string }> = {
  belong:       { label: '归属',   dash: [],       curveness: 0.1,  color: 'rgba(192,52,24,0.5)' },
  prerequisite: { label: '前置',   dash: [6, 3],   curveness: 0.25, color: '#D45828' },
  synergy:      { label: '协同',   dash: [3, 3],   curveness: 0.3,  color: '#2EA86C' },
  dependency:   { label: '依赖',   dash: [10, 4],  curveness: 0.2,  color: '#3478CC' },
}

/* ═══ Mock 数据 ═══ */

function buildMockData(role: string): AbilityGraphData {
  const jobId = 'job-center'

  // 四大板块
  const boards: { id: string; group: AbilityGroup; name: string }[] = [
    { id: 'board-pro',  group: 'professional', name: '专业技能' },
    { id: 'board-pos',  group: 'position',     name: '岗位技能' },
    { id: 'board-cog',  group: 'cognitive',    name: '认知技能' },
    { id: 'board-gen',  group: 'general',      name: '通用技能' },
  ]

  // 各板块子节点 — 按岗位差异化
  const childrenMap: Record<string, { id: string; name: string; heat: number }[]> = getChildrenForRole(role)

  const nodes: AbilityNode[] = [
    { id: jobId, name: role || '前端开发', level: 0, group: 'job', heat: 100 },
  ]

  const edges: AbilityEdge[] = []

  boards.forEach(b => {
    nodes.push({ id: b.id, name: b.name, level: 1, group: b.group, parentId: jobId, heat: 85 })
    edges.push({ source: jobId, target: b.id, relation: 'belong' })

    const children = childrenMap[b.id] || []
    children.forEach(c => {
      nodes.push({ id: c.id, name: c.name, level: 2, group: b.group, parentId: b.id, heat: c.heat })
      edges.push({ source: b.id, target: c.id, relation: 'belong' })
    })
  })

  // 子节点间关系线
  const crossEdges = getCrossEdgesForRole(role)
  edges.push(...crossEdges)

  return { nodes, edges }
}

function getChildrenForRole(role: string): Record<string, { id: string; name: string; heat: number }[]> {
  const ALIAS: Record<string, string> = {
    '前端开发':     'Vue 前端工程师',
    '后端开发':     'Java 后端工程师',
    '测试开发':     '自动化测试工程师',
    '数据分析':     '商业数据分析师',
    '机器学习工程师': '算法工程师',
  }
  const resolved = ALIAS[role] ?? role

  const MAP: Record<string, Record<string, { id: string; name: string; heat: number }[]>> = {

    /* ──────── 前端领域 ──────── */

    'Vue 前端工程师': {
      'board-pro': [
        { id: 'pro-vue3',    name: 'Vue 3',          heat: 94 },
        { id: 'pro-ts',      name: 'TypeScript',      heat: 90 },
        { id: 'pro-pinia',   name: 'Pinia',           heat: 86 },
        { id: 'pro-router',  name: 'Vue Router',      heat: 84 },
        { id: 'pro-vite',    name: 'Vite',            heat: 82 },
        { id: 'pro-elplus',  name: 'Element Plus',    heat: 78 },
        { id: 'pro-nuxt',    name: 'Nuxt.js',         heat: 72 },
        { id: 'pro-css',     name: 'CSS / 动效',      heat: 76 },
        { id: 'pro-echarts', name: 'ECharts',         heat: 68 },
        { id: 'pro-node',    name: 'Node.js',         heat: 64 },
      ],
      'board-pos': [
        { id: 'pos-arch',    name: '前端架构',        heat: 84 },
        { id: 'pos-perf',    name: '性能优化',        heat: 80 },
        { id: 'pos-ssr',     name: 'SSR / 首屏',      heat: 66 },
        { id: 'pos-build',   name: '工程化 / 构建',   heat: 76 },
        { id: 'pos-test',    name: '前端测试',        heat: 64 },
        { id: 'pos-mfe',     name: '微前端',          heat: 62 },
        { id: 'pos-comp',    name: '组件库设计',      heat: 72 },
        { id: 'pos-cross',   name: '跨端适配',        heat: 60 },
      ],
      'board-cog': [
        { id: 'cog-algo',    name: '算法与数据结构',  heat: 74 },
        { id: 'cog-design',  name: '系统设计',        heat: 70 },
        { id: 'cog-network', name: '网络协议',        heat: 68 },
        { id: 'cog-browser', name: '浏览器原理',      heat: 65 },
        { id: 'cog-sec',     name: 'Web 安全',        heat: 60 },
        { id: 'cog-pattern', name: '设计模式',        heat: 62 },
        { id: 'cog-render',  name: '渲染原理',        heat: 58 },
      ],
      'board-gen': [
        { id: 'gen-git',     name: 'Git / 协作',      heat: 74 },
        { id: 'gen-ci',      name: 'CI/CD',           heat: 68 },
        { id: 'gen-docker',  name: 'Docker 基础',     heat: 60 },
        { id: 'gen-linux',   name: 'Linux 基础',      heat: 58 },
        { id: 'gen-doc',     name: '技术文档',        heat: 54 },
        { id: 'gen-comm',    name: '跨团队沟通',      heat: 52 },
        { id: 'gen-review',  name: '代码审查',        heat: 56 },
      ],
    },

    'React 前端工程师': {
      'board-pro': [
        { id: 'pro-react',   name: 'React',           heat: 94 },
        { id: 'pro-ts',      name: 'TypeScript',      heat: 90 },
        { id: 'pro-redux',   name: 'Redux / Zustand', heat: 84 },
        { id: 'pro-next',    name: 'Next.js',         heat: 86 },
        { id: 'pro-rq',      name: 'React Query',     heat: 80 },
        { id: 'pro-sc',      name: 'Styled Components',heat: 72 },
        { id: 'pro-webpack', name: 'Webpack / Rspack', heat: 76 },
        { id: 'pro-sb',      name: 'Storybook',       heat: 64 },
        { id: 'pro-rn',      name: 'React Native',    heat: 68 },
        { id: 'pro-css',     name: 'CSS / TailwindCSS', heat: 78 },
      ],
      'board-pos': [
        { id: 'pos-arch',    name: '前端架构',        heat: 84 },
        { id: 'pos-perf',    name: '性能优化',        heat: 80 },
        { id: 'pos-ssg',     name: 'SSR / SSG',       heat: 70 },
        { id: 'pos-build',   name: '工程化 / 构建',   heat: 76 },
        { id: 'pos-test',    name: '前端测试',        heat: 66 },
        { id: 'pos-mfe',     name: '微前端',          heat: 62 },
        { id: 'pos-comp',    name: '组件库建设',      heat: 72 },
        { id: 'pos-pwa',     name: 'PWA',             heat: 58 },
      ],
      'board-cog': [
        { id: 'cog-algo',    name: '算法与数据结构',  heat: 74 },
        { id: 'cog-design',  name: '系统设计',        heat: 70 },
        { id: 'cog-network', name: '网络协议',        heat: 68 },
        { id: 'cog-fp',      name: '函数式编程',      heat: 66 },
        { id: 'cog-sec',     name: 'Web 安全',        heat: 60 },
        { id: 'cog-pattern', name: '设计模式',        heat: 64 },
        { id: 'cog-render',  name: '渲染原理',        heat: 60 },
      ],
      'board-gen': [
        { id: 'gen-git',     name: 'Git / 协作',      heat: 74 },
        { id: 'gen-ci',      name: 'CI/CD',           heat: 68 },
        { id: 'gen-docker',  name: 'Docker 基础',     heat: 60 },
        { id: 'gen-linux',   name: 'Linux 基础',      heat: 58 },
        { id: 'gen-doc',     name: '技术文档',        heat: 54 },
        { id: 'gen-comm',    name: '跨团队沟通',      heat: 52 },
        { id: 'gen-review',  name: '代码审查',        heat: 56 },
      ],
    },

    '可视化工程师': {
      'board-pro': [
        { id: 'pro-d3',      name: 'D3.js',           heat: 92 },
        { id: 'pro-echarts', name: 'ECharts',         heat: 90 },
        { id: 'pro-three',   name: 'Three.js',        heat: 84 },
        { id: 'pro-webgl',   name: 'WebGL / GLSL',    heat: 80 },
        { id: 'pro-canvas',  name: 'Canvas / SVG',    heat: 86 },
        { id: 'pro-ts',      name: 'TypeScript',      heat: 82 },
        { id: 'pro-vue',     name: 'Vue 3 / React',   heat: 76 },
        { id: 'pro-cesium',  name: 'Cesium / MapboxGL', heat: 70 },
        { id: 'pro-gsap',    name: 'GSAP 动效',       heat: 68 },
        { id: 'pro-data',    name: '数据处理 / ETL',  heat: 72 },
        { id: 'pro-pixi',    name: 'PixiJS',          heat: 62 },
      ],
      'board-pos': [
        { id: 'pos-chart',   name: '图表系统设计',    heat: 86 },
        { id: 'pos-bigscreen', name: '大屏开发',      heat: 84 },
        { id: 'pos-gis',     name: 'GIS / 地图',      heat: 76 },
        { id: 'pos-3d',      name: '3D 场景搭建',     heat: 74 },
        { id: 'pos-realtime', name: '实时数据渲染',   heat: 78 },
        { id: 'pos-interact', name: '交互设计',       heat: 72 },
        { id: 'pos-perf',    name: '渲染性能优化',    heat: 80 },
        { id: 'pos-anim',    name: '动效系统',        heat: 68 },
      ],
      'board-cog': [
        { id: 'cog-math',    name: '线性代数 / 数学', heat: 78 },
        { id: 'cog-graphics', name: '图形学基础',     heat: 76 },
        { id: 'cog-color',   name: '色彩与感知理论',  heat: 68 },
        { id: 'cog-data',    name: '数据分析思维',    heat: 72 },
        { id: 'cog-ux',      name: '用户体验原理',    heat: 66 },
        { id: 'cog-design',  name: '系统设计',        heat: 64 },
        { id: 'cog-network', name: '网络协议',        heat: 58 },
        { id: 'cog-render',  name: '渲染管线原理',    heat: 74 },
      ],
      'board-gen': [
        { id: 'gen-git',     name: 'Git / 协作',      heat: 72 },
        { id: 'gen-ci',      name: 'CI/CD',           heat: 64 },
        { id: 'gen-linux',   name: 'Linux 基础',      heat: 56 },
        { id: 'gen-doc',     name: '技术文档',        heat: 56 },
        { id: 'gen-comm',    name: '跨团队沟通',      heat: 54 },
        { id: 'gen-design',  name: '设计协作',        heat: 60 },
        { id: 'gen-review',  name: '代码审查',        heat: 54 },
      ],
    },

    /* ──────── 后端领域 ──────── */

    'Java 后端工程师': {
      'board-pro': [
        { id: 'pro-java',    name: 'Java / JVM',      heat: 96 },
        { id: 'pro-spring',  name: 'Spring Boot',     heat: 94 },
        { id: 'pro-cloud',   name: 'Spring Cloud',    heat: 86 },
        { id: 'pro-mybatis', name: 'MyBatis / JPA',   heat: 84 },
        { id: 'pro-mysql',   name: 'MySQL',           heat: 90 },
        { id: 'pro-redis',   name: 'Redis',           heat: 88 },
        { id: 'pro-mq',      name: 'RabbitMQ / Kafka', heat: 82 },
        { id: 'pro-grpc',    name: 'Dubbo / gRPC',    heat: 78 },
        { id: 'pro-es',      name: 'Elasticsearch',   heat: 74 },
        { id: 'pro-nginx',   name: 'Nginx',           heat: 70 },
        { id: 'pro-docker',  name: 'Docker',          heat: 76 },
        { id: 'pro-micro',   name: '微服务架构',      heat: 84 },
      ],
      'board-pos': [
        { id: 'pos-api',     name: 'REST API 设计',   heat: 88 },
        { id: 'pos-dbmodel', name: '数据库建模',      heat: 84 },
        { id: 'pos-concur',  name: '高并发设计',      heat: 86 },
        { id: 'pos-dtx',     name: '分布式事务',      heat: 80 },
        { id: 'pos-cache',   name: '缓存策略',        heat: 82 },
        { id: 'pos-log',     name: '日志 / 监控',     heat: 78 },
        { id: 'pos-perf',    name: '性能调优',        heat: 80 },
        { id: 'pos-jvm',     name: 'JVM 调优',        heat: 76 },
        { id: 'pos-ratelimit', name: '限流 / 熔断',   heat: 74 },
      ],
      'board-cog': [
        { id: 'cog-algo',    name: '数据结构与算法',  heat: 80 },
        { id: 'cog-pattern', name: '设计模式',        heat: 78 },
        { id: 'cog-os',      name: '操作系统原理',    heat: 72 },
        { id: 'cog-network', name: '网络协议',        heat: 74 },
        { id: 'cog-design',  name: '系统设计',        heat: 82 },
        { id: 'cog-dist',    name: '分布式理论',      heat: 78 },
        { id: 'cog-db',      name: '数据库原理',      heat: 76 },
      ],
      'board-gen': [
        { id: 'gen-git',     name: 'Git / 协作',      heat: 76 },
        { id: 'gen-ci',      name: 'CI/CD',           heat: 72 },
        { id: 'gen-k8s',     name: 'Docker / K8s',    heat: 74 },
        { id: 'gen-linux',   name: 'Linux',           heat: 76 },
        { id: 'gen-doc',     name: '技术文档',        heat: 60 },
        { id: 'gen-comm',    name: '跨团队沟通',      heat: 56 },
        { id: 'gen-review',  name: '代码审查',        heat: 66 },
        { id: 'gen-apidoc',  name: '接口文档',        heat: 64 },
      ],
    },

    'Go 后端工程师': {
      'board-pro': [
        { id: 'pro-go',      name: 'Golang',          heat: 96 },
        { id: 'pro-gin',     name: 'Gin / Echo',      heat: 90 },
        { id: 'pro-grpc',    name: 'gRPC / Protobuf', heat: 88 },
        { id: 'pro-etcd',    name: 'etcd',            heat: 80 },
        { id: 'pro-mysql',   name: 'MySQL',           heat: 86 },
        { id: 'pro-redis',   name: 'Redis',           heat: 84 },
        { id: 'pro-kafka',   name: 'Kafka',           heat: 80 },
        { id: 'pro-k8s',     name: 'Kubernetes',      heat: 78 },
        { id: 'pro-docker',  name: 'Docker',          heat: 80 },
        { id: 'pro-goroutine', name: '协程 / Channel', heat: 88 },
      ],
      'board-pos': [
        { id: 'pos-api',     name: 'REST API 设计',   heat: 86 },
        { id: 'pos-dbmodel', name: '数据库建模',      heat: 80 },
        { id: 'pos-concur',  name: '高并发设计',      heat: 88 },
        { id: 'pos-micro',   name: '微服务治理',      heat: 84 },
        { id: 'pos-sd',      name: '服务发现 / 注册', heat: 78 },
        { id: 'pos-ratelimit', name: '限流 / 熔断',   heat: 76 },
        { id: 'pos-trace',   name: '链路追踪',        heat: 74 },
        { id: 'pos-log',     name: '日志 / 监控',     heat: 78 },
        { id: 'pos-perf',    name: '性能调优',        heat: 82 },
      ],
      'board-cog': [
        { id: 'cog-algo',    name: '数据结构与算法',  heat: 82 },
        { id: 'cog-pattern', name: '设计模式',        heat: 76 },
        { id: 'cog-os',      name: '操作系统原理',    heat: 76 },
        { id: 'cog-network', name: '网络协议',        heat: 76 },
        { id: 'cog-design',  name: '系统设计',        heat: 84 },
        { id: 'cog-dist',    name: '分布式理论',      heat: 80 },
        { id: 'cog-concur',  name: '并发编程原理',    heat: 82 },
      ],
      'board-gen': [
        { id: 'gen-git',     name: 'Git / 协作',      heat: 76 },
        { id: 'gen-ci',      name: 'CI/CD',           heat: 72 },
        { id: 'gen-k8s',     name: 'Docker / K8s',    heat: 78 },
        { id: 'gen-linux',   name: 'Linux',           heat: 78 },
        { id: 'gen-doc',     name: '技术文档',        heat: 60 },
        { id: 'gen-comm',    name: '跨团队沟通',      heat: 56 },
        { id: 'gen-review',  name: '代码审查',        heat: 66 },
      ],
    },

    'Python 后端工程师': {
      'board-pro': [
        { id: 'pro-python',  name: 'Python',          heat: 96 },
        { id: 'pro-django',  name: 'Django',          heat: 88 },
        { id: 'pro-fastapi', name: 'FastAPI',         heat: 86 },
        { id: 'pro-celery',  name: 'Celery',          heat: 78 },
        { id: 'pro-sqlalchemy', name: 'SQLAlchemy',   heat: 80 },
        { id: 'pro-mysql',   name: 'MySQL / PgSQL',   heat: 86 },
        { id: 'pro-redis',   name: 'Redis',           heat: 82 },
        { id: 'pro-mq',      name: 'RabbitMQ / Kafka', heat: 76 },
        { id: 'pro-nginx',   name: 'Nginx / Gunicorn', heat: 72 },
        { id: 'pro-docker',  name: 'Docker',          heat: 76 },
      ],
      'board-pos': [
        { id: 'pos-api',     name: 'REST API 设计',   heat: 86 },
        { id: 'pos-orm',     name: 'ORM 建模',        heat: 80 },
        { id: 'pos-async',   name: '异步任务设计',    heat: 78 },
        { id: 'pos-data',    name: '数据处理流水线',  heat: 76 },
        { id: 'pos-cache',   name: '缓存策略',        heat: 78 },
        { id: 'pos-log',     name: '日志 / 监控',     heat: 74 },
        { id: 'pos-perf',    name: '性能调优',        heat: 76 },
        { id: 'pos-sec',     name: '接口安全',        heat: 72 },
      ],
      'board-cog': [
        { id: 'cog-algo',    name: '数据结构与算法',  heat: 78 },
        { id: 'cog-pattern', name: '设计模式',        heat: 74 },
        { id: 'cog-os',      name: '操作系统原理',    heat: 70 },
        { id: 'cog-network', name: '网络协议',        heat: 72 },
        { id: 'cog-design',  name: '系统设计',        heat: 78 },
        { id: 'cog-db',      name: '数据库原理',      heat: 76 },
        { id: 'cog-fp',      name: '函数式编程',      heat: 68 },
      ],
      'board-gen': [
        { id: 'gen-git',     name: 'Git / 协作',      heat: 74 },
        { id: 'gen-ci',      name: 'CI/CD',           heat: 70 },
        { id: 'gen-k8s',     name: 'Docker / K8s',    heat: 72 },
        { id: 'gen-linux',   name: 'Linux',           heat: 74 },
        { id: 'gen-doc',     name: '技术文档',        heat: 60 },
        { id: 'gen-comm',    name: '跨团队沟通',      heat: 56 },
        { id: 'gen-review',  name: '代码审查',        heat: 64 },
      ],
    },

    /* ──────── 测试领域 ──────── */

    '自动化测试工程师': {
      'board-pro': [
        { id: 'pro-selenium', name: 'Selenium / WebDriver', heat: 90 },
        { id: 'pro-playwright', name: 'Playwright',  heat: 86 },
        { id: 'pro-appium',  name: 'Appium',         heat: 78 },
        { id: 'pro-pytest',  name: 'pytest / unittest', heat: 88 },
        { id: 'pro-testng',  name: 'TestNG / JUnit', heat: 80 },
        { id: 'pro-robot',   name: 'Robot Framework', heat: 74 },
        { id: 'pro-python',  name: 'Python / Java',  heat: 86 },
        { id: 'pro-api',     name: 'API 自动化测试', heat: 84 },
        { id: 'pro-jenkins', name: 'Jenkins',        heat: 78 },
        { id: 'pro-docker',  name: 'Docker',         heat: 72 },
      ],
      'board-pos': [
        { id: 'pos-framework', name: '测试框架设计', heat: 84 },
        { id: 'pos-case',    name: '用例设计',       heat: 86 },
        { id: 'pos-ci',      name: '持续集成测试',   heat: 80 },
        { id: 'pos-report',  name: '测试报告体系',   heat: 76 },
        { id: 'pos-data',    name: '测试数据管理',   heat: 74 },
        { id: 'pos-mock',    name: 'Mock 服务',      heat: 78 },
        { id: 'pos-env',     name: '环境管理',       heat: 70 },
        { id: 'pos-metric',  name: '质量度量',       heat: 72 },
      ],
      'board-cog': [
        { id: 'cog-theory',  name: '软件测试理论',   heat: 80 },
        { id: 'cog-defect',  name: '缺陷分析',       heat: 76 },
        { id: 'cog-risk',    name: '风险评估',       heat: 72 },
        { id: 'cog-strategy', name: '测试策略',      heat: 78 },
        { id: 'cog-perf',    name: '性能基础',       heat: 66 },
        { id: 'cog-sec',     name: '安全测试基础',   heat: 64 },
        { id: 'cog-pattern', name: '设计模式',       heat: 62 },
      ],
      'board-gen': [
        { id: 'gen-git',     name: 'Git / 协作',     heat: 74 },
        { id: 'gen-ci',      name: 'CI/CD',          heat: 76 },
        { id: 'gen-linux',   name: 'Linux 基础',     heat: 64 },
        { id: 'gen-doc',     name: '技术文档',       heat: 62 },
        { id: 'gen-comm',    name: '跨团队沟通',     heat: 66 },
        { id: 'gen-review',  name: '代码审查',       heat: 60 },
        { id: 'gen-agile',   name: '敏捷协作',       heat: 68 },
      ],
    },

    '质量平台工程师': {
      'board-pro': [
        { id: 'pro-platform', name: '测试平台开发',  heat: 90 },
        { id: 'pro-python',  name: 'Python / Java',  heat: 86 },
        { id: 'pro-mysql',   name: 'MySQL',          heat: 82 },
        { id: 'pro-es',      name: 'Elasticsearch',  heat: 78 },
        { id: 'pro-kafka',   name: 'Kafka',          heat: 74 },
        { id: 'pro-report',  name: '可视化报表',     heat: 80 },
        { id: 'pro-docker',  name: 'Docker',         heat: 72 },
        { id: 'pro-pipeline', name: 'CI 流水线',     heat: 84 },
        { id: 'pro-collect', name: '数据采集系统',   heat: 76 },
      ],
      'board-pos': [
        { id: 'pos-metric',  name: '质量度量体系',   heat: 88 },
        { id: 'pos-ci',      name: '自动化集成',     heat: 84 },
        { id: 'pos-manage',  name: '测试管理',       heat: 82 },
        { id: 'pos-risk',    name: '风险看板',       heat: 78 },
        { id: 'pos-coverage', name: '覆盖率分析',    heat: 80 },
        { id: 'pos-efficiency', name: '效能分析',    heat: 76 },
        { id: 'pos-standard', name: '规范制定',      heat: 72 },
        { id: 'pos-infra',   name: '测试基础设施',   heat: 74 },
      ],
      'board-cog': [
        { id: 'cog-theory',  name: '软件测试理论',   heat: 80 },
        { id: 'cog-quality', name: '质量管理',       heat: 82 },
        { id: 'cog-data',    name: '数据分析',       heat: 78 },
        { id: 'cog-design',  name: '系统设计',       heat: 76 },
        { id: 'cog-process', name: '流程优化',       heat: 74 },
        { id: 'cog-metric',  name: '度量指标设计',   heat: 78 },
        { id: 'cog-defect',  name: '缺陷分析',       heat: 72 },
      ],
      'board-gen': [
        { id: 'gen-git',     name: 'Git / 协作',     heat: 74 },
        { id: 'gen-ci',      name: 'CI/CD',          heat: 78 },
        { id: 'gen-linux',   name: 'Linux 基础',     heat: 64 },
        { id: 'gen-doc',     name: '技术文档',       heat: 64 },
        { id: 'gen-comm',    name: '跨团队沟通',     heat: 70 },
        { id: 'gen-pm',      name: '项目管理',       heat: 68 },
        { id: 'gen-review',  name: '代码审查',       heat: 60 },
      ],
    },

    '性能测试工程师': {
      'board-pro': [
        { id: 'pro-jmeter',  name: 'JMeter',         heat: 92 },
        { id: 'pro-locust',  name: 'Locust',         heat: 84 },
        { id: 'pro-k6',      name: 'k6',             heat: 78 },
        { id: 'pro-gatling', name: 'Gatling',        heat: 74 },
        { id: 'pro-python',  name: 'Python / Java',  heat: 80 },
        { id: 'pro-apm',     name: 'APM 监控',       heat: 84 },
        { id: 'pro-script',  name: '压测脚本',       heat: 86 },
        { id: 'pro-analyze', name: '性能分析',       heat: 88 },
        { id: 'pro-mysql',   name: 'MySQL 调优',     heat: 76 },
      ],
      'board-pos': [
        { id: 'pos-design',  name: '压测方案设计',   heat: 88 },
        { id: 'pos-baseline', name: '性能基准测试',  heat: 86 },
        { id: 'pos-bottleneck', name: '瓶颈分析',    heat: 90 },
        { id: 'pos-capacity', name: '容量规划',      heat: 82 },
        { id: 'pos-trace',   name: '链路追踪',       heat: 78 },
        { id: 'pos-jvm',     name: 'JVM 调优',       heat: 76 },
        { id: 'pos-db',      name: '数据库调优',     heat: 80 },
        { id: 'pos-report',  name: '报告撰写',       heat: 74 },
      ],
      'board-cog': [
        { id: 'cog-os',      name: '操作系统原理',   heat: 80 },
        { id: 'cog-network', name: '网络协议',       heat: 78 },
        { id: 'cog-db',      name: '数据库原理',     heat: 76 },
        { id: 'cog-arch',    name: '系统架构',       heat: 82 },
        { id: 'cog-stat',    name: '统计学基础',     heat: 72 },
        { id: 'cog-model',   name: '性能模型',       heat: 76 },
        { id: 'cog-defect',  name: '缺陷分析',       heat: 70 },
        { id: 'cog-algo',    name: '数据结构与算法', heat: 68 },
      ],
      'board-gen': [
        { id: 'gen-git',     name: 'Git / 协作',     heat: 70 },
        { id: 'gen-ci',      name: 'CI/CD',          heat: 70 },
        { id: 'gen-linux',   name: 'Linux',          heat: 76 },
        { id: 'gen-doc',     name: '技术文档',       heat: 64 },
        { id: 'gen-comm',    name: '跨团队沟通',     heat: 64 },
        { id: 'gen-monitor', name: '监控工具',       heat: 78 },
        { id: 'gen-review',  name: '代码审查',       heat: 58 },
      ],
    },

    /* ──────── 数据领域 ──────── */

    '商业数据分析师': {
      'board-pro': [
        { id: 'pro-python',  name: 'Python / Pandas', heat: 88 },
        { id: 'pro-sql',     name: 'SQL',             heat: 92 },
        { id: 'pro-bi',      name: 'BI 工具',         heat: 86 },
        { id: 'pro-tableau', name: 'Tableau / PowerBI', heat: 80 },
        { id: 'pro-excel',   name: 'Excel / 高级函数', heat: 82 },
        { id: 'pro-stat',    name: '统计分析',        heat: 84 },
        { id: 'pro-clean',   name: '数据清洗',        heat: 80 },
        { id: 'pro-dw',      name: '数仓基础',        heat: 74 },
        { id: 'pro-viz',     name: '数据可视化',      heat: 82 },
      ],
      'board-pos': [
        { id: 'pos-metric',  name: '指标体系设计',    heat: 88 },
        { id: 'pos-report',  name: '分析报告',        heat: 84 },
        { id: 'pos-insight', name: '业务洞察',        heat: 86 },
        { id: 'pos-dashboard', name: '数据看板',      heat: 82 },
        { id: 'pos-market',  name: '市场分析',        heat: 78 },
        { id: 'pos-user',    name: '用户画像',        heat: 80 },
        { id: 'pos-funnel',  name: '漏斗分析',        heat: 78 },
        { id: 'pos-ab',      name: 'A/B 测试',        heat: 76 },
      ],
      'board-cog': [
        { id: 'cog-stat',    name: '统计学',          heat: 84 },
        { id: 'cog-biz',     name: '商业思维',        heat: 86 },
        { id: 'cog-data',    name: '数据思维',        heat: 88 },
        { id: 'cog-prob',    name: '概率论',          heat: 78 },
        { id: 'cog-ops',     name: '运营策略',        heat: 76 },
        { id: 'cog-psych',   name: '用户心理',        heat: 72 },
        { id: 'cog-mkt',     name: '市场营销基础',    heat: 70 },
        { id: 'cog-econ',    name: '经济学基础',      heat: 68 },
      ],
      'board-gen': [
        { id: 'gen-git',     name: 'Git 基础',        heat: 60 },
        { id: 'gen-doc',     name: '技术文档',        heat: 70 },
        { id: 'gen-comm',    name: '跨部门沟通',      heat: 76 },
        { id: 'gen-excel',   name: 'Excel / PPT',     heat: 78 },
        { id: 'gen-present', name: '演讲汇报',        heat: 74 },
        { id: 'gen-ethics',  name: '数据伦理',        heat: 62 },
        { id: 'gen-pm',      name: '项目管理',        heat: 66 },
      ],
    },

    '数据开发工程师': {
      'board-pro': [
        { id: 'pro-spark',   name: 'Spark',           heat: 92 },
        { id: 'pro-flink',   name: 'Flink',           heat: 88 },
        { id: 'pro-hive',    name: 'Hive / HQL',      heat: 86 },
        { id: 'pro-hdfs',    name: 'Hadoop / HDFS',   heat: 80 },
        { id: 'pro-kafka',   name: 'Kafka',           heat: 84 },
        { id: 'pro-mysql',   name: 'MySQL',           heat: 82 },
        { id: 'pro-datax',   name: 'DataX / Sqoop',   heat: 74 },
        { id: 'pro-airflow', name: 'Airflow',         heat: 78 },
        { id: 'pro-python',  name: 'Python / Scala',  heat: 84 },
        { id: 'pro-presto',  name: 'Presto / ClickHouse', heat: 76 },
      ],
      'board-pos': [
        { id: 'pos-dw',      name: '数仓建模 (ODS/DWD/DWS/ADS)', heat: 90 },
        { id: 'pos-etl',     name: 'ETL 设计',        heat: 88 },
        { id: 'pos-quality', name: '数据质量',        heat: 84 },
        { id: 'pos-realtime', name: '实时计算',       heat: 86 },
        { id: 'pos-schedule', name: '调度管理',       heat: 80 },
        { id: 'pos-govern',  name: '数据治理',        heat: 82 },
        { id: 'pos-perf',    name: 'SQL 性能调优',    heat: 84 },
        { id: 'pos-lineage', name: '数据血缘',        heat: 76 },
      ],
      'board-cog': [
        { id: 'cog-dist',    name: '分布式计算原理',  heat: 82 },
        { id: 'cog-db',      name: '数据库原理',      heat: 80 },
        { id: 'cog-algo',    name: '数据结构与算法',  heat: 76 },
        { id: 'cog-design',  name: '系统设计',        heat: 78 },
        { id: 'cog-network', name: '网络协议',        heat: 66 },
        { id: 'cog-storage', name: '存储原理',        heat: 74 },
        { id: 'cog-sql',     name: 'SQL 优化',        heat: 82 },
      ],
      'board-gen': [
        { id: 'gen-git',     name: 'Git / 协作',      heat: 72 },
        { id: 'gen-ci',      name: 'CI/CD',           heat: 68 },
        { id: 'gen-linux',   name: 'Linux',           heat: 74 },
        { id: 'gen-doc',     name: '技术文档',        heat: 62 },
        { id: 'gen-comm',    name: '跨团队沟通',      heat: 60 },
        { id: 'gen-review',  name: '代码审查',        heat: 64 },
        { id: 'gen-shell',   name: 'Shell 脚本',      heat: 70 },
        { id: 'gen-schedule', name: '调度工具使用',   heat: 68 },
      ],
    },

    '增长分析师': {
      'board-pro': [
        { id: 'pro-python',  name: 'Python',          heat: 84 },
        { id: 'pro-sql',     name: 'SQL',             heat: 90 },
        { id: 'pro-ab',      name: 'A/B 测试',        heat: 92 },
        { id: 'pro-funnel',  name: '漏斗分析',        heat: 88 },
        { id: 'pro-attr',    name: '归因模型',        heat: 84 },
        { id: 'pro-growth',  name: '增长黑客工具',    heat: 80 },
        { id: 'pro-bi',      name: 'BI 工具',         heat: 78 },
        { id: 'pro-track',   name: '埋点分析',        heat: 86 },
        { id: 'pro-segment', name: '用户分层',        heat: 82 },
        { id: 'pro-heatmap', name: '热图 / 行为分析', heat: 76 },
      ],
      'board-pos': [
        { id: 'pos-exp',     name: '增长实验设计',    heat: 90 },
        { id: 'pos-acquire', name: '用户获取分析',    heat: 86 },
        { id: 'pos-retain',  name: '留存分析',        heat: 88 },
        { id: 'pos-revenue', name: '变现分析',        heat: 82 },
        { id: 'pos-channel', name: '渠道归因',        heat: 84 },
        { id: 'pos-ltv',     name: 'LTV 分析',        heat: 80 },
        { id: 'pos-nps',     name: 'NPS 分析',        heat: 72 },
        { id: 'pos-strategy', name: '增长策略',       heat: 86 },
      ],
      'board-cog': [
        { id: 'cog-stat',    name: '统计学',          heat: 84 },
        { id: 'cog-psych',   name: '行为心理学',      heat: 80 },
        { id: 'cog-biz',     name: '商业思维',        heat: 84 },
        { id: 'cog-growth',  name: '增长理论',        heat: 86 },
        { id: 'cog-ux',      name: '用户体验',        heat: 76 },
        { id: 'cog-prob',    name: '概率论',          heat: 80 },
        { id: 'cog-causal',  name: '因果推断',        heat: 78 },
        { id: 'cog-game',    name: '博弈论基础',      heat: 66 },
      ],
      'board-gen': [
        { id: 'gen-doc',     name: '技术文档',        heat: 70 },
        { id: 'gen-comm',    name: '跨部门沟通',      heat: 76 },
        { id: 'gen-present', name: '演讲汇报',        heat: 74 },
        { id: 'gen-pm',      name: '项目管理',        heat: 70 },
        { id: 'gen-ethics',  name: '数据伦理',        heat: 62 },
        { id: 'gen-excel',   name: 'Excel / Sheets',  heat: 72 },
        { id: 'gen-git',     name: 'Git 基础',        heat: 58 },
      ],
    },

    /* ──────── 机器学习领域 ──────── */

    '算法工程师': {
      'board-pro': [
        { id: 'pro-python',  name: 'Python',          heat: 92 },
        { id: 'pro-ml',      name: '机器学习',        heat: 94 },
        { id: 'pro-rec',     name: '推荐系统',        heat: 90 },
        { id: 'pro-xgb',     name: 'XGBoost / LightGBM', heat: 86 },
        { id: 'pro-feat',    name: '特征工程',        heat: 88 },
        { id: 'pro-spark',   name: 'Spark MLlib',     heat: 80 },
        { id: 'pro-sklearn', name: 'scikit-learn',    heat: 84 },
        { id: 'pro-ab',      name: 'A/B 实验',        heat: 82 },
        { id: 'pro-sql',     name: 'SQL / 数据处理',  heat: 80 },
        { id: 'pro-rank',    name: '排序学习',        heat: 84 },
      ],
      'board-pos': [
        { id: 'pos-scheme',  name: '算法方案设计',    heat: 90 },
        { id: 'pos-feat',    name: '特征选择',        heat: 86 },
        { id: 'pos-eval',    name: '模型评估',        heat: 88 },
        { id: 'pos-deploy',  name: '线上部署',        heat: 84 },
        { id: 'pos-ab',      name: 'AB 实验',         heat: 86 },
        { id: 'pos-effect',  name: '效果分析',        heat: 82 },
        { id: 'pos-recall',  name: '召回策略',        heat: 84 },
        { id: 'pos-rank',    name: '排序优化',        heat: 86 },
      ],
      'board-cog': [
        { id: 'cog-math',    name: '数学 / 线性代数', heat: 84 },
        { id: 'cog-stat',    name: '统计学',          heat: 82 },
        { id: 'cog-opt',     name: '优化理论',        heat: 80 },
        { id: 'cog-info',    name: '信息论',          heat: 76 },
        { id: 'cog-pgm',     name: '概率图模型',      heat: 78 },
        { id: 'cog-algo',    name: '数据结构与算法',  heat: 80 },
        { id: 'cog-theory',  name: '计算理论',        heat: 72 },
        { id: 'cog-causal',  name: '因果推断',        heat: 76 },
      ],
      'board-gen': [
        { id: 'gen-git',     name: 'Git / 协作',      heat: 74 },
        { id: 'gen-ci',      name: 'CI/CD',           heat: 68 },
        { id: 'gen-linux',   name: 'Linux',           heat: 72 },
        { id: 'gen-doc',     name: '技术文档',        heat: 62 },
        { id: 'gen-comm',    name: '跨团队沟通',      heat: 64 },
        { id: 'gen-platform', name: '实验平台',       heat: 76 },
        { id: 'gen-docker',  name: 'Docker',          heat: 68 },
      ],
    },

    '深度学习工程师': {
      'board-pro': [
        { id: 'pro-pytorch', name: 'PyTorch',         heat: 96 },
        { id: 'pro-tf',      name: 'TensorFlow',      heat: 84 },
        { id: 'pro-cnn',     name: 'CNN',             heat: 88 },
        { id: 'pro-rnn',     name: 'RNN / LSTM',      heat: 84 },
        { id: 'pro-transformer', name: 'Transformer', heat: 92 },
        { id: 'pro-transfer', name: '迁移学习',       heat: 84 },
        { id: 'pro-aug',     name: '数据增强',        heat: 80 },
        { id: 'pro-prune',   name: '模型压缩 / 剪枝', heat: 78 },
        { id: 'pro-cuda',    name: 'CUDA / GPU 编程', heat: 82 },
        { id: 'pro-amp',     name: '混合精度训练',    heat: 76 },
      ],
      'board-pos': [
        { id: 'pos-train',   name: '模型训练',        heat: 90 },
        { id: 'pos-eval',    name: '模型评估',        heat: 86 },
        { id: 'pos-hp',      name: '超参调优',        heat: 84 },
        { id: 'pos-infer',   name: '推理优化',        heat: 86 },
        { id: 'pos-compress', name: '模型压缩',       heat: 82 },
        { id: 'pos-ddp',     name: '分布式训练',      heat: 84 },
        { id: 'pos-dataset', name: '数据集构建',      heat: 80 },
        { id: 'pos-mlops',   name: 'MLOps / 实验管理', heat: 78 },
      ],
      'board-cog': [
        { id: 'cog-math',    name: '数学 / 线性代数', heat: 88 },
        { id: 'cog-prob',    name: '概率统计',        heat: 84 },
        { id: 'cog-opt',     name: '优化理论',        heat: 82 },
        { id: 'cog-info',    name: '信息论',          heat: 76 },
        { id: 'cog-nn',      name: '神经网络原理',    heat: 88 },
        { id: 'cog-cv',      name: '计算机视觉',      heat: 82 },
        { id: 'cog-nlp',     name: '自然语言处理',    heat: 80 },
        { id: 'cog-algo',    name: '数据结构与算法',  heat: 74 },
      ],
      'board-gen': [
        { id: 'gen-git',     name: 'Git / 协作',      heat: 74 },
        { id: 'gen-ci',      name: 'CI/CD',           heat: 66 },
        { id: 'gen-k8s',     name: 'Docker / K8s',    heat: 72 },
        { id: 'gen-linux',   name: 'Linux / GPU 服务器', heat: 78 },
        { id: 'gen-doc',     name: '技术文档',        heat: 62 },
        { id: 'gen-comm',    name: '跨团队沟通',      heat: 60 },
        { id: 'gen-paper',   name: '论文阅读',        heat: 76 },
      ],
    },

    'AI 应用工程师': {
      'board-pro': [
        { id: 'pro-llm',     name: 'LLM 应用',        heat: 94 },
        { id: 'pro-prompt',  name: 'Prompt 工程',      heat: 92 },
        { id: 'pro-rag',     name: 'RAG 系统',         heat: 90 },
        { id: 'pro-langchain', name: 'LangChain / LlamaIndex', heat: 86 },
        { id: 'pro-vdb',     name: '向量数据库',       heat: 84 },
        { id: 'pro-api',     name: 'API 集成',         heat: 82 },
        { id: 'pro-python',  name: 'Python',           heat: 88 },
        { id: 'pro-fastapi', name: 'FastAPI',          heat: 80 },
        { id: 'pro-finetune', name: '模型微调',        heat: 82 },
        { id: 'pro-kb',      name: '知识库构建',       heat: 84 },
      ],
      'board-pos': [
        { id: 'pos-product', name: 'AI 产品设计',      heat: 86 },
        { id: 'pos-scenario', name: '场景落地',        heat: 88 },
        { id: 'pos-eval',    name: '效果评估',         heat: 84 },
        { id: 'pos-flywheel', name: '数据飞轮',        heat: 80 },
        { id: 'pos-deploy',  name: '工程化部署',       heat: 84 },
        { id: 'pos-align',   name: '安全对齐',         heat: 78 },
        { id: 'pos-cost',    name: '成本优化',         heat: 76 },
        { id: 'pos-hybrid',  name: '混合检索',         heat: 82 },
      ],
      'board-cog': [
        { id: 'cog-nlp',     name: 'NLP 基础',         heat: 80 },
        { id: 'cog-ml',      name: '机器学习基础',     heat: 76 },
        { id: 'cog-ir',      name: '信息检索',         heat: 78 },
        { id: 'cog-design',  name: '系统设计',         heat: 78 },
        { id: 'cog-data',    name: '数据分析',         heat: 74 },
        { id: 'cog-ux',      name: '用户体验',         heat: 70 },
        { id: 'cog-product', name: '产品思维',         heat: 72 },
      ],
      'board-gen': [
        { id: 'gen-git',     name: 'Git / 协作',       heat: 72 },
        { id: 'gen-ci',      name: 'CI/CD',            heat: 66 },
        { id: 'gen-docker',  name: 'Docker',           heat: 70 },
        { id: 'gen-linux',   name: 'Linux',            heat: 68 },
        { id: 'gen-doc',     name: '技术文档',         heat: 66 },
        { id: 'gen-comm',    name: '跨团队沟通',       heat: 68 },
        { id: 'gen-review',  name: '代码审查',         heat: 62 },
      ],
    },
  }

  return MAP[resolved] ?? MAP['Vue 前端工程师']!
}

function getCrossEdgesForRole(role: string): AbilityEdge[] {
  const ALIAS: Record<string, string> = {
    '前端开发':     'Vue 前端工程师',
    '后端开发':     'Java 后端工程师',
    '测试开发':     '自动化测试工程师',
    '数据分析':     '商业数据分析师',
    '机器学习工程师': '算法工程师',
  }
  const resolved = ALIAS[role] ?? role

  const EDGES: Record<string, AbilityEdge[]> = {

    'Vue 前端工程师': [
      { source: 'pro-ts',      target: 'pro-vue3',    relation: 'prerequisite', label: 'TS 是 Vue3 前置' },
      { source: 'pro-ts',      target: 'pro-pinia',   relation: 'prerequisite', label: 'TS 支撑 Pinia 类型安全' },
      { source: 'cog-network', target: 'pos-perf',    relation: 'prerequisite', label: '网络知识支撑性能优化' },
      { source: 'cog-algo',    target: 'cog-design',  relation: 'prerequisite', label: '算法支撑系统设计' },
      { source: 'cog-browser', target: 'cog-render',  relation: 'prerequisite', label: '浏览器原理支撑渲染' },
      { source: 'pro-vue3',    target: 'pos-arch',    relation: 'synergy',      label: 'Vue 与前端架构协同' },
      { source: 'pro-vue3',    target: 'pos-ssr',     relation: 'synergy',      label: 'Vue 与 SSR 协同' },
      { source: 'pro-vite',    target: 'pos-build',   relation: 'synergy',      label: 'Vite 支撑工程化' },
      { source: 'pos-build',   target: 'gen-ci',      relation: 'synergy',      label: '构建与 CI/CD 协同' },
      { source: 'gen-git',     target: 'gen-ci',      relation: 'synergy',      label: 'Git 与 CI/CD 协同' },
      { source: 'pos-test',    target: 'gen-ci',      relation: 'synergy',      label: '测试接入 CI/CD' },
      { source: 'pro-nuxt',    target: 'pos-ssr',     relation: 'synergy',      label: 'Nuxt 实现 SSR' },
      { source: 'pos-perf',    target: 'pos-build',   relation: 'dependency',   label: '性能优化依赖工程化' },
      { source: 'cog-sec',     target: 'cog-network', relation: 'dependency',   label: 'Web 安全依赖网络知识' },
      { source: 'pos-mfe',     target: 'pos-build',   relation: 'dependency',   label: '微前端依赖工程化' },
      { source: 'pos-arch',    target: 'cog-design',  relation: 'dependency',   label: '架构设计依赖系统设计' },
    ],

    'React 前端工程师': [
      { source: 'pro-ts',      target: 'pro-react',   relation: 'prerequisite', label: 'TS 是 React 前置' },
      { source: 'pro-ts',      target: 'pro-redux',   relation: 'prerequisite', label: 'TS 支撑状态管理类型' },
      { source: 'cog-fp',      target: 'pro-react',   relation: 'prerequisite', label: '函数式编程是 React 基础' },
      { source: 'cog-algo',    target: 'cog-design',  relation: 'prerequisite', label: '算法支撑系统设计' },
      { source: 'cog-network', target: 'pos-perf',    relation: 'prerequisite', label: '网络知识支撑性能优化' },
      { source: 'pro-react',   target: 'pos-arch',    relation: 'synergy',      label: 'React 与前端架构协同' },
      { source: 'pro-next',    target: 'pos-ssg',     relation: 'synergy',      label: 'Next.js 实现 SSR/SSG' },
      { source: 'pro-webpack', target: 'pos-build',   relation: 'synergy',      label: 'Webpack 支撑工程化' },
      { source: 'pos-build',   target: 'gen-ci',      relation: 'synergy',      label: '构建与 CI/CD 协同' },
      { source: 'gen-git',     target: 'gen-ci',      relation: 'synergy',      label: 'Git 与 CI/CD 协同' },
      { source: 'pro-sb',      target: 'pos-comp',    relation: 'synergy',      label: 'Storybook 支撑组件库' },
      { source: 'pos-test',    target: 'gen-ci',      relation: 'synergy',      label: '测试接入 CI/CD' },
      { source: 'cog-sec',     target: 'cog-network', relation: 'dependency',   label: 'Web 安全依赖网络知识' },
      { source: 'pos-mfe',     target: 'pos-build',   relation: 'dependency',   label: '微前端依赖工程化' },
      { source: 'pos-arch',    target: 'cog-design',  relation: 'dependency',   label: '架构设计依赖系统设计' },
      { source: 'pos-pwa',     target: 'cog-network', relation: 'dependency',   label: 'PWA 依赖网络协议' },
    ],

    '可视化工程师': [
      { source: 'cog-math',    target: 'pro-webgl',   relation: 'prerequisite', label: '线性代数是 WebGL 基础' },
      { source: 'cog-graphics', target: 'pro-three',  relation: 'prerequisite', label: '图形学支撑 Three.js' },
      { source: 'cog-render',  target: 'pos-perf',    relation: 'prerequisite', label: '渲染管线知识支撑性能优化' },
      { source: 'pro-ts',      target: 'pro-vue',     relation: 'prerequisite', label: 'TS 是框架开发基础' },
      { source: 'cog-color',   target: 'pos-chart',   relation: 'prerequisite', label: '色彩理论支撑图表设计' },
      { source: 'pro-d3',      target: 'pos-chart',   relation: 'synergy',      label: 'D3 与图表系统协同' },
      { source: 'pro-echarts', target: 'pos-bigscreen', relation: 'synergy',    label: 'ECharts 用于大屏' },
      { source: 'pro-three',   target: 'pos-3d',      relation: 'synergy',      label: 'Three.js 构建 3D 场景' },
      { source: 'pro-cesium',  target: 'pos-gis',     relation: 'synergy',      label: 'Cesium 支撑 GIS 开发' },
      { source: 'pro-gsap',    target: 'pos-anim',    relation: 'synergy',      label: 'GSAP 驱动动效系统' },
      { source: 'gen-git',     target: 'gen-ci',      relation: 'synergy',      label: 'Git 与 CI/CD 协同' },
      { source: 'cog-data',    target: 'pro-data',    relation: 'synergy',      label: '数据分析思维支撑 ETL' },
      { source: 'pos-perf',    target: 'pro-webgl',   relation: 'dependency',   label: '渲染性能依赖 WebGL 底层' },
      { source: 'pos-realtime', target: 'cog-network', relation: 'dependency',  label: '实时渲染依赖网络协议' },
      { source: 'pos-bigscreen', target: 'pos-chart', relation: 'dependency',   label: '大屏依赖图表系统' },
      { source: 'pos-3d',      target: 'cog-graphics', relation: 'dependency',  label: '3D 场景依赖图形学' },
    ],

    'Java 后端工程师': [
      { source: 'pro-java',    target: 'pro-spring',  relation: 'prerequisite', label: 'Java 是 Spring 基础' },
      { source: 'pro-spring',  target: 'pro-cloud',   relation: 'prerequisite', label: 'Spring Boot 是 Cloud 前置' },
      { source: 'cog-algo',    target: 'cog-design',  relation: 'prerequisite', label: '算法支撑系统设计' },
      { source: 'cog-db',      target: 'pro-mysql',   relation: 'prerequisite', label: '数据库原理支撑 MySQL' },
      { source: 'cog-dist',    target: 'pos-dtx',     relation: 'prerequisite', label: '分布式理论支撑事务设计' },
      { source: 'pro-spring',  target: 'pos-api',     relation: 'synergy',      label: 'Spring 支撑 API 设计' },
      { source: 'pro-redis',   target: 'pos-cache',   relation: 'synergy',      label: 'Redis 实现缓存策略' },
      { source: 'pro-mq',      target: 'pos-concur',  relation: 'synergy',      label: 'MQ 解耦高并发' },
      { source: 'gen-k8s',     target: 'gen-ci',      relation: 'synergy',      label: 'K8s 与 CI/CD 协同' },
      { source: 'gen-git',     target: 'gen-ci',      relation: 'synergy',      label: 'Git 与 CI/CD 协同' },
      { source: 'pro-es',      target: 'pro-mysql',   relation: 'synergy',      label: 'ES 补充 MySQL 搜索' },
      { source: 'pos-jvm',     target: 'pro-java',    relation: 'dependency',   label: 'JVM 调优依赖 Java 底层' },
      { source: 'pos-perf',    target: 'pos-jvm',     relation: 'dependency',   label: '性能调优依赖 JVM' },
      { source: 'pos-concur',  target: 'cog-design',  relation: 'dependency',   label: '高并发依赖系统设计' },
      { source: 'pos-dtx',     target: 'cog-dist',    relation: 'dependency',   label: '分布式事务依赖理论' },
      { source: 'pos-ratelimit', target: 'pro-redis', relation: 'dependency',   label: '限流熔断依赖 Redis' },
    ],

    'Go 后端工程师': [
      { source: 'pro-go',      target: 'pro-gin',     relation: 'prerequisite', label: 'Go 是 Gin 基础' },
      { source: 'pro-go',      target: 'pro-goroutine', relation: 'prerequisite', label: 'Go 并发模型基础' },
      { source: 'cog-concur',  target: 'pro-goroutine', relation: 'prerequisite', label: '并发原理支撑协程理解' },
      { source: 'cog-algo',    target: 'cog-design',  relation: 'prerequisite', label: '算法支撑系统设计' },
      { source: 'cog-dist',    target: 'pos-micro',   relation: 'prerequisite', label: '分布式理论支撑微服务' },
      { source: 'pro-grpc',    target: 'pos-micro',   relation: 'synergy',      label: 'gRPC 支撑微服务通信' },
      { source: 'pro-etcd',    target: 'pos-sd',      relation: 'synergy',      label: 'etcd 支撑服务发现' },
      { source: 'pro-redis',   target: 'pos-ratelimit', relation: 'synergy',    label: 'Redis 实现限流' },
      { source: 'pro-kafka',   target: 'pos-concur',  relation: 'synergy',      label: 'Kafka 解耦高并发' },
      { source: 'gen-k8s',     target: 'gen-ci',      relation: 'synergy',      label: 'K8s 与 CI/CD 协同' },
      { source: 'gen-git',     target: 'gen-ci',      relation: 'synergy',      label: 'Git 与 CI/CD 协同' },
      { source: 'pos-trace',   target: 'pos-micro',   relation: 'synergy',      label: '链路追踪配合微服务' },
      { source: 'pos-concur',  target: 'cog-concur',  relation: 'dependency',   label: '高并发依赖并发编程原理' },
      { source: 'pos-perf',    target: 'cog-os',      relation: 'dependency',   label: '性能调优依赖 OS 知识' },
      { source: 'pos-micro',   target: 'cog-design',  relation: 'dependency',   label: '微服务依赖系统设计' },
    ],

    'Python 后端工程师': [
      { source: 'pro-python',  target: 'pro-django',  relation: 'prerequisite', label: 'Python 是 Django 基础' },
      { source: 'pro-python',  target: 'pro-fastapi', relation: 'prerequisite', label: 'Python 是 FastAPI 基础' },
      { source: 'pro-sqlalchemy', target: 'pro-django', relation: 'prerequisite', label: 'SQLAlchemy 支撑 ORM' },
      { source: 'cog-algo',    target: 'cog-design',  relation: 'prerequisite', label: '算法支撑系统设计' },
      { source: 'cog-db',      target: 'pro-mysql',   relation: 'prerequisite', label: '数据库原理支撑 MySQL' },
      { source: 'pro-celery',  target: 'pos-async',   relation: 'synergy',      label: 'Celery 实现异步任务' },
      { source: 'pro-redis',   target: 'pos-cache',   relation: 'synergy',      label: 'Redis 实现缓存' },
      { source: 'pro-mq',      target: 'pos-async',   relation: 'synergy',      label: 'MQ 支撑异步设计' },
      { source: 'gen-k8s',     target: 'gen-ci',      relation: 'synergy',      label: 'K8s 与 CI/CD 协同' },
      { source: 'gen-git',     target: 'gen-ci',      relation: 'synergy',      label: 'Git 与 CI/CD 协同' },
      { source: 'pos-orm',     target: 'pro-sqlalchemy', relation: 'synergy',   label: 'ORM 依赖 SQLAlchemy' },
      { source: 'pos-sec',     target: 'cog-network', relation: 'dependency',   label: '接口安全依赖网络知识' },
      { source: 'pos-perf',    target: 'cog-design',  relation: 'dependency',   label: '性能调优依赖系统设计' },
      { source: 'pos-data',    target: 'pro-celery',  relation: 'dependency',   label: '数据流水线依赖 Celery' },
    ],

    '自动化测试工程师': [
      { source: 'pro-python',  target: 'pro-pytest',  relation: 'prerequisite', label: 'Python 是 pytest 基础' },
      { source: 'pro-python',  target: 'pro-selenium', relation: 'prerequisite', label: 'Python 驱动 Selenium' },
      { source: 'cog-theory',  target: 'pos-case',    relation: 'prerequisite', label: '测试理论支撑用例设计' },
      { source: 'cog-strategy', target: 'pos-framework', relation: 'prerequisite', label: '测试策略支撑框架设计' },
      { source: 'pro-playwright', target: 'pos-framework', relation: 'synergy', label: 'Playwright 融入框架' },
      { source: 'pro-jenkins', target: 'pos-ci',      relation: 'synergy',      label: 'Jenkins 实现 CI' },
      { source: 'gen-ci',      target: 'pos-ci',      relation: 'synergy',      label: 'CI/CD 与持续集成测试' },
      { source: 'gen-git',     target: 'gen-ci',      relation: 'synergy',      label: 'Git 与 CI/CD 协同' },
      { source: 'pro-api',     target: 'pos-mock',    relation: 'synergy',      label: 'API 测试配合 Mock' },
      { source: 'pro-docker',  target: 'pos-env',     relation: 'synergy',      label: 'Docker 支撑环境管理' },
      { source: 'pos-case',    target: 'pos-data',    relation: 'dependency',   label: '用例设计依赖测试数据' },
      { source: 'pos-report',  target: 'pos-metric',  relation: 'dependency',   label: '测试报告支撑质量度量' },
      { source: 'pos-framework', target: 'pro-pytest', relation: 'dependency',  label: '框架设计依赖 pytest' },
    ],

    '质量平台工程师': [
      { source: 'pro-python',  target: 'pro-platform', relation: 'prerequisite', label: 'Python 支撑平台开发' },
      { source: 'cog-quality', target: 'pos-metric',  relation: 'prerequisite', label: '质量管理支撑度量体系' },
      { source: 'cog-theory',  target: 'pos-manage',  relation: 'prerequisite', label: '测试理论支撑测试管理' },
      { source: 'pro-pipeline', target: 'pos-ci',     relation: 'synergy',      label: '流水线实现自动化集成' },
      { source: 'pro-kafka',   target: 'pro-collect', relation: 'synergy',      label: 'Kafka 支撑数据采集' },
      { source: 'pro-es',      target: 'pro-report',  relation: 'synergy',      label: 'ES 支撑报表查询' },
      { source: 'gen-ci',      target: 'pos-ci',      relation: 'synergy',      label: 'CI/CD 与平台集成' },
      { source: 'gen-git',     target: 'gen-ci',      relation: 'synergy',      label: 'Git 与 CI/CD 协同' },
      { source: 'pro-mysql',   target: 'pro-report',  relation: 'synergy',      label: 'MySQL 支撑报表数据' },
      { source: 'pos-metric',  target: 'pos-risk',    relation: 'dependency',   label: '质量度量支撑风险看板' },
      { source: 'pos-coverage', target: 'pos-metric', relation: 'dependency',   label: '覆盖率分析贡献度量' },
      { source: 'cog-process', target: 'pos-standard', relation: 'dependency',  label: '流程优化指导规范制定' },
      { source: 'pos-infra',   target: 'pro-docker',  relation: 'dependency',   label: '测试基础设施依赖 Docker' },
    ],

    '性能测试工程师': [
      { source: 'cog-arch',    target: 'pos-design',  relation: 'prerequisite', label: '系统架构知识支撑压测方案' },
      { source: 'cog-os',      target: 'pos-bottleneck', relation: 'prerequisite', label: 'OS 知识支撑瓶颈分析' },
      { source: 'cog-network', target: 'pos-baseline', relation: 'prerequisite', label: '网络知识支撑基准测试' },
      { source: 'cog-stat',    target: 'pos-report',  relation: 'prerequisite', label: '统计学支撑报告分析' },
      { source: 'pro-jmeter',  target: 'pos-design',  relation: 'synergy',      label: 'JMeter 实现压测方案' },
      { source: 'pro-locust',  target: 'pos-design',  relation: 'synergy',      label: 'Locust 实现压测方案' },
      { source: 'pro-apm',     target: 'pos-bottleneck', relation: 'synergy',   label: 'APM 辅助瓶颈分析' },
      { source: 'pro-apm',     target: 'pos-trace',   relation: 'synergy',      label: 'APM 支撑链路追踪' },
      { source: 'gen-monitor', target: 'pro-apm',     relation: 'synergy',      label: '监控工具配合 APM' },
      { source: 'gen-linux',   target: 'pos-bottleneck', relation: 'synergy',   label: 'Linux 系统命令辅助分析' },
      { source: 'pos-jvm',     target: 'cog-os',      relation: 'dependency',   label: 'JVM 调优依赖 OS 知识' },
      { source: 'pos-db',      target: 'cog-db',      relation: 'dependency',   label: '数据库调优依赖数据库原理' },
      { source: 'pos-capacity', target: 'pos-baseline', relation: 'dependency', label: '容量规划依赖基准数据' },
      { source: 'pos-bottleneck', target: 'pos-trace', relation: 'dependency',  label: '瓶颈分析依赖链路追踪' },
    ],

    '商业数据分析师': [
      { source: 'cog-stat',    target: 'pro-stat',    relation: 'prerequisite', label: '统计学支撑统计分析' },
      { source: 'cog-prob',    target: 'pos-ab',      relation: 'prerequisite', label: '概率论是 A/B 测试基础' },
      { source: 'cog-biz',     target: 'pos-insight', relation: 'prerequisite', label: '商业思维支撑业务洞察' },
      { source: 'pro-sql',     target: 'pro-python',  relation: 'prerequisite', label: 'SQL 是数据分析必备前置' },
      { source: 'pro-sql',     target: 'pos-metric',  relation: 'synergy',      label: 'SQL 驱动指标体系' },
      { source: 'pro-bi',      target: 'pos-dashboard', relation: 'synergy',   label: 'BI 工具构建看板' },
      { source: 'pro-tableau', target: 'pos-dashboard', relation: 'synergy',   label: 'Tableau 可视化看板' },
      { source: 'pro-python',  target: 'pos-user',    relation: 'synergy',      label: 'Python 支撑用户画像' },
      { source: 'pro-excel',   target: 'pos-report',  relation: 'synergy',      label: 'Excel 支撑分析报告' },
      { source: 'gen-present', target: 'gen-comm',    relation: 'synergy',      label: '汇报与跨部门沟通协同' },
      { source: 'pos-funnel',  target: 'pos-insight', relation: 'dependency',   label: '漏斗分析输出业务洞察' },
      { source: 'pos-metric',  target: 'pos-dashboard', relation: 'dependency', label: '指标体系驱动数据看板' },
      { source: 'cog-data',    target: 'pos-report',  relation: 'dependency',   label: '数据思维支撑分析报告' },
      { source: 'pos-user',    target: 'pos-market',  relation: 'dependency',   label: '用户画像支撑市场分析' },
    ],

    '数据开发工程师': [
      { source: 'cog-dist',    target: 'pro-spark',   relation: 'prerequisite', label: '分布式原理支撑 Spark' },
      { source: 'cog-dist',    target: 'pro-flink',   relation: 'prerequisite', label: '分布式原理支撑 Flink' },
      { source: 'cog-db',      target: 'pro-hive',    relation: 'prerequisite', label: '数据库原理支撑 Hive' },
      { source: 'cog-sql',     target: 'pos-perf',    relation: 'prerequisite', label: 'SQL 优化支撑性能调优' },
      { source: 'pro-spark',   target: 'pos-dw',      relation: 'synergy',      label: 'Spark 支撑数仓计算' },
      { source: 'pro-flink',   target: 'pos-realtime', relation: 'synergy',    label: 'Flink 实现实时计算' },
      { source: 'pro-kafka',   target: 'pos-realtime', relation: 'synergy',    label: 'Kafka 驱动实时数据流' },
      { source: 'pro-airflow', target: 'pos-schedule', relation: 'synergy',    label: 'Airflow 实现调度管理' },
      { source: 'pro-datax',   target: 'pos-etl',     relation: 'synergy',      label: 'DataX 支撑 ETL' },
      { source: 'gen-linux',   target: 'gen-shell',   relation: 'synergy',      label: 'Linux 与 Shell 协同' },
      { source: 'gen-git',     target: 'gen-ci',      relation: 'synergy',      label: 'Git 与 CI/CD 协同' },
      { source: 'pos-quality', target: 'pos-dw',      relation: 'dependency',   label: '数据质量保障数仓可靠性' },
      { source: 'pos-lineage', target: 'pos-govern',  relation: 'dependency',   label: '数据血缘支撑数据治理' },
      { source: 'pos-schedule', target: 'pos-etl',    relation: 'dependency',   label: '调度管理驱动 ETL 流程' },
    ],

    '增长分析师': [
      { source: 'cog-stat',    target: 'pro-ab',      relation: 'prerequisite', label: '统计学支撑 A/B 测试' },
      { source: 'cog-causal',  target: 'pro-attr',    relation: 'prerequisite', label: '因果推断支撑归因模型' },
      { source: 'cog-prob',    target: 'pos-exp',     relation: 'prerequisite', label: '概率论支撑实验设计' },
      { source: 'pro-sql',     target: 'pro-funnel',  relation: 'prerequisite', label: 'SQL 是漏斗分析基础' },
      { source: 'pro-ab',      target: 'pos-exp',     relation: 'synergy',      label: 'A/B 测试实现增长实验' },
      { source: 'pro-track',   target: 'pos-acquire', relation: 'synergy',      label: '埋点分析支撑用户获取' },
      { source: 'pro-funnel',  target: 'pos-retain',  relation: 'synergy',      label: '漏斗分析支撑留存分析' },
      { source: 'pro-attr',    target: 'pos-channel', relation: 'synergy',      label: '归因模型支撑渠道分析' },
      { source: 'pro-segment', target: 'pos-ltv',     relation: 'synergy',      label: '用户分层支撑 LTV 分析' },
      { source: 'gen-present', target: 'gen-comm',    relation: 'synergy',      label: '汇报与沟通协同' },
      { source: 'cog-growth',  target: 'pos-strategy', relation: 'dependency',  label: '增长理论支撑增长策略' },
      { source: 'pos-retain',  target: 'pos-ltv',     relation: 'dependency',   label: '留存分析支撑 LTV 计算' },
      { source: 'pos-exp',     target: 'pro-ab',      relation: 'dependency',   label: '实验设计依赖 A/B 工具' },
      { source: 'cog-psych',   target: 'pos-strategy', relation: 'dependency',  label: '用户心理支撑增长策略' },
    ],

    '算法工程师': [
      { source: 'cog-math',    target: 'pro-ml',      relation: 'prerequisite', label: '数学是机器学习基础' },
      { source: 'cog-stat',    target: 'pro-xgb',     relation: 'prerequisite', label: '统计学支撑集成模型' },
      { source: 'cog-opt',     target: 'pro-ml',      relation: 'prerequisite', label: '优化理论支撑模型训练' },
      { source: 'pro-feat',    target: 'pro-xgb',     relation: 'prerequisite', label: '特征工程是模型前置' },
      { source: 'pro-ml',      target: 'pro-rec',     relation: 'synergy',      label: 'ML 支撑推荐系统' },
      { source: 'pro-spark',   target: 'pro-feat',    relation: 'synergy',      label: 'Spark 支撑大规模特征' },
      { source: 'pro-ab',      target: 'pos-effect',  relation: 'synergy',      label: 'A/B 实验评估效果' },
      { source: 'gen-platform', target: 'pos-ab',     relation: 'synergy',      label: '实验平台支撑 AB 实验' },
      { source: 'gen-docker',  target: 'pos-deploy',  relation: 'synergy',      label: 'Docker 支撑线上部署' },
      { source: 'gen-git',     target: 'gen-ci',      relation: 'synergy',      label: 'Git 与 CI/CD 协同' },
      { source: 'pos-recall',  target: 'pos-rank',    relation: 'dependency',   label: '召回是排序前置' },
      { source: 'pos-feat',    target: 'pos-eval',    relation: 'dependency',   label: '特征选择影响模型评估' },
      { source: 'pos-eval',    target: 'pos-deploy',  relation: 'dependency',   label: '评估通过才能上线部署' },
      { source: 'cog-pgm',     target: 'pro-rec',     relation: 'dependency',   label: '概率图模型支撑推荐' },
    ],

    '深度学习工程师': [
      { source: 'cog-math',    target: 'cog-nn',      relation: 'prerequisite', label: '数学是神经网络基础' },
      { source: 'cog-opt',     target: 'pos-train',   relation: 'prerequisite', label: '优化理论支撑模型训练' },
      { source: 'cog-prob',    target: 'pro-cnn',     relation: 'prerequisite', label: '概率统计是 CNN 基础' },
      { source: 'pro-pytorch', target: 'pro-cnn',     relation: 'prerequisite', label: 'PyTorch 实现 CNN' },
      { source: 'pro-pytorch', target: 'pro-transformer', relation: 'prerequisite', label: 'PyTorch 实现 Transformer' },
      { source: 'pro-transformer', target: 'cog-nlp', relation: 'synergy',      label: 'Transformer 驱动 NLP' },
      { source: 'pro-transfer', target: 'pos-train',  relation: 'synergy',      label: '迁移学习加速训练' },
      { source: 'pro-aug',     target: 'pos-dataset', relation: 'synergy',      label: '数据增强扩充数据集' },
      { source: 'pro-cuda',    target: 'pos-ddp',     relation: 'synergy',      label: 'CUDA 支撑分布式训练' },
      { source: 'gen-linux',   target: 'pro-cuda',    relation: 'synergy',      label: 'Linux 服务器配置 CUDA' },
      { source: 'gen-paper',   target: 'pro-transformer', relation: 'synergy',  label: '论文阅读跟进 Transformer 进展' },
      { source: 'pro-prune',   target: 'pos-compress', relation: 'synergy',     label: '剪枝实现模型压缩' },
      { source: 'pos-infer',   target: 'pos-compress', relation: 'dependency',  label: '推理优化依赖模型压缩' },
      { source: 'pos-train',   target: 'pos-eval',    relation: 'dependency',   label: '训练完成才能评估' },
      { source: 'pos-hp',      target: 'pos-train',   relation: 'dependency',   label: '超参调优改善训练效果' },
    ],

    'AI 应用工程师': [
      { source: 'cog-nlp',     target: 'pro-llm',     relation: 'prerequisite', label: 'NLP 基础支撑 LLM 应用' },
      { source: 'cog-ir',      target: 'pro-rag',     relation: 'prerequisite', label: '信息检索是 RAG 基础' },
      { source: 'pro-python',  target: 'pro-fastapi', relation: 'prerequisite', label: 'Python 是 FastAPI 基础' },
      { source: 'pro-vdb',     target: 'pro-rag',     relation: 'prerequisite', label: '向量数据库支撑 RAG' },
      { source: 'pro-prompt',  target: 'pro-llm',     relation: 'synergy',      label: 'Prompt 工程优化 LLM' },
      { source: 'pro-langchain', target: 'pro-rag',   relation: 'synergy',      label: 'LangChain 构建 RAG' },
      { source: 'pro-kb',      target: 'pos-hybrid',  relation: 'synergy',      label: '知识库支撑混合检索' },
      { source: 'pro-finetune', target: 'pos-scenario', relation: 'synergy',    label: '微调助力场景落地' },
      { source: 'gen-docker',  target: 'pos-deploy',  relation: 'synergy',      label: 'Docker 支撑工程化部署' },
      { source: 'gen-git',     target: 'gen-ci',      relation: 'synergy',      label: 'Git 与 CI/CD 协同' },
      { source: 'cog-product', target: 'pos-product', relation: 'dependency',   label: '产品思维支撑 AI 产品设计' },
      { source: 'pos-eval',    target: 'pos-scenario', relation: 'dependency',  label: '效果评估推动场景优化' },
      { source: 'pos-align',   target: 'pro-prompt',  relation: 'dependency',   label: '安全对齐依赖 Prompt 设计' },
      { source: 'pos-cost',    target: 'pos-deploy',  relation: 'dependency',   label: '成本优化约束部署方案' },
    ],
  }

  return EDGES[resolved] ?? EDGES['Vue 前端工程师']!
}

/* ═══ 同心圆布局计算 ═══ */

export interface LayoutNode {
  id: string
  x: number
  y: number
}

export function computeConcentricLayout(
  nodes: AbilityNode[],
  opts: { cx: number; cy: number; radii?: number[]; jitter?: number } = { cx: 300, cy: 300 },
): LayoutNode[] {
  const { cx, cy, jitter = 6 } = opts
  const radii = opts.radii || [0, 140, 280, 380]

  // 按层级分桶
  const buckets = new Map<number, AbilityNode[]>()
  for (const n of nodes) {
    const arr = buckets.get(n.level) || []
    arr.push(n)
    buckets.set(n.level, arr)
  }

  const result: LayoutNode[] = []

  for (const [level, bucket] of buckets) {
    const r = radii[Math.min(level, radii.length - 1)] ?? 0
    const count = bucket.length
    const angleStep = count > 0 ? (2 * Math.PI) / count : 0
    // 随机起始角度偏移
    const angleOffset = Math.random() * Math.PI * 2

    bucket.forEach((n, i) => {
      const angle = angleOffset + i * angleStep
      const j = jitter > 0 ? (Math.random() - 0.5) * jitter : 0
      result.push({
        id: n.id,
        x: cx + r * Math.cos(angle) + j,
        y: cy + r * Math.sin(angle) + j,
      })
    })
  }

  return result
}

/* ═══ 轨道布局（环形约束动画用） ═══ */

export interface OrbitalNode {
  id: string
  baseAngle: number   // 初始角度 (弧度)
  radius: number      // 所在圆半径
  layer: number       // 层级
}

export function computeOrbitalLayout(
  nodes: AbilityNode[],
  opts: { radii?: number[] } = {},
): OrbitalNode[] {
  const radii = opts.radii || [0, 160, 330, 450]
  const buckets = new Map<number, AbilityNode[]>()
  for (const n of nodes) {
    const arr = buckets.get(n.level) || []
    arr.push(n)
    buckets.set(n.level, arr)
  }
  const result: OrbitalNode[] = []
  for (const [level, bucket] of buckets) {
    const r = radii[Math.min(level, radii.length - 1)] ?? 0
    const count = bucket.length
    const angleStep = count > 0 ? (2 * Math.PI) / count : 0
    const angleOffset = Math.random() * Math.PI * 2
    bucket.forEach((n, i) => {
      result.push({
        id: n.id,
        baseAngle: angleOffset + i * angleStep,
        radius: r,
        layer: level,
      })
    })
  }
  return result
}

/* ═══ 岗位介绍 Mock ═══ */

export interface RoleIntro {
  title: string
  summary: string
  responsibilities: string[]
  requirements: string[]
  skills: string[]
  topRegions: { name: string; demand: string }[]
  outlook: string
}

export function getRoleIntro(role: string): RoleIntro {
  // TODO: 后续替换为 GET /api/career/role-intro?role=...
  const map: Record<string, RoleIntro> = {
    '前端开发': {
      title: '前端开发工程师',
      summary: '负责 Web 应用用户界面的设计与实现，关注性能、可访问性与用户体验。',
      responsibilities: [
        '根据产品需求完成页面开发与交互实现',
        '参与前端架构设计与技术选型',
        '优化页面性能与首屏加载速度',
        '与后端/设计团队协作联调接口',
        '维护组件库与工程化基础设施',
      ],
      requirements: [
        '本科及以上学历，计算机相关专业优先',
        '熟悉 Vue / React 至少一种主流框架',
        '掌握 TypeScript、ES6+ 语法',
        '了解前端工程化（Webpack / Vite / CI/CD）',
        '有数据可视化或跨端开发经验者加分',
      ],
      skills: ['Vue 3', 'React', 'TypeScript', 'CSS', 'Node.js', 'Webpack', 'Vite', 'ECharts', 'Git'],
      topRegions: [
        { name: '北京', demand: '极高' },
        { name: '上海', demand: '极高' },
        { name: '深圳', demand: '高' },
        { name: '杭州', demand: '高' },
        { name: '成都', demand: '中等' },
      ],
      outlook: '前端技术迭代快，全栈化与跨端趋势明显；掌握框架原理、性能优化和工程化能力的开发者持续紧缺，3-5 年可晋升高级/架构方向。',
    },
  }
  return map[role] ?? map['前端开发']!
}

/* ═══ 数据获取（预留接口替换） ═══ */

export async function getAbilityGraphData(role: string): Promise<AbilityGraphData> {
  // TODO: 后续替换为真实 API 调用
  // return fetch(`/api/ability-graph?role=${encodeURIComponent(role)}`).then(r => r.json())
  return buildMockData(role)
}
