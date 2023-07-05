<template>
  <div
    v-loading="delayLoading"
    class="ec2-list"
  >
    <div class="ec2-list-filter">
      <filtering-component
        :data="filtering"
        @reset-data="resetFilter"
        @selected="selectFilter"
        class="ec2-list-filter__wrapper"
        ref="listFilter"
      >
        <div class="options">
          <el-input
            v-model="filterName"
            placeholder="인스턴스 이름 검색"
            @input="onChangeFilterName"
          />
          <search-icon
            :width="24"
            :height="24"
            is-button
            icon-color="#666"
          />
          <i
            class="mdi mdi-refresh refresh-icon"
            @click="onParentResetFilter"
          />
          <button
            class="button"
            type="is-primary"
            @click="onClickModalActive"
            v-loading="isLoadingGetVpc"
            :disabled="isLoadingGetVpc"
          >
            EC2 신청
          </button>
        </div>
      </filtering-component>
    </div>
    <cmp-grid
      :item-source="ec2Data"
      :columns="columns"
      :empty-text="
        isSetFilter
          ? '일치하는 인스턴스가 없습니다. 다시 검색해주세요.'
          : '생성된 인스턴스가 없습니다.'
      "
      header-margin
      full-border
      routable="ec2-detail"
      server-side-paging
      :server-side-now-page="currPage"
      :total-page-size="totalItems"
      :init-custom-action="onGridInit"
      @changing-page="onChangePage"
      class="ec2-grid"
    >
      <template #state="{ row }">
        <new-status-tag :tag-type="convertTagType(row.state)[0]">
          {{ convertTagType(row.state)[1] }}
        </new-status-tag>
      </template>
      <template #memory="{ row }">
        {{ row.memory | convertMemory }}
      </template>
      <template #storage="{ row }">
        {{ row.sgCount | storageCount }}
      </template>
      <template #monitoringState="{ row }">
        {{ row.monitoringState ? '활성' : '비활성' }}
      </template>
      <template #environment="{ row }">
        {{ row.environment | caseOfVPC }}
      </template>
      <template #isPublic="{ row }">
        {{ parseInt(row.isPublic) ? '외부' : '내부' }}
      </template>
      <template #modifyDate="{ row }">
        {{ row.modifyDate | date('YYYY.MM.DD HH:mm:ss') }}
      </template>
    </cmp-grid>
    <EC2ResCreate
      res-type="ec2"
      :active.sync="createModalActive"
      @close="createModalActive = false"
    />
  </div>
</template>

<script>
/**
 * 자원관리 > EC2 화면의 EC2 리스트를 구성하는 컴포넌트
 * {@link https://www.figma.com/file/pa5IgOdP0v8gmTC3exxxpn/CMP-2%EB%8B%A8%EA%B3%84_share?node-id=4319%3A21086}
 *
 */
import columns from './EC2ResColumn'
import SearchIcon from '@/components/Icons/SearchIcon.vue'
import EC2ResCreate from './EC2ResCreate.vue'
import { getEC2, getSubnet } from '@/components/Apis/AWS'
import { debounce } from 'lodash'
import { mapGetters } from 'vuex'

export default {
  name: 'EC2ResList',
  components: {
    SearchIcon,
    EC2ResCreate
  },
  computed: {
    ...mapGetters({
      packageType: 'common/packageType',
      projectInfo: 'project/getSelectedProject'
    })
  },
  filters: {
    convertMemory (memory) {
      return parseInt(memory / 1024)
    },
    storageCount (count) {
      return '루트 외 ' + (count - 1)
    },
    caseOfVPC (vpc) {
      switch (vpc) {
        case 'STG':
          return '스테이징'
        case 'PRD':
          return '운영'
        case 'DEV':
          return '개발'
        default:
          return ''
      }
    }
  },
  watch: {
    /**
     * 페이지 query 바뀔 때마다 데이터 조회
     * 현재 페이지네이션 값 세팅
     */
    '$route.query.p' (page) {
      this.currPage = page
      this.initEC2Res()
    },
    isLoadingEC2 (loading) {
      if (!loading) {
        setTimeout(() => {
          this.delayLoading = false
        }, 350)
      } else {
        this.delayLoading = true
      }
    }
  },
  created () {
    if (this.packageType !== 'ENT') {
      return this.$router.push({ name: 'dashboard' })
    }
    /**
     * 렌더링시 쿼리가 존재하는 경우
     * (리스트 페이지에 있다가, 다른 페이지 접근 후
     * 뒤로가기 등으로 다시 리스트 페이지에 돌아온 경우)
     * 현재 페이지네이션 값을 쿼리 값으로 세팅
     */
    if (this.$route.query.p) {
      this.currPage = parseInt(this.$route.query.p)
      this.initPaginate(this.$route.query.p)
    } else {
      this.initPaginate(1, true, parseInt(this.$route.query.p) !== 1)
    }
  },
  methods: {
    /**
     * EC2 신청 버튼 클릭시 신청할 수 있는 VPC 확인
     */
    async onClickModalActive () {
      if (this.isLoadingGetVpc) return

      try {
        this.isLoadingGetVpc = true

        const { data } = await getSubnet({
          projectIdx: this.projectInfo.project.projectIdx
        })

        // VPC에 할당 가능한 IP Address 개수 조회
        const addressCount = data.reduce((cur, next) => cur + next.availableIpAddressCount, 0)

        // VPC 데이터가 없거나 할당 가능한 주소가 없으면 신청 불가
        if (!data || !data.length || !addressCount) {
          return this.$alert('신청이 불가합니다.<br>자세한 내용은 관리자 문의나 1:1 문의를<br>이용해주세요.', { dangerouslyUseHTMLString: true })
        }
        this.createModalActive = true
      } catch (error) {
        console.log(error)
      } finally {
        this.isLoadingGetVpc = false
      }
    },
    onParentResetFilter () {
      if (this.$refs.listFilter) {
        this.$refs.listFilter.resetData()
      }
    },
    onChangeFilterName: debounce(async function (value) {
      if (value) this.isSetFilter = true
      this.$set(this.selectedFilter, 'instanceName', value || null)
      await this.initPaginate(1, true, parseInt(this.$route.query.p) !== 1)
      if (!value) this.isSetFilter = false
    }, 500),
    onGridInit (grid) {
      // grid.rows.forEach(row => (row.size = 67))
    },
    /**
     * 그리드 페이지 변경시 EC2 자원 조회
     * 페이지네이션 값 세팅
     */
    onChangePage (page) {
      this.currPage = page
      this.initEC2Res()
      this.initPaginate()
    },
    /**
     * 페이지네이션 값 초기화
     */
    async initPaginate (page = this.currPage, replace = false, go = true) {
      if (go) {
        if (replace) {
          this.$router.replace({
            name: 'ec2-list',
            query: {
              p: page
            }
          })
        } else {
          this.$router.push({
            name: 'ec2-list',
            query: {
              p: page
            }
          })
        }
      }
      await this.initEC2Res()
    },
    /**
     * 페이지네이션 데이터, 필터링 데이터로 EC2 조회
     */
    async initEC2Res (withFilter = false) {
      try {
        this.isLoadingEC2 = true
        this.ec2Data = []

        const { data } = await getEC2({
          ...this.selectedFilter
        })
        this.totalItems = data.total
        this.ec2Data = data.map(ec2 => ({ ...ec2, id: ec2.instanceId }))
      } catch (error) {
        console.log(error)
        this.$alert('EC2 자원 조회에 실패하였습니다.')
      } finally {
        this.isLoadingEC2 = false
      }
    },
    resetFilter () {
      this.isSetFilter = false
      this.filterName = ''
      this.selectedFilter = {}
      this.initPaginate(1, true, parseInt(this.$route.query.p) !== 1)
    },
    selectFilter (selected) {
      this.isSetFilter = !!(Object.keys(selected).length || this.filterName) // 필터 세팅됬는지

      if (this.isSetFilter) {
        this.selectedFilter = selected
        this.initPaginate(1, true, parseInt(this.$route.query.p) !== 1)
      }
    },
    /**
     * state 값을 new-status-tag 컴포넌트가 받는 데이터로 변환
     */
    convertTagType (state) {
      switch (state) {
        case 'pending':
          return ['progress', '진행 중']
        case 'stopped':
          return ['stop', '정지']
        case 'running':
          return ['running', '실행 중']
        case 'stopping':
          return ['progress', '종료 중']
        default:
          return ['running', '실행중']
      }
    }
  },
  data: () => ({
    isLoadingGetVpc: false,
    columns: columns(),
    createModalActive: false,
    ec2Data: [],
    isSetFilter: false,
    filterName: '',
    currPage: 1,
    totalItems: 0,
    perPage: 10,
    isLoadingEC2: true,
    delayLoading: true,
    selectedFilter: {},
    filtering: [
      {
        field: 'state',
        label: '상태',
        placeholder: '상태 전체',
        selections: [
          { label: '전체', value: undefined },
          { label: '실행 중', value: 'running' },
          { label: '진행 중', value: 'pending' },
          { label: '종료 중', value: 'stopping' },
          // { label: '대기', value: 4 },
          { label: '정지', value: 'stopped' }
          // { label: '오류', value: 6 },
          // { label: '삭제', value: 7 }
        ]
      },
      {
        field: 'monitoringState',
        label: '세부 모니터링',
        placeholder: '모니터링 전체',
        selections: [
          { label: '전체', value: undefined },
          { label: '활성', value: 1 },
          { label: '비활성', value: 0 }
        ]
      },
      {
        field: 'vpcEnvironment',
        label: 'VPC',
        placeholder: 'VPC 전체',
        selections: [
          { label: '전체', value: undefined },
          { label: '운영', value: 'PRD' },
          { label: '개발', value: 'DEV' },
          { label: '스테이징', value: 'STG' }
        ]
      },
      {
        field: 'subnetIsPublic',
        label: '서브넷',
        placeholder: '서브넷 전체',
        selections: [
          { label: '전체', value: undefined },
          { label: '내부', value: 0 },
          { label: '외부', value: 1 }
        ]
      }
    ]
  })
}
</script>

<style lang="scss" scoped>
.ec2-list {
  min-height: 800px;

  &-filter {
    display: flex;
    justify-content: space-between;
    flex-wrap: nowrap;

    &__wrapper {
      margin-bottom: $gap-m;
      width: 100%;

      $select-width: 160px;

      &::v-deep {
        .filter-options {
          width: $select-width !important;
        }

        .el-select {
          width: $select-width !important;

          &::v-deep {
            .el-input__inner {
              width: $select-width !important;
            }
          }
        }
      }

      .options {
        display: flex;
        align-items: center;
        margin-left: auto;

        &::v-deep {
          .el-input .el-input__inner {
            width: 185px;
            border-bottom: 1px solid $input-stroke;
          }
        }

        .refresh-icon {
          color: #666;
          cursor: pointer;
          transform: rotate(270deg);
          transition: transform 300ms ease;
          margin: 0 5px;

          &:hover {
            transform: rotate(0deg);
          }
        }

        .button {
          min-width: auto;
          margin-left: $gap-s;
        }
      }
    }
  }

  .ec2-grid {
    /* min-height: 400px; */

    &::v-deep {
      .wj-cell:not(.wj-header) {
        padding: 0;
      }
    }
  }
}
</style>
