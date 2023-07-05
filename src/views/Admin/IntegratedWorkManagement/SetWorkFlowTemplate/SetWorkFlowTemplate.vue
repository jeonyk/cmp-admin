<template>
  <section class="set-workflow-template">
    <article>
      <h2>{{ $v('서비스 정보') }}</h2>
      <div class="workflow-set-service">
        <div class="-scroll">
          <g-tree
            view-line
            :data="treeData"
            :selectable-all-item="false"
            @selected="selectedService"
          />
        </div>
      </div>
    </article>
    <!-- /. 서비스 정보 -->

    <article>
      <h2>{{ $v('보고서 템플릿 목록') }}</h2>
      <div class="workflow-set-flow">
        <div class="workflow-set-process">
          <span
            v-if="!service"
            class="template-tabs -empty"
          >
            {{ $v('서비스 정보가 선택되지 않았습니다.') }}
          </span>

          <div
            v-loading="loading"
            v-else
            class="template-tabs"
          >
            <div class="template-tabs-headers">
              <div
                v-for="tab in tabs"
                :key="tab.field"
                :class="{ '-active': field === tab.field }"
                @click="setField(tab.field)"
              >
                {{ tab.name }}
              </div>
            </div>
            <!-- /. [작업계획서, 작업완료보고서, 사후완료보고서] 탭 헤더 영역 -->

            <div class="template-tabs-body">
              <div class="tab-search">
                <el-input
                  v-model="value"
                  @input="search"
                  placeholder="문서 템플릿 목록을 검색해주세요."
                />
                <i class="search-icon" />
              </div>
              <!-- /. [검색] 영역 -->

              <span
                v-if="!templates.length"
                class="-empty"
              >
                {{ $v('데이터가 없습니다.') }}
              </span>

              <div
                v-else
                class="template-list-wrapper"
              >
                <ul class="template-list">
                  <li
                    class="template-list-item"
                    v-for="item in templates"
                    :key="item.idx"
                    @click="goDetail(item.idx)"
                  >
                    <a>
                      <div class="template-info">
                        <strong>{{ item.title }}</strong>

                        <span class="button-area">
                          <a class="-icon -edit-icon" />
                          <a
                            class="-icon -delete-icon"
                            @click.stop="deleteTemplate(item.idx)"
                          />
                        </span>
                      </div>
                      <!-- /. 복사/편집/삭제 버튼 -->

                      <span>{{ item.updatedTime | date('YYYY.MM.DD') }}</span>
                    </a>
                  </li>
                </ul>
              </div>

              <div class="button-area -center">
                <button
                  class="button"
                  type="is-primary"
                  @click="goDetail()"
                >
                  {{ $v('보고서 템플릿 등록') }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </article>
    <!-- /. 문서 템플릿 목록 -->
  </section>
</template>

<script>
import API, { GTree } from '@sd-fe/cmp-core'
import Mixins from '../Mixins.script'

export default {
  name: 'SetWorkFlowTemplate',
  mixins: [Mixins],
  components: {
    'g-tree': GTree
  },
  async created () {
    this.setField(this.tabs[0]?.field)
  },
  methods: {
    /**
     * [보고서 템플릿 목록] 탭 클릭 이벤트
     * @param {String} field
     */
    setField (field) {
      this.field = field
      this.value = undefined
      this.currentPage = 1

      this.search(this.value)
    },

    /**
     * 모든 템플릿 가져오기
     * 개수가 많지 않아 내부에서 분류 및 검색
     */
    async getDocTemplates () {
      try {
        this.loading = true
        const response = await API.work_v3.getDocTemplates()

        // [서비스정보]
        const roleIdx = this.service?.field
        const orderType = this.service?.parentNode?.field.toUpperCase()
        const cloudType = this.service?.parentNode?.parentNode.field.toUpperCase()

        const result = response.filter(template => {
          const { roleIdx: idx, cloud, mode } = template.category

          return (
            cloud === cloudType &&
            mode === orderType &&
            idx === roleIdx
          )
        })

        return result
      } catch (error) {
        console.error('@@ getDocTemplates', error)
        return []
      } finally {
        this.loading = false
      }
    },

    /**
     * 템플릿 삭제
     * @param {Number} idx
     */
    deleteTemplate (idx) {
      this.$confirm(this.$v('해당 템플릿을 삭제하시겠습니까?'), {
        confirmButtonText: this.$v('삭제'),
        cancelButtonText: this.$v('취소')
      }).then(async () => {
        try {
          await API.work_v3.deleteDocTemplate(idx)

          this.$alert(this.$v('삭제되었습니다.'), { callback: () => false })
          this.rawTemplates = await this.getDocTemplates()
          this.search(this.value)
        } catch (error) {
          console.error('@@ deleteTemplate', error)
          this.$alrt(error.message)
        }
      }).catch(() => false)
    },

    /**
     * [서비스 정보] 선택시 발생하는 이벤트
     * @param {Object} service 선택한 [서비스 정보] 데이터
     */
    async selectedService (service) {
      this.setField(this.tabs[0]?.field)

      this.service = service
      this.rawTemplates = await this.getDocTemplates()

      this.search(this.value)
    },

    /**
     * [검색] Input 이벤트
     * @param {String} value
     */
    search (value = this.value) {
      const regex = new RegExp(value, 'g')

      this.templates = this.rawTemplates.filter(template => {
        return (
          template.category.docType === this.field && // 보고서 탬플릿 타입 확인
          regex.test(template.title)// 검색 내용 확인
        )
      })
    },

    /**
     * 템플릿 선택시 상세 페이지로 이동
     * id 정보가 없다면 템플릿을 새로 등록하는 신규 페이지
     * @param {String} id
     */
    goDetail (id) {
      // [서비스정보]
      const roleIdx = this.service?.field
      const orderType = this.service?.parentNode?.field.toUpperCase()
      const cloudType = this.service?.parentNode?.parentNode.field.toUpperCase()

      return this.$router.push({
        name: 'integrated-work-management-template-detail',
        query: { id, roleIdx, mode: orderType, cloudType, docType: this.field }
      })
    }
  },
  data: root => ({
    loading: false,
    service: null, // [서비스정보] 선택한 서비스 (Object)
    field: undefined, // [보고서 템플릿 목록] 선택된 보고서 타입
    value: undefined, // 템플릿 목록 input value
    tabs: [
      { field: 'PLAN', name: root.$v('작업계획서') },
      { field: 'REPORT', name: root.$v('작업완료보고서') },
      { field: 'AA_REPORT', name: root.$v('사후완료보고서') }
    ],
    currentPage: 1,
    rawTemplates: [], // 가공되지 않은 템플릿 목록
    templates: []
  })
}
</script>

<style lang="scss" scoped>
.set-workflow-template {
  display: grid;
  grid-template-columns: 380px auto;
  grid-template-rows: 720px;
  column-gap: 50px;

  h2 {
    color: $white;
    font-size: 16px;
    margin-bottom: 20px;
  }

  .workflow {
    &-set-service {
      box-sizing: border-box;
      height: 680px;
      background-color: $dark-navy;
      border-radius: 6px;
      padding: $gap-s $gap;
      position: relative;

      .-scroll {
        overflow-y: auto;
        height: 100%;
      }
    }

    &-set-flow {
      height: 680px;
      grid-column: 1;
      background-color: $dark-navy;
      border-radius: 6px;
      padding: $gap-m;
      box-sizing: border-box;
    }

    &-set-process {

      .template-tabs {

        &-headers {
          display: flex;
          align-items: center;
          position: relative;

          > div {
            z-index: 1;
            line-height: 40px;
            width: 150px;
            text-align: center;
            margin-right: 3px;
            border-radius: 5px 5px 0px 0px;
            background-color: #353951;
            cursor: pointer;

            &.-active { background-color: $primary; }
          }

          &::after {
            content: '';
            position: absolute;
            bottom: 0;
            height: 2px;
            width: 100%;
            background-color: #353951;
            z-index: 0;
          }
        }

        &-body {
          padding-top: $gap;
          height: 560px;
          position: relative;

          .tab-search {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: $gap;

            .el-input::v-deep {
              .el-input__inner {
                border: none;
                border-radius: 0;
                border-bottom: 1px solid $purple-gray;
              }
            }

            .search-icon {
              margin-left: 5px;
              display: block;
              position: relative;
              width: 15px; height: 15px;
              cursor: pointer;
              box-sizing: border-box;
              background-image: url('../../../../assets/images/icon-search.svg');
            }
          }

          > .button-area {
            position: absolute;
            bottom: -10px; right: 0; left: 0;
          }
        }

        .template-list {
          overflow-y: auto;
          height: 470px;

          &-wrapper {
          }

          &-item {
            box-sizing: border-box;
            border-bottom: 1px solid $dark-slate;
            height: 78px;
            display: flex;
            align-items: center;
            justify-content: space-between;

            > a {
              display: flex;
              flex-direction: column;
              justify-content: center;
              height: 100%;
              width: 100%;
              padding: 0 $gap;
              transition: .3s ease background;

              &:hover { background-color:  rgba(63, 85, 187, 0.3); }

              .template-info {
                display: flex;
                align-items: center;
                justify-content: space-between;
                width: 100%;
                margin-bottom: 5px;

                strong {
                  display: block;
                  font-weight: normal;
                  line-height: 1.5;
                  font-size: 15px;
                }
              }
              span { color: $input-placeholder }
            }

            .button-area {
              width: 40px;
              display: flex;
              align-items: center;
              justify-content: space-between;
            }
          }

        }

      }
    }
  }

  .-empty {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 510px;
    color: $input-placeholder;
  }
}
</style>
