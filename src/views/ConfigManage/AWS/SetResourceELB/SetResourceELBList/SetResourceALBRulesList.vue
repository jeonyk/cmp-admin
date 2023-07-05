<template>
  <div
    class="set-resource-alb-rules-list flex-wrap"
    style="gap: 40px;"
  >
    <section>
      <search-component
        placeholder="ALB 규칙 템플릿 이름 검색"
        @search="() => {}"
      />

      <div class="rule-list flex-wrap">
        <alb-rule-item
          v-for="(rule, idx) in ruleTemplateList"
          :key="idx"
          :name="rule.name"
          :rule-count="rule.count"
          :update-date="rule.updateDate"
          :desc="rule.desc"
          :active="rule.active"
          @click="clickPanel(rule)"
        />
      </div>
    </section>

    <section
      class="rule-detail-wrapper"
      :class="{'-active': !!activeRule}"
    >
      <span
        v-if="!activeRule"
        class="empty-text"
      >
        템플릿 목록에서 템플릿을 선택해주세요
      </span>

      <template v-else>
        <h4 class="flex-wrap">
          규칙 템플릿 상세 <small class="reference-text">(영역 <strong>1</strong>개)</small>
        </h4>
        <ol>
          <li
            class="flex-wrap"
            v-for="(temp, index) in templateDetailData"
            :key="index"
          >
            <b class="detail-index">
              {{ index + 1 }}
            </b>

            <alb-rule-detail-panel
              type="condition"
              :data="temp.condition"
            />
            <alb-rule-detail-panel
              type="work"
              :data="temp.work"
            />
          </li>
        </ol>
      </template>
    </section>
  </div>
</template>

<script>
import ALBRuleItem from './ALBRuleItem.vue'
import ALBRuleDetailPanel from './ALBRuleDetailPanel.vue'
export default {
  name: 'SetResourceALBRulesList',
  components: {
    'alb-rule-item': ALBRuleItem,
    'alb-rule-detail-panel': ALBRuleDetailPanel
  },
  data: () => ({
    activeRule: null, // 활성화 된 rule
    ruleTemplateList: [
      { name: 'ALB 규칙 템플릿 이름_1', count: 100, updateDate: '2022.04.07 16:46', desc: 'ALB 규칙 설명 노출 / EX: 해당 템플릿은 이마트 전용 ALB 규칙으로 사용 예정', active: false }
    ],
    templateDetailData: [
      {
        condition: [
          { label: '호스트', value: '호스트 dev-rule-test-2132343434.ap' }
        ],
        work: [
          { label: '고정 응답 반환', value: '503' },
          { label: '콘텐츠 유형', value: 'text/plain' },
          { label: '응답본문', value: 'dns를 통해 접근하였습니다.' }
        ]
      },
      {
        condition: [
          { label: 'HTTP 헤더', value: 'TEST은(는) DEV' }
        ],
        work: [
          { label: '전달', value: 'TARGETGROUP_1 (가중치: 100%)' },
          { label: '그룹수준 고정성', value: '비활성' }
        ]
      },
      {
        condition: [
          { label: '쿼리 문자열', value: 'TEST:DEV' }
        ],
        work: [
          { label: '전달', value: 'TARGETGROUP_1 (가중치: 100%)' },
          { label: '그룹수준 고정성', value: '비활성' }
        ]
      },
      {
        condition: [
          { label: 'HTTP 요청 메서드', value: 'POST' }
        ],
        work: [
          { label: '리디렉션 대상', value: '-' },
          { label: '상태 코드', value: 'https:301' }
        ]
      },
      {
        condition: [
          { label: '호스트', value: '호스트 dev-rule-test-2132343434.ap' }
        ],
        work: [
          { label: '고정 응답 반환', value: '503' },
          { label: '콘텐츠 유형', value: 'text/plain' },
          { label: '응답본문', value: 'dns를 통해 접근하였습니다.' }
        ]
      }
    ]
  }),
  methods: {
    clickPanel (rule) {
      if (rule.active) {
        rule.active = false
      } else {
        this.ruleTemplateList.forEach(item => { item.active = false })
        rule.active = true
      }

      if (rule.active) this.activeRule = rule
      else this.activeRule = null
    }
  }
}
</script>

<style lang="scss" scoped>
  .set-resource-alb-rules-list {
    align-items: flex-start;
    section:first-child { width: 800px; }
  }

  .rule-list {
    width: 100%;
    margin-top: 15px;
  }

  h4 { font-size: 16px; font-weight: bold; }
  small.reference-text { margin-left: 5px; color: $input-placeholder; }

  section.rule-detail-wrapper {
    flex: 1 1 auto;
    border: 1px solid $input-stroke;
    border-radius: $radius;
    &.-active {
      padding: $gap $gap 0 $gap;
      background-color: $dark-navy;
      border-color: $dark-navy;
    }

    .empty-text {
      display: block;
      text-align: center;
      line-height: 700px;
      color: $input-placeholder;
      font-size: 16px;
    }

    ol {
      display: flex;
      flex-direction: column;
      gap: $gap-s;
      margin: $gap 0;
      overflow-y: auto;
      max-height: 630px;
      > li { gap: 15px; }

      .detail-index {
        display: block;
        margin-right: 15px;
        width: 30px;
        text-align: center;
        font-size: 16px;
        line-height: 30px;
        color: $input-placeholder;
        border: 1px solid $input-placeholder;
        border-radius: 2px;
      }
      .alb-rule-detail-panel { width: calc(50% - 50px); }
    }
  }
</style>
