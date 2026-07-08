#!/usr/bin/env bash
set -euo pipefail

API="http://localhost:3000/api"

echo "============================================"
echo "  Howard AIOS - Demo Data Generator v0.6"
echo "============================================"
echo ""

# ── Organization IDs ──────────────────────────────────────────────────────
ORGS=(
  "10000000-0000-0000-0000-000000000001"
  "20000000-0000-0000-0000-000000000001"
  "30000000-0000-0000-0000-000000000001"
  "40000000-0000-0000-0000-000000000001"
)
ORG_NAMES=("北京哈顿幼儿园" "长春汽车营销" "长春安保" "郑州互联网公司")

# ── Helpers ───────────────────────────────────────────────────────────────
create_meeting() {
  local org_header="$1" title="$2" desc="$3" location="$4" status="$5" started="$6" participants="$7" tags="$8" transcript="$9"
  curl -s -X POST "$API/meetings" \
    -H "Content-Type: application/json" \
    -H "$org_header" \
    -d "{\"title\":\"$title\",\"description\":\"$desc\",\"location\":\"$location\",\"status\":\"$status\",\"startedAt\":\"$started\",\"durationMin\":60,\"participants\":$participants,\"tags\":$tags,\"transcript\":\"$transcript\"}" 2>/dev/null
}

process_meeting() {
  local id="$1" org_header="$2"
  if [ -n "$id" ]; then
    curl -s -X POST "$API/meetings/$id/process" \
      -H "Content-Type: application/json" \
      -H "$org_header" > /dev/null 2>&1
    return 0
  fi
  return 1
}

# ── Meetings per company ─────────────────────────────────────────────────
# Format: title|desc|location|status|date|participants|tags|transcript
HATTON_MEETINGS=(
  "秋季招生筹备会|讨论秋季学期招生策略|会议室A|COMPLETED|2026-07-01T09:00:00Z|刘芳,王丽,陈静|招生,marketing|刘芳提出今年招生目标增长20%。王丽建议增加开放日活动。Decision: 每周举办一次校园开放日。TODO: 制作招生宣传册。Risk: 周边竞品幼儿园增多。Important: 双语课程是核心竞争力。"
  "教师培训月度总结|培训效果评估|多功能厅|COMPLETED|2026-07-03T14:00:00Z|王丽,陈静,张敏|教育,培训|王丽汇报教师培训进展。陈静反馈新教师适应良好。Decision: 继续推行师徒制。TODO: 安排下月培训主题。Risk: 部分老教师抵触新方法。"
  "安全卫生检查整改|落实消防整改要求|办公室|COMPLETED|2026-07-05T10:00:00Z|刘芳,张敏|安全,合规|消防检查发现3处需整改项目。Decision: 一周内完成整改。TODO: 联系消防设备供应商。Risk: 整改成本可能超预算。必须在本月内完成所有安全整改。"
  "家长会筹备|期末家长会安排|会议室A|COMPLETED|2026-07-08T09:00:00Z|陈静,张敏|家长,沟通|讨论了家长会的形式和内容。Decision: 采用线上+线下结合模式。TODO: 制作家长反馈问卷。Risk: 部分家长时间冲突。"
  "课程研发讨论|新课程体系设计|教研室|COMPLETED|2026-07-10T10:00:00Z|刘芳,王丽,陈静|课程,研发|刘芳提出引入STEM教育模块。Decision: 下学期试点STEM课程。TODO: 联系STEM教材供应商。Important decision: 投入10万用于课程研发。"
  "预算审批会议|下学期预算讨论|办公室|COMPLETED|2026-07-12T14:00:00Z|刘芳,王丽|财务,预算|审核了各部门预算申请。Decision: 总预算批准200万。Risk: 人工成本上涨15%。TODO: 细化各部门预算分配。"
  "户外活动安全会议|户外活动安全规范|会议室B|COMPLETED|2026-07-15T09:00:00Z|张敏,陈静|安全,活动|讨论了户外活动安全标准。Decision: 每次户外活动配备急救包。TODO: 制定安全操作手册。"
  "Q4发展规划|第四季度战略部署|会议室A|SCHEDULED|2026-09-01T09:00:00Z|刘芳,王丽,陈静,张敏|规划,Q4|第四季度整体规划讨论"
)

AUTO_MEETINGS=(
  "Q3销售策略会议|第三季度销售目标分解|营销中心|COMPLETED|2026-07-02T09:00:00Z|孙强,李军,周涛|销售,策略|孙强提出Q3销售目标500台。李军建议重点推广新能源车型。Decision: 线上营销预算增加30%。TODO: 制定周度销售计划。Risk: 芯片短缺影响库存。Important: 必须抓住金九银十窗口期。"
  "新媒体营销方案|直播卖车方案讨论|线上会议|COMPLETED|2026-07-04T14:00:00Z|李军,周涛|营销,新媒体|讨论了抖音直播卖车方案。Decision: 每周3场直播。TODO: 培训主播团队。Risk: 线上转化率低。必须建立完整的线上销售闭环。"
  "客户关系维护|VIP客户回访计划|客户关系部|COMPLETED|2026-07-06T10:00:00Z|孙强,周涛|客户,CRM|分析了客户满意度数据。Decision: 建立VIP客户专属服务团队。TODO: 上线客户积分系统。Risk: 售后投诉率上升。"
  "新车发布会筹备|秋季新品发布|展览中心|COMPLETED|2026-07-09T09:00:00Z|孙强,李军|发布,活动|发布会场地已确认。Decision: 邀请200位媒体嘉宾。TODO: 制作发布会邀请函。Risk: 竞品同期发布。"
  "库存管理优化|库存周转率提升|仓库管理部|COMPLETED|2026-07-11T14:00:00Z|周涛,李军|库存,运营|库存周转率偏低。Decision: 实施JIT管理模式。TODO: 与厂商建立实时库存共享。Risk: 物流成本增加。"
  "金融方案评审|汽车金融产品优化|财务部|COMPLETED|2026-07-14T10:00:00Z|孙强,周涛|金融,产品|讨论了零利率分期方案。Decision: 推出36期零利率产品。TODO: 与银行谈判合作条款。"
  "团队建设活动|季度团建安排|户外基地|SCHEDULED|2026-09-05T09:00:00Z|孙强,李军,周涛|团队,文化|季度团队建设活动规划"
)

SECURITY_MEETINGS=(
  "安保方案评审|新项目安保方案设计|指挥中心|COMPLETED|2026-07-01T08:00:00Z|赵刚,马亮,杨帆|安保,方案|赵刚强调新项目需要24小时轮班制。Decision: 采用三班倒制度。TODO: 招聘20名新保安。Risk: 人员流失率高。Important: 客户对安保标准要求极高。"
  "监控设备升级|智能监控系统采购|采购部|COMPLETED|2026-07-03T10:00:00Z|杨帆,马亮|设备,采购|评估了三家供应商方案。Decision: 选择海康威视方案。TODO: 安排现场安装。Risk: 安装周期可能延误。必须月底前完成系统部署。"
  "应急预案演练|突发事件应急演练|训练场|COMPLETED|2026-07-05T09:00:00Z|赵刚,杨帆|应急,训练|模拟了火灾和入侵场景。Decision: 每季度举行一次全员演练。TODO: 更新应急预案手册。Risk: 部分新员工应急响应不够迅速。"
  "客户拜访汇报|重点客户拜访总结|客户部|COMPLETED|2026-07-08T14:00:00Z|马亮,赵刚|客户,汇报|拜访了5家重点客户。Decision: 针对政府客户提供定制化服务。TODO: 准备专项服务方案。Risk: 客户压价压力。"
  "ISO认证准备|安全管理体系认证|质量部|COMPLETED|2026-07-10T10:00:00Z|杨帆,赵刚,马亮|认证,ISO|整理了ISO27001认证材料。Decision: 聘请外部顾问辅导。TODO: 完成内部审核。Risk: 认证周期可能延长。"
  "月度绩效评估|各部门绩效考核|会议室|COMPLETED|2026-07-13T09:00:00Z|赵刚,马亮,杨帆|绩效,管理|各部门绩效数据汇总。Decision: 优秀员工奖金提升20%。TODO: 完善绩效考核指标体系。"
  "年度预算编制|下年度预算规划|财务部|SCHEDULED|2026-09-10T09:00:00Z|赵刚,马亮,杨帆|预算,财务|年度预算编制启动"
)

TECH_MEETINGS=(
  "产品路线图评审|Q3-Q4产品规划|技术会议室|COMPLETED|2026-07-02T10:00:00Z|胡磊,吴婷,徐峰|产品,roadmap|胡磊展示了产品路线图。Decision: 优先开发协作功能模块。TODO: 输出详细PRD。Risk: 开发资源紧张。Important: 必须在Q4前完成MVP。"
  "技术架构评审|微服务迁移方案|技术会议室|COMPLETED|2026-07-04T14:00:00Z|徐峰,吴婷,林雨|架构,技术|讨论了微服务迁移策略。Decision: 采用领域驱动设计。TODO: 拆分用户服务模块。Risk: 数据一致性挑战。必须保证向后兼容。"
  "融资路演准备|A轮融资材料准备|CEO办公室|COMPLETED|2026-07-07T09:00:00Z|胡磊,吴婷|融资,投资|准备了投资人演示材料。Decision: 目标估值5000万。TODO: 完善财务模型。Risk: 投资人对SaaS市场持谨慎态度。"
  "Sprint回顾|迭代回顾会议|站会区|COMPLETED|2026-07-09T15:00:00Z|徐峰,吴婷,林雨|敏捷,Sprint|本Sprint完成了12个Story。Decision: 引入代码审查规范。TODO: 搭建自动化测试环境。Risk: 技术债积累。"
  "客户Demo|重点客户演示|演示室|COMPLETED|2026-07-11T10:00:00Z|胡磊,吴婷|客户,Demo|成功完成客户演示。Decision: 根据客户反馈优化UI。TODO: 整理客户需求清单。Risk: 客户定制需求较多。"
  "安全审计|代码安全审查|技术会议室|COMPLETED|2026-07-14T09:00:00Z|徐峰,林雨|安全,审计|发现3个中等风险漏洞。Decision: 本Sprint修复所有安全问题。TODO: 引入SAST工具。必须消除所有高危漏洞。"
  "基础设施优化|云服务成本优化|运维室|COMPLETED|2026-07-16T14:00:00Z|徐峰,吴婷|基础设施,运维|云服务月费偏高。Decision: 迁移到预留实例。TODO: 评估K8s部署方案。Risk: 迁移期间服务稳定性。"
  "招聘计划讨论|技术团队扩招|HR会议室|COMPLETED|2026-07-18T10:00:00Z|胡磊,林雨|招聘,团队|讨论了3个岗位需求。Decision: 优先招聘Senior后端工程师。TODO: 发布JD到各大平台。Risk: 招聘周期可能较长。"
  "Q4战略规划|第四季度战略讨论|CEO办公室|SCHEDULED|2026-09-01T09:00:00Z|胡磊,吴婷,徐峰,林雨|战略,Q4|Q4整体战略规划"
)

# ── Process all companies ─────────────────────────────────────────────────

for idx in "${!ORGS[@]}"; do
  org_id="${ORGS[$idx]}"
  org_name="${ORG_NAMES[$idx]}"
  ORG_HEADER="x-organization-id: $org_id"

  echo "════════════════════════════════════════════════"
  echo "  🏢 $org_name ($org_id)"
  echo "════════════════════════════════════════════════"
  echo ""

  # Get meetings array based on company
  case $idx in
    0) MEETINGS=("${HATTON_MEETINGS[@]}") ;;
    1) MEETINGS=("${AUTO_MEETINGS[@]}") ;;
    2) MEETINGS=("${SECURITY_MEETINGS[@]}") ;;
    3) MEETINGS=("${TECH_MEETINGS[@]}") ;;
  esac

  MIDS=()

  # Create meetings
  echo "  📅 Creating ${#MEETINGS[@]} meetings..."
  for i in "${!MEETINGS[@]}"; do
    IFS='|' read -r title desc loc status started parts tags transcript <<< "${MEETINGS[$i]}"
    IFS=',' read -ra PARR <<< "$parts"
    PJSON=$(printf ',"%s"' "${PARR[@]}")
    PJSON="[${PJSON:1}]"
    IFS=',' read -ra TAGARR <<< "$tags"
    TJSON=$(printf ',"%s"' "${TAGARR[@]}")
    TJSON="[${TJSON:1}]"

    result=$(create_meeting "$ORG_HEADER" "$title" "$desc" "$loc" "$status" "$started" "$PJSON" "$TJSON" "$transcript")
    mid=$(echo "$result" | python3 -c "import sys,json; print(json.load(sys.stdin).get('data',{}).get('id',''))" 2>/dev/null || echo "")
    MIDS+=("$mid")
    echo "    ✅ $((i+1))/${#MEETINGS[@]}: $title"
  done

  # Process meetings (knowledge + memory)
  echo ""
  echo "  🔬 Processing meetings (AI → Knowledge → Memory)..."
  processed=0
  for i in "${!MIDS[@]}"; do
    mid="${MIDS[$i]}"
    if [ -n "$mid" ]; then
      if process_meeting "$mid" "$ORG_HEADER"; then
        processed=$((processed + 1))
        echo "    ✅ Meeting $((i+1)) processed"
      fi
    fi
  done
  echo "  📊 $processed meetings processed"

  # Create recordings for first 3 meetings
  echo ""
  echo "  🎤 Creating recordings..."
  for i in 0 1 2; do
    mid="${MIDS[$i]:-}"
    if [ -n "$mid" ]; then
      curl -s -X POST "$API/meetings/$mid/recordings" \
        -H "Content-Type: application/json" \
        -H "$ORG_HEADER" \
        -d "{\"title\":\"${org_name}录音$((i+1))\",\"fileName\":\"recording-$((i+1)).mp3\",\"mimeType\":\"audio/mpeg\",\"fileSize\":$((RANDOM % 10000000 + 1000000)),\"duration\":$((RANDOM % 3600 + 600)),\"speakerCount\":$((RANDOM % 4 + 2)),\"language\":\"zh\"}" > /dev/null 2>&1
      echo "    ✅ Recording $((i+1))"
    fi
  done

  # Create inbox items
  echo ""
  echo "  📥 Creating inbox items..."
  sources=("MANUAL" "WECHAT" "DINGTALK" "FEISHU" "EMAIL")
  priorities=("URGENT" "HIGH" "NORMAL" "LOW")
  for i in $(seq 1 8); do
    src=${sources[$((RANDOM % 5))]}
    pri=${priorities[$((RANDOM % 4))]}
    curl -s -X POST "$API/inbox" \
      -H "Content-Type: application/json" \
      -H "$ORG_HEADER" \
      -d "{\"sourceType\":\"$src\",\"content\":\"${org_name}收件箱消息 $i: 关于重要业务进展的通知和待办事项\",\"priority\":\"$pri\",\"title\":\"${org_name}消息 $i\"}" > /dev/null 2>&1
  done
  echo "    ✅ 8 inbox items"

  # Create documents
  echo ""
  echo "  📄 Creating documents..."
  types=("pdf" "doc" "md" "txt" "xls")
  for i in $(seq 1 5); do
    tp=${types[$((RANDOM % 5))]}
    curl -s -X POST "$API/documents/simulate-upload" \
      -H "Content-Type: application/json" \
      -H "$ORG_HEADER" \
      -d "{\"fileName\":\"${org_name}-document-$i.$tp\",\"mimeType\":\"application/$tp\",\"fileSize\":$((RANDOM % 5000000 + 100000))}" > /dev/null 2>&1
  done
  echo "    ✅ 5 documents"

  # Create knowledge + memory directly via API
  echo ""
  echo "  🧠 Creating extra knowledge and memory..."
  curl -s -X POST "$API/knowledge/extract" \
    -H "Content-Type: application/json" \
    -H "$ORG_HEADER" \
    -d "{\"text\":\"${org_name}的核心业务包括专业服务、团队管理和创新发展。创始人带领团队制定了重要的战略决策。公司面临的主要风险包括市场竞争加剧和人才流失。当前重点工作是提升服务质量和扩大市场份额。Decision: 加大研发投入提升核心竞争力。TODO: 完成年度战略规划。Risk: 宏观经济不确定性增加。\",\"source\":\"demo\",\"sourceId\":\"demo-$org_id\"}" > /dev/null 2>&1

  curl -s -X POST "$API/memories/extract" \
    -H "Content-Type: application/json" \
    -H "$ORG_HEADER" \
    -d "{\"text\":\"${org_name}近期重要会议讨论了公司发展方向和团队建设。关键决策包括优化业务流程和提升客户体验。待办事项包括完成产品迭代和人才招聘。团队需要关注市场竞争和技术变化。\",\"source\":\"demo\",\"sourceId\":\"demo-$org_id\"}" > /dev/null 2>&1
  echo "    ✅ Knowledge + Memory created"

  echo ""
  echo "  ✅ ${org_name} demo data complete!"
  echo ""
done

# ── Summary ───────────────────────────────────────────────────────────────
echo ""
echo "============================================"
echo "  ✅ All demo data generated successfully!"
echo ""
echo "  🏢 4 companies:"
echo "     北京哈顿幼儿园 — 8 meetings, 8 inbox, 5 docs, 3 recordings"
echo "     长春汽车营销  — 7 meetings, 8 inbox, 5 docs, 3 recordings"
echo "     长春安保      — 7 meetings, 8 inbox, 5 docs, 3 recordings"
echo "     郑州互联网公司 — 9 meetings, 8 inbox, 5 docs, 3 recordings"
echo ""
echo "  📊 Per company:"
echo "     📅 Meetings (processed → Knowledge + Memory)"
echo "     📥 Inbox items (various sources)"
echo "     📄 Documents (uploaded)"
echo "     🎤 Recordings (linked to meetings)"
echo "     🧠 Knowledge graph nodes"
echo "     💾 Memory entries"
echo "     📋 Tasks + Decisions (from seed)"
echo ""
echo "  🌐 Frontend:  http://localhost:3001"
echo "  📡 Swagger:   http://localhost:3000/docs"
echo "  🤖 CEO:       http://localhost:3001/ceo"
echo "  📅 Meetings:  http://localhost:3001/meetings"
echo "  🧠 Knowledge: http://localhost:3001/knowledge"
echo "  📥 Inbox:     http://localhost:3001/inbox"
echo "  🔍 Search:    http://localhost:3001/search"
echo "============================================"
