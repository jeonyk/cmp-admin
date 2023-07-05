<!--
  * 파일명 : TicketPanel.vue
  * 파일 기능 : [티켓으로 보기]시 티켓 하나의 컴포넌트 입니다. 티켓 내부 컨텐츠입니다.
  * 작성자 : 정재은 외 2명
  * 최종 작성일 : 2021-02-16
  * License By Shinsegae I&C
  * 2021-02-16 Update: 티켓 잘리는 현상 수정
 -->

<template>
  <section
    :class="['ticket-panel']"
  >
    <div class="panel-main">
      <article class="contents-wrap">
        <!-- v-if="data.title.length > 10" -->
        <el-tooltip
          v-if="false"
          :content="data.title"
          placement="top-end"
          popper-class="panel-title-popper"
        >
          <h4 class="panel-title">
            {{ data.title }}
          </h4>
        </el-tooltip>

        <h4
          v-else
          class="panel-title"
        >
          <span class="tit">{{ $t('common.TERMS.ownerRel') }} : </span>
          <span class="info">{{ data.title }}</span>
        </h4>

        <h6 class="admin-info">
          <span>{{ data.company }}</span>
          &nbsp;
          <span>{{ data.part }}</span>
          &nbsp;
          <span>{{ data.name }}</span>
        </h6>

        <ul class="panel-detail-list">
          <!-- <li class="panel-detail-item">
            <span class="tit">카테고리</span>
            <span class="info">{{ data.service }}</span>
          </li> -->
          <li class="panel-detail-item">
            <span class="tit">{{ $t('common.TERMS.project') }}</span>
            <span
              class="info -project"
              v-if="data.project.length > 1"
            >
              <span class="-name">{{ data.project[0].label }}
                <span
                  style="display:inline-block;"
                  class="-other"
                >
                  {{ $t('common.TERMS.other') }} <a class="-link">{{ data.project.length - 1 }}</a>
                </span>
              </span>
              <el-tooltip
                placement="bottom-end"
                popper-class="panel-title-popper"
              >
                <template #content>
                  <span v-html="projectInfo(data.project)" />
                </template>
              </el-tooltip>
            </span>
            <span
              class="info -project"
              v-else
            >
              <!-- #공통프로젝트 신청 텍스트 -->
              <p
                v-if="isCommonProject"
                style="color:#3E57C9; margin-bottom:4px;"
              >
                공통프로젝트 신청
              </p>
              <!-- #AWS 프로젝트 신청 텍트스 -->
              <span
                class="icon-aws"
                v-if="isAws"
              />
              <!-- *****************************  AWS프로젝트 생성, 삭제에 따라 UI 텍스트  -->
              <!-- *****************************  AWS프로젝트 생성, 삭제에 따라 UI 텍스트  -->
              <!-- *****************************  AWS프로젝트 생성, 삭제에 따라 UI 텍스트  -->
              <!-- *****************************  AWS프로젝트 생성, 삭제에 따라 UI 텍스트  -->
              <!-- <span v-if="isNewAwsProject">aws생성</span>
              <span v-if="isAwsResource">aws자원</span>
              <span v-if="isDeleteAwsProject">aws삭제</span> -->

              <span class="-name">{{ data.project[0].label }}</span>
            </span>
          </li>
          <!-- 프로젝트 -->

          <li class="panel-detail-item">
            <span class="tit">{{ isConf ? $t('task.PRIOR.TICKET.startDate') : $t('common.TERMS.ad') }}</span>
            <span class="info">{{ data.applyDate }}</span>
          </li>
          <!-- 협의 시작일 / 신청 일자 -->

          <li
            class="panel-detail-item"
            v-if="!isConf && !isProject"
          >
            <!-- {{ data }} -->
            <span class="tit">{{ $t('task.PRIOR.GRID.endDate') }}</span>
            <span
              class="info service-date"
              v-if="data.serviceDate"
            >({{ data.serviceDate | date('YYYY.MM.DD') }})</span>
            <span class="info">{{ data.processDate | date('YYYY.MM.DD', true) }}</span>
            <span
              :class="[
                'info', 'state-info',
                !isConf ? `is-${status[data.state].color}`: '']"
            >
              {{ data.taskStatus }}
            </span>
          </li>
          <!-- 완료 희망일 (할 일, 한 일 && 프로젝트 자원이 아닐 때) -->

          <li
            class="panel-detail-item"
            v-else-if="(isConf && !isProject) ||
              (!isConf && isProject)"
          >
            <span class="tit">{{ $t('task.PRIOR.process') }}</span>
            <span class="info" />
            <span :class="['info', 'state-info', `is-${status[data.state].color}`]">
              {{ data.taskStatus }}
            </span>
          </li>
          <!-- 처리 상태 (사전 협의 && 프로젝트 자원이 아닐 때 || 할 일 && 프로젝트 자원일 때) -->
        </ul>

        <section
          v-if="!isProject"
          :class="['panel-more', { '-svc' : data.serviceDate }]"
        >
          <div
            v-if="!isConf"
            class="progress-step"
          >
            <span
              v-for="(step, idx) in data.progressStep"
              :key="`${step.orderNo}_${idx}`"
              :class="['processed', { '-active': step.proceedStatus === 'DONE' }]"
            />
          </div>

          <div
            v-else-if="isConf && !isProject"
            :class="['progress-step', { '-en': lang === 'en' }]"
          >
            <span v-if="hideCountByLength( data.type, 'new', data.orderLists)">
              {{ $t('common.TERMS.new') }} <span class="-cnt">{{ data.orderLists.new.done }} / {{ data.orderLists.new.total }}</span>
            </span>
            <span v-if="hideCountByLength( data.type,'change', data.orderLists)">
              {{ $t('common.TERMS.change') }} <span class="-cnt">{{ data.orderLists.change.done }} / {{ data.orderLists.change.total }}</span>
            </span>
            <span v-if="hideCountByLength( data.type, 'del', data.orderLists)">
              {{ $t('common.TERMS.delete') }} <span class="-cnt">{{ data.orderLists.del.done }} / {{ data.orderLists.del.total }}</span>
            </span>
          </div>
          <!-- 신규, 변경, 삭제 (사전 협의 && project 자원이 아닐 때) -->

          <a
            v-if="!isConf && !isProject"
            class="view-history"
          >
            <span v-if="data.orderType==='NEW'">{{ $t('common.TERMS.new') }}</span>
            <span v-else-if="data.orderType==='CHANGE'">{{ $t('common.TERMS.change') }}</span>
            <span v-else-if="data.orderType==='DELETE'">{{ $t('common.TERMS.delete') }}</span>
            <span class="box-icon" />
            <span class="history-cnt">{{ data.sourceLength }}</span>
          </a>
          <!-- 박스 아이콘 (할 일, 한 일) -->
        </section>

        <a
          v-if="data.cloudType === 'PUBLIC' && data.workType === 'AWS_PROJECT'"
          class="create-project-link"
        >Public Cloud 프로젝트 {{ type[data.orderType] }} 신청 ></a>
      </article>
    </div>
  </section>
</template>
<script>
import { mapState } from 'vuex'
import TaskDetailCommon from '@/views/Task/Nutanix/TaskDetailCommon'
export default {
  name: 'TicketPanel',
  props: {
    data: {
      type: Object,
      default: () => {}
    },
    isConf: {
      type: Boolean,
      default: false
    },
    process: {
      type: Boolean,
      default: true
    },
    isProject: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    ...mapState({
      cloudType: state => state.cloud.cloudType
    }),
    isAws () {
      const { type, cloudType } = this.data
      if (type === 'PROJECT' && cloudType === 'PUBLIC') return true
      return false
    },
    isNewAwsProject () {
      const { type, cloudType, orderType } = this.data
      if (type === 'PROJECT' && cloudType === 'PUBLIC' && orderType === 'NEW') return true
      return false
    },
    isDeleteAwsProject () {
      // 모듈 추가 예정
      const { type, cloudType, orderType } = this.data
      if (type === 'PROJECT' && cloudType === 'PUBLIC' && orderType === 'DELETE') return true
      return false
    },
    isAwsResource () {
      const { type, cloudType } = this.data
      if (cloudType === 'PUBLIC' && type === 'USER') return true
      return false
    },
    isCommonProject () {
      const { type, cloudType } = this.data
      const prev = type === 'PROJECT' && cloudType === 'PRIVATE' // 사전협의 속성
      const done = type === 'COMMON_PROJECT' // 한일 속성
      if (prev || done) return true
      return false
    }
  },
  mixins: [TaskDetailCommon],
  methods: {
    hideCountByLength (type, orderType, orderLists) {
      // 자원인 경우 항상 노출
      if (type !== 'PROJECT') return true
      const found = orderLists[orderType]
      if (found.total > 0) return true
      return false
    },
    projectInfo (projects) {
      if (!Array.isArray(projects)) return
      let projectLists = ''
      projects.forEach(item => {
        projectLists += item.label + '<br>'
      })
      return projectLists
    }
  },
  data () {
    return {
      setStatus: undefined,
      type: {
        NEW: '생성',
        DELETE: '삭제'
      },
      lang: this.$i18n.locale
    }
  }
}
</script>
<style lang="scss" scoped>
  .ticket-panel {
    box-sizing: border-box;
    position: relative;
    height: 100%;
    transition: .3s ease;

    .panel-main {
      padding: $gap $gap 0;
    }

    .contents-wrap {
      > .panel-title {
        white-space: nowrap;
        text-overflow: ellipsis;
        overflow: hidden;
        color: #999;
        font-weight: normal;
        // margin: 40px 0 $gap-m 0;
      }

      > .admin-info {
        margin-top: 5px;
        font-weight: normal;
        font-size: 12px;
        color: $color-ticket-cont;
      }

      .panel-detail-list {
        display: flex;
        flex-wrap: wrap;
        // margin-top: 15px;
        .panel-detail-item {
          &:first-child {
            flex: 0 0 100%;
            margin-bottom: 15px;
          }
          flex: 0 0 50%;
          margin-top: 15px;
          line-height: 14px;
          > span {display: inline-block;}

          > .tit {
            font-size: 12px;
            color: $input-placeholder;
            line-height: 20px;
            padding: 0 5px;
            background-color: $dark-slate;
            border-radius: $radius-s;
            margin-bottom: $gap-s;

            transition: all .5s ease;
          }

          > .info {
            display: block;
            font-family: 'Roboto';
            color: $color-ticket-cont;
            line-height: 16px;
            background-color: transparent;
            &.-project {
              height:20px;
              // display: flex;
              // align-items: center;
              .-name {
                display: inline-block;
                text-overflow: ellipsis;
                white-space: nowrap;
                overflow: hidden;
                max-width: 160px;
              }
              .-other {
                display: block;
                margin-left: 5px;
              }
            }
            &.state-info {margin: 0;}
            &.is-delay { color: $danger; }
            &.is-wait { color: $alert; }
            &.is-complete { color: $info; }
            &.is-ing { color: $success; }
          }

          .service-date {
            color: $main-blue;
            + .info {
              margin: 0;
            }
          }
        }
      }

      .panel-more {
        display: flex;
        justify-content: space-between;
        align-items: center;
        color: #666;
        margin-top: 15px;
        // border: 1px solid palegoldenrod;

        &.-svc {
          margin: 0;
        }

        > .progress-step {
          display: flex;
          .processed {
            width: 17px;
            height: 5px;
            opacity: .15;
            background-color: $general;
            border-radius: $radius-s;

            & + .processed {margin-left: 2px;}

            &.-active {
              opacity: 1;
            }
          }
          .-cnt {
            width: 30px;
            height: 13px;
            color: $blue-gray;
            margin-right: $gap-s;
            margin-left: 3px;
            line-height: 15px;
            font-size: 12px;
            text-align: center;
          }

          &.-en {
            font-size: 10px;
            .-cnt { font-size: 10px; }
          }
        }

        > .view-history {
          display: flex;
          align-items: flex-end;
          font-size: 11px;
          color: $input-placeholder;
          position: relative;
          padding-right: 9px;
          > .box-icon {
            display: inline-block;
            margin-left: 5px;
            width: 17px;
            height: 17px;
            background-position: center;
            background-size: contain;
            background-repeat: no-repeat;
            background-image: url('../../assets/images/box_ico.png');
            transition: all .5s ease;
            -webkit-filter: invert(100%);
            filter: invert(100%);
          }
          > .history-cnt {
            position: absolute;
            top: -9px;
            right: 0px;
            width: 18px;
            height: 18px;
            border-radius: 50%;
            background-color: $main-red;
            color: $white;
            font-size: 12px;
            text-align: center;
            line-height: 18px;
          }
        }

      }
      .create-project-link {
        display: block;
        margin-top: $gap-s;
        color: $purple;
      }

    }

  }

  .icon-aws {
    display: inline-block;
    width: 20px;
    height:15px;
    margin-right:10px;
    background: url('../../assets/images/clouds/aws-white.png') no-repeat center center;
  }
</style>
