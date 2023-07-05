<template>
  <section class="set-workflow">
    <g-foldable :title="$v('공통 설정')">
      <template #contents>
        <article class="set-workflow-contents">
          <h5 class="-title">
            {{ $v('일정 설정') }}
          </h5>

          <div>
            <strong class="label">{{ $v('완료 희망일 설정') }}</strong>
            <el-input-number
              v-model="values.expectProcessDay"
              size="mini"
              :min="1"
              :max="90"
            />
            <span class="quote">{{ $v('일 후') }}</span>
          </div>
        </article>
        <!-- /. 완료 희망일 설정, 과금 시작일 설정, 삭제 대기일 설정 -->

        <article class="set-workflow-contents">
          <h5 class="-title">
            {{ $v('보존년한 설정') }}

            <el-tooltip
              effect="light"
              popper-class="shade-popper"
            >
              <i class="mdi mdi-information-outline" />
              <div
                slot="content"
                v-html="$v('보존년한이 OFF 인 경우 영구 저장되며, 보존년한이 ON 인 경우 <br>전자상거래 등에서의 소비자보호에 관한 법률 제6조(거래기록의 보존 등)에 의해 <br>최소 5년간 주문, 결재, 작업 내역이 저장됩니다. <br>(설정 시점 5년 이전의 자료는 모두 삭제되고, 현재 시점 5년간의 데이터를 보존합니다.)')"
              />
            </el-tooltip>
          </h5>

          <el-switch
            class="switch"
            v-model="values.usePreservePeriod"
            @change="changePreservePeriod"
          />
          <!-- /. 보존년한 설정 -->

          <div v-if="values.usePreservePeriod">
            <strong class="label">{{ $v('보존 기간') }}</strong>
            <el-input-number
              v-model="values.preservePeriodYear"
              size="mini"
              :min="1"
              disabled
            />
            <span class="quote">{{ $v('년') }}</span>
            <span
              class="description"
              v-html="$v('❊ 보존년한이 ON 인 경우 소비자보호에 관한 법률 제6조에 의해 최소 5년간 주문, 결재, 작업 내역이 저장됩니다. <br> (설정 시점을 기준으로 데이터를 보관한다. Ex)5년간 데이터 보존)')"
            />
          </div>
          <!-- /. 보존 기간 -->
        </article>

        <article class="set-workflow-contents">
          <h5 class="-title">
            {{ $v('사후결재함') }}

            <el-tooltip
              effect="light"
              popper-class="shade-popper"
            >
              <i class="mdi mdi-information-outline" />
              <div
                slot="content"
                v-html="$v('사용자가 자원 변경을 요청하여 관리자가  이행했을 때,<br>사용자에게 결재함을 통해 자동으로 알리는 결재 자료입니다.')"
              />
            </el-tooltip>
          </h5>

          <el-switch
            class="switch"
            v-model="values.useAfterAction"
          />
          <!-- /. 외부 결재 문서 -->
        </article>

        <div class="modal-button-area button-area">
          <button
            class="button"
            type="is-primary"
            @click="save"
          >
            {{ $v('저장') }}
          </button>
        </div>
      </template>
    </g-foldable>
  </section>
</template>

<script>
import GFoldable from '@/components/common/g-foldable/g-foldable'

export default {
  name: 'SetWorkFlowDefaultInfo',
  components: {
    'g-foldable': GFoldable
  },
  props: {
    data: {
      type: Object,
      default: () => {}
    }
  },
  watch: {
    data (data) {
      /*
        const {
          expectProcessDay, // 완료희망일 설정
          usePreservePeriod, // 보존기간 사용여부
          preservePeriodYear, // 보존기간 설정
          useAfterAction // 사후결재함 설정
        } = data
      */

      // console.log(data)
      this.values = { ...data }
    }
  },
  methods: {
    /**
     * [보존년한] OFF 시 [보존기간] UI 숨김
     * [보존년한] ON 시  [보존기간] 5년 고정
     */
    changePreservePeriod (check) {
      this.values.preservePeriodYear = check ? 5 : null
    },

    /**
     * [저장] 버튼 클릭시 발생하는 이벤트
     */
    save () {
      return this.$confirm(this.$v('저장하시겠습니까?'))
        .then(() => this.$emit('save', this.values))
        .catch(() => false)
    }
  },
  data: () => ({
    values: {}
  })
}
</script>

<style lang="scss" scoped>
.set-workflow {

  &-contents {
    border-bottom: 1px solid #d9d9d9;
    margin-bottom: $gap;
    padding-bottom: $gap;
    display: flex;
    flex-direction: column;
    position: relative;

    .-title {
      grid-column: 1 / 4;
      grid-row: 1;
      font-weight: normal;
      font-size: 16px;
      margin-bottom: 15px;
      display: flex;
      align-items: center;

      & .mdi {
        margin-left: $gap-s;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    }

    > div {
      > .label {
        font-weight: normal;
        font-size: 13px;
        line-height: 22px;
        display: block;
        margin-bottom: 5px;
      }
    }

      .switch {
        position: absolute;
        right: 0;
      }
  }

  .quote { margin-left: $gap-s; }
  .description {
    display: block;
    margin-top: $gap;
    font-size: 12px;
    color: $text-dark-gray;
  }

  .modal-button-area {
    padding: $gap-s 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}
</style>
