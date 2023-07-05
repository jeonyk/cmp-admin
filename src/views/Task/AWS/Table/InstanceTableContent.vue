<!--
  * 파일명 : ConfDetailApply.vue
  * 파일 기능 : [주문 정보]를 테이블 형태로 보여줍니다.
  * 작성자 : 김예담 외 2명
  * 최종 작성일 : 2020-12-18
  * License By Shinsegae I&C
  * 2020-12-18 fix: 사전협의 상세 css 수정
 -->

<template>
  <article class="instance-table">
    <div class="instance-table-buttons">
      <!-- data.status !== 'DONE' -->
      <!-- <template v-if="mode === 'CONF' && hideButtons(data.status)"> -->
      <!-- <button
        class="button"
        style="margin-right: 10px"
        type="is-primary"
        @click="update"
      >
        변경
      </button> -->
      <!-- </template> -->
      <template
        v-if="
          type === 'EC2' &&
            data.workResult.dataStatus === 'ERROR' &&
            mode === 'TODO'
        "
      >
        <button
          class="button"
          style="margin-right: 10px"
          type="is-primary"
        >
          변경
        </button>
        <button
          class="button"
          type="is-primary"
          @click="runTask"
        >
          작업실행
        </button>
      </template>
    </div>

    <template v-if="type === 'EC2' && mode !== 'CONF'">
      <register-contents
        title="작업 상태"
        style="border-top: 1px solid #2a2d44"
      >
        <span
          class="display:inline-block;"
          v-if="mode !== 'CONF'"
        >
          <el-tag v-if="!data.workResult.dataStatus && data.meta.cancelDate">
            cancelDate
          </el-tag>
          <cmp-status-tag
            v-if="data.workResult.dataStatus === 'WAIT'"
            type="is-wait"
            style="margin-right: 10px"
            :contents="$t('task.TODO.waitWork')"
          />

          <el-tag
            v-if="!data.workResult.dataStatus"
            class="waiting"
          >
            대기
          </el-tag>
          <button
            v-if="!data.workResult.dataStatus"
            class="button"
            type="is-primary"
            @click="runTask"
          >
            작업실행
          </button>

          <el-tag
            v-if="data.workResult.dataStatus === 'PROCEED'"
            class="loading"
          >
            <i
              class="el-icon-loading"
              style="margin-right: 5px"
            />
            {{ $t("task.TODO.working") }}
          </el-tag>
          <el-tag
            v-if="data.workResult.dataStatus === 'DONE'"
            class="new"
          >
            <i class="el-icon-check" />
            성공
          </el-tag>

          <cmp-status-tag
            v-if="!data.workResult.dataStatus && data.meta.deleteDate && !data.meta.cancelDate"
            type="is-wait"
            :contents="$t('task.TODO.beDeleted')"
            :tooltip="true"
            :tooltip-cont="data.meta.deleteData"
            tooltip-position="bottom"
          />

          <!-- <cmp-status-tag
            v-if="!data.workResult.dataStatus && data.meta.cancelDate"
            type="is-removed"
            :contents="$t('task.TODO.unDelete')"
            :tooltip="true"
            :tooltip-cont="data.meta.cancelDate | '123'"
            tooltip-position="bottom"
          /> -->
          <cmp-status-tag
            v-if="data.workResult.dataStatus === 'ERROR'"
            type="is-fail"
            :contents="$t('common.fail')"
            :tooltip="true"
            :tooltip-cont="data.workResult.data"
            tooltip-position="bottom"
          />

          <!-- <el-tag
            v-if="data.workResult.dataStatus === 'ERROR'"
            class="failure"
          >
            <i class="el-icon-close" />
            실패
          </el-tag> -->
          <button
            v-if="data.workResult.dataStatus === 'ERROR' && !mode === 'DONE'"
            class="button"
            type="is-primary"
            @click="updateStatusToDone"
          >
            성공처리
          </button>
        </span>
      </register-contents>
    </template>
    <div class="instance-list">
      <register-contents
        :title="$t(item.keyPath) || item.label"
        v-for="item in convertedList"
        :key="item.field"
        :class="'instance-content' + ' ' + item.field"
      >
        <el-tag
          class="new"
          v-if="item.field === 'instanceName'"
        >
          신규
        </el-tag>
        <span>{{ data[item.field] }}</span>

        <template v-if="mode === 'CONF' && item.field === 'amiId'">
          <template v-if="data.status === 'SUCCESS'">
            <el-tag
              class="new"
              style="margin-left: 10px"
            >
              <i class="el-icon-check" />
              성공
            </el-tag>
          </template>
          <span v-if="data.status === 'PROCEED'">
            <el-tag
              class="loading"
              style="margin-left: 10px; margin-right: 0px"
            >
              <i
                class="el-icon-loading"
                style="margin-right: 5px"
              />
              진행 중
            </el-tag>
            <el-tag
              @click="cancelSimulation"
              class="cancel"
            >
              <i
                style="font-size: 16px; font-weight: bold; margin-right: 5px"
                class="el-icon-close"
              />
              취소</el-tag>
          </span>
          <span v-if="data.status === 'FAILURE'">
            <el-tag
              class="failure"
              style="margin-left: 10px; margin-right: 10px"
            >
              <i
                class="el-icon-close"
                style="margin-right: 3px; font-size: 16px"
              />
              실패
            </el-tag>
            <el-tag
              class="cancel"
              style="padding: 0px"
              @click="rollbackToPreviousData"
            >
              <i
                class="el-icon-refresh-right"
                style="margin-right: 10px"
              />되돌리기</el-tag>
          </span>
        </template>
      </register-contents>
    </div>

    <!-- 로딩일 경우 보이지 않음  -->
    <div class="button-area">
      <!-- v-if="readyToGoDone(mode, data.workResult.dataStatus,data)" -->
      <button
        v-if="mode === 'TODO'"
        class="button"
        type="is-primary"
        @click="completeTask"
      >
        작업완료
      </button>
    </div>
  </article>
</template>

<script>
export default {
  name: 'InstanceTable',
  props: {
    type: {
      type: String,
      default: 'EC2'
    },
    mode: {
      type: String,
      default: 'CONF'
    },
    data: {
      type: Object,
      default: () => {
        return {
          region: 'region!@#asdasd'
        }
      }
    },
    // Instance-Table에 작업 상태를 표시;
    status: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    convertedList () {
      if (this.type === 'EC2') return this.applyTitleList
      else return this.efsTitleList
    }
  },
  methods: {
    updateStatusToDone () {
      this.$emit('updateDone')
    },
    // hideButtons (status) {
    //   if (this.orderDisableCases.includes(status)) return false
    //   return true
    // },
    readyToGoDone (mode, status, data) {
      const hasStauts = ['ERROR', 'DONE'].includes(status)
      if (mode === 'TODO' && hasStauts) return true
      return false
    },
    // update () {
    //   this.$emit('update')
    // },
    completeTask () {
      this.$emit('complete')
    },
    runTask () {
      this.$emit('excute')
    },
    rollbackToPreviousData () {
      this.$alert('rollbackToPreviousData')
    },
    cancelSimulation () {
      this.data.status = 'HOLD'
      alert('cancel simulation')
    }
  },
  data () {
    return {
      orderDisableCases: ['REJECT', 'DONE'],
      applyTitleList: [
        { field: 'instanceName', label: '인스턴스명', keyPath: '인스턴스명' },
        {
          field: 'networkPerformance',
          label: '네트워크 성능',
          keyPath: '네트워크 성능'
        },
        { field: 'availableRegion', label: '가용 영역', keyPath: '가용 영역' },
        { field: 'region', label: '리전', keyPath: '리전' },
        { field: 'amiId', label: 'AMI ID', keyPath: 'AMI ID' },
        {
          field: 'architecture',
          label: 'Architecture',
          keyPath: 'Architecture'
        },
        {
          field: 'instanceType',
          label: '인스턴스 유형',
          keyPath: '인스턴스 유형'
        },
        { field: 'vCpu', label: 'vCPU', keyPath: 'vCPU' },
        { field: 'memory', label: '메모리', keyPath: '메모리' },
        { field: 'disk', label: '디스크', keyPath: '디스크' }
      ],
      // efsTitleList: [
      //   { field: 'efsId', label: 'EFS ID' },
      //   { field: 'efsName', label: 'EFS 이름' },
      //   { field: 'appliedArea', label: '적용범위' },
      //   { field: 'connectedVpcId', label: '연결된 VPC ID' },
      //   { field: 'selectedAvailabilityZone', label: '선택된 가용 영역' },
      //   { field: 'performanceMode', label: '성능 모드' },
      //   { field: 'throughputMode', label: '처리량 모드' },
      //   { field: 'detailMonitoring', label: '세부 모니터링' },
      //   { field: 'totalUsageAmount', label: '전체 사용량' },
      //   { field: 'mainUsageAmount', label: '주 사용 용량' },
      //   { field: 'iaAmout', label: 'IA 용량' },
      //   { field: 'transitionIntoIA', label: 'IA로 전환' },
      //   { field: 'transitionOutofIA', label: 'IA외부로 전환' },
      //   { field: 'accessPointCount', label: '엑세스 포인트 수' },
      //   { field: 'projectLocation', label: '프로젝트 위치' },
      //   { field: 'status', label: '상태' },
      //   { field: 'appBusinessTeam', label: 'App 업무팀' },
      //   { field: 'appBusinessPersonInCharge', label: 'App 업무 담당자' },
      //   { field: 'createdTime', label: '생성시간' },
      //   { field: 'modifiedTime', label: '마지막 변경 시간' }
      // ],
      efsTitleList: [
        { field: 'fileSystemId', label: 'EFS ID' }, //
        { field: 'fileSystemName', label: 'EFS 이름' }, //
        { field: 'isRegion', label: '적용 범위' }, //
        { field: 'vpcId', label: '연결된 VPC ID' }, //
        { field: 'regionName', label: '선택된 가용영역' }, //
        { field: 'performanceMode', label: '성능 모드' }, //
        { field: 'throughputMode', label: '처리량 모드' }, //
        { field: 'activeMonitoring', label: '세부 모니터링' },
        { field: 'size', label: '전체 사용량' }, //
        { field: 'sizeStandard', label: '주 사용 용량' }, //
        { field: 'sizeIa', label: 'IA 용량' }, //
        { field: 'transitionToIa', label: 'IA로 전환' },
        { field: 'transitionToPrimaryStorageClass', label: 'IA 외부로의 전환' },
        { field: 'accessPointCnt', label: '엑세스 포인트 수' },
        { field: 'projectIdx', label: '프로젝트 위치' },
        { field: 'lifeCycleState', label: '상태' }, //
        { field: 'appManageTeamName', label: 'App 운영팀', keyPath: 'common.GRID.NETWORK.appTeam' },
        { field: 'appTaskUser', label: 'APP 업무담당자', keyPath: 'common.REGCON.appManager' },
        { field: 'createDate', label: '생성 시간' },
        { field: 'modifyDate', label: '마지막 변경 시간' }
      ]
      // setStatus: {
      //   REQUEST: '결재 요청',
      //   WAIT: '대기',
      //   PROCEED: '처리중',
      //   DELAY: '지연',
      //   DONE: '완료',
      //   REJECT: '반려',
      //   undefined: '미정'
      // }
    }
  }
}
</script>
<style lang="scss" scoped>
.button-area {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 30px 0px;
}

.new {
  color: #5d5fef;
  border: 1px solid #5d5fef;
  background: rgba(93, 95, 239, 0.2);
  font-weight: 700;
}

.waiting {
  color: #727797;
  border: 1px solid #727797;
}

.loading {
  color: #f4a462;
  border: 1px solid #f4a462;
  background: rgba(244, 164, 98, 0.2);
  font-weight: 700;
}
.cancel {
  background: transparent;
  color: #999999;
}

.failure {
  color: #fa5657;
  border: 1px solid #fa5657;
  background: rgba(250, 86, 87, 0.2);
  font-weight: 700;
  padding: 0px;
  padding-right: 10px;
}

.instance-table {
  position: relative;
  .instance-table-buttons {
    position: absolute;
    top: -50px;
    right: 0px;
  }
  .header {
    display: flex;
    justify-content: space-between;
    .instance-tags {
      width: 80%;
      // margin:20px 0px;
    }
    .button-wrapper {
      display: flex;
      align-items: top;
      margin-top: 20px;
    }
  }

  .instance-list {
    display: flex;
    flex-wrap: wrap;
    .instance-content {
      width: 50% !important;
      box-sizing: border-box;
      &.attachment {
        .attachment-name {
          margin-left: $gap-s;
        }
      }
    }
  }
}
</style>
