# Task Plan: 前端视觉优化方案

## Goal
基于当前 Vue 课程管理系统的现有实现，输出一份避免 AI 模板化、可分阶段落地的前端视觉与交互优化方案，不编写业务实现代码。

## Current Phase
Phase 2

## Phases

### Phase 1: Requirements & Discovery
- [x] Understand user intent
- [x] Identify constraints and requirements
- [x] Document findings in findings.md
- **Status:** complete

### Phase 2: Current UI Audit
- [x] Review theme, global layout, and representative pages
- [x] Identify the main reasons the UI feels generic or weak
- [x] Document specific evidence in findings.md
- **Status:** in_progress

### Phase 3: Optimization Strategy
- [ ] Define a target visual direction that fits the product
- [ ] Break the work into visual system, layout, and page-level actions
- [ ] Prioritize changes by impact and implementation cost
- **Status:** pending

### Phase 4: Validation
- [ ] Check that recommendations fit current role-based product structure
- [ ] Ensure the plan aligns with existing theme and component system
- [ ] Confirm no backend or architecture assumptions were introduced
- **Status:** pending

### Phase 5: Delivery
- [ ] Summarize the plan for the user in concise Chinese
- [ ] Include concrete page examples and rollout order
- [ ] Deliver without code changes to the app itself
- **Status:** pending

## Key Questions
1. 当前项目的“难看”主要来自哪些层面：主题、布局、信息层级、组件语言还是页面密度？
2. 在不重写全站的前提下，哪些改动能最快让演示项目显得更有设计判断？

## Decisions Made
| Decision | Rationale |
|----------|-----------|
| 先审视现有主题、全局样式和代表性页面，再给方案 | 避免输出脱离项目现状的模板化建议 |
| 只给方案，不直接实现代码 | 用户明确要求“不用实现代码” |
| 方案将按视觉系统、布局结构、关键页面、执行顺序来组织 | 便于后续落地和评估成本 |

## Errors Encountered
| Error | Attempt | Resolution |
|-------|---------|------------|
| `Get-Content` 在当前 `cmd` 语义下不可用 | 1 | 改用 `type` 读取本地技能与模板文件 |

## Notes
- Update phase status as you progress: pending -> in_progress -> complete
- Re-read this plan before major decisions
- Log errors and odd environment behavior
