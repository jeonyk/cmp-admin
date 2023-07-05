<template>
  <div
    v-loading="isLoadingCheckInstanceType || isLoadingCheckInstanceName"
    class="instance-info"
  >
    <div class="instance-info-head">
      <h1>인스턴스 기본 정보</h1>
    </div>
    <div
      v-show="!shared.isEdit"
      class="instance-info-base"
    >
      <div class="instance-info-base__item">
        <h2>Region</h2>
        <el-input
          disabled
          class="instance-info-base__item-region"
          :value="shared.basketData.orderData.region"
        />
      </div>
      <div class="instance-info-base__item">
        <h2 class="required">
          인스턴스 이름
        </h2>
        <div class="instance-info-base__item-name">
          <el-input
            class="instance-info-base__item-region"
            :value="instanceName"
            :maxlength="25"
            :minlength="0"
            show-word-limit
            :disabled="isLoadingCheckInstanceName"
            @input="
              e => {
                validateInstanceName(e)
                $emit('update:instance-name', e);
              }
            "
          />
          <!-- @blur="validateInstanceName" -->
          <!-- validateInstanceName(e); -->
          <div
            v-if="isErrorInstanceName"
            class="error"
          >
            이미 존재하는 인스턴스 이름입니다.
          </div>
        </div>
      </div>
    </div>
    <div
      v-show="!shared.isEdit"
      class="instance-ami-head"
    >
      <h1 class="required">
        AMI 선택
      </h1>
      <div
        v-loading="loadingAmiList"
        class="instance-ami-head__filter"
      >
        <div class="instance-ami-head__filter-name">
          <el-input
            v-model="amiFilter.name"
            placeholder="AMI 이름 검색"
            @input="onChangeAmiFilterName"
          />
          <search-icon
            :width="20"
            :height="20"
          />
          <refresh-icon
            is-button
            :width="20"
            :height="20"
            @click="onResetAmiFilter"
          />
        </div>
        <div
          v-if="false"
          class="instance-ami-head__filter-os"
        >
          <span>운영 체제</span>
          <el-select v-model="amiFilter.selectedOS">
            <el-option
              v-for="option in testOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </div>
      </div>
    </div>
    <div
      v-show="!shared.isEdit"
      class="instance-ami-list"
    >
      <ami-box
        v-if="amiList.length"
        v-loading="loadingAmiList"
        :ami-data="amiList"
        :selected-spec="isSelectedSpec"
        :selected-ami="selectedAmi"
        @select-ami="onSelectAmi"
      />
      <div
        v-else
        class="empty-data"
      >
        {{ $t('common.PLACEHOLDER.noData') }}
      </div>
    </div>
    <div
      v-show="!shared.isEdit"
      class="instance-spec"
    >
      <div class="instance-spec-head">
        <h1 class="required">
          인스턴스 사양 선택
        </h1>
        <div
          v-if="isSelectedAMI"
          class="instance-spec-head__filter"
        >
          <div class="instance-spec-head__filter-spec">
            <el-select
              v-model="specFilter.specSelect"
              class="small"
              @input="onChangeSpecFilterOption"
            >
              <el-option
                v-for="option in specOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
          </div>
          <div class="instance-spec-head__filter-name">
            <el-input
              v-model="specFilter.keyword"
              type="text"
              placeholder="검색어 입력"
              @input="onChangeSpecSelect"
            />
            <search-icon
              :width="20"
              :height="20"
            />
            <refresh-icon
              is-button
              :width="20"
              :height="20"
              @click="onResetSpecFilter"
            />
          </div>
        </div>
      </div>
      <div class="instance-spec-body">
        <instance-spec-list
          :ami-selected="isSelectedAMI"
          :filter-option="specFilter"
          @selected-spec="onSelectSpec"
          ref="specRef"
        />
      </div>
    </div>
    <!-- 신청 시 렌더링 영역 (상단) -->
    <instance-edit-info v-if="shared.isEdit" />
    <!-- 수정 시 렌더링 영역 (상단) -->
    <div class="instance-storage">
      <div class="instance-storage-head">
        <h1>스토리지 선택</h1>
        <div
          v-if="shared.isEdit"
          class="instance-storage-edit"
        >
          <div class="edit-item">
            <div class="box default" />
            <div class="title">
              기존 볼륨
            </div>
          </div>
          <div class="edit-item">
            <div class="box new" />
            <div class="title">
              신규 볼륨
            </div>
          </div>
        </div>
      </div>
      <div class="instance-storage-body">
        <instance-storage-list
          :instance-info-changes="instanceInfoChanges"
          :ami-selected="isSelectedAMI"
          :ami="selectedAmi"
          ref="storageRef"
          @sync-storage="syncStorage"
          @change-storage="change => $emit('change-storage', change)"
          @edit-origin-data="onEditOriginData"
        />
      </div>
    </div>
    <div class="instance-monitoring">
      <h1>세부 모니터링</h1>
      <instance-monitoring
        ref="monitorRef"
        :monitoring-activated.sync="activeMonitor"
        @monitor-change="change => $emit('monitor-change', change)"
      />
    </div>
    <section class="modal-button-area">
      <button
        class="button"
        type="is-anti"
        @click="cancelInstanceInfo"
      >
        취소
      </button>
      <button
        class="button"
        type="is-primary"
        @click="moveNextStep"
      >
        다음 단계
      </button>
    </section>
  </div>
</template>

<script>
/**
 * 인스턴스 기본 정보 폼
 */
import { debounce } from 'lodash'
import SearchIcon from '@/components/Icons/SearchIcon.vue'
import RefreshIcon from '@/components/Icons/RefreshIcon.vue'
import AMIBox from './AMIBox.vue'
import InstanceSpecList from './InstanceSpecList.vue'
import InstanceStorageList from './InstanceStorageList.vue'
import InstanceMonitoring from './InstanceMonitoring.vue'
import InstanceEditInfo from './Edit/InstanceEditInfo.vue'
import { checkUsableInstanceType, getAmiList, getEC2 } from '@/components/Apis/AWS'
// import { mapGetters } from 'vuex'

export default {
  name: 'InstanceInfo',
  components: {
    SearchIcon,
    RefreshIcon,
    'ami-box': AMIBox,
    InstanceSpecList,
    InstanceStorageList,
    InstanceMonitoring,
    InstanceEditInfo
  },
  inject: ['shared'],
  props: {
    instanceName: {
      type: String,
      default: ''
    },
    selectedAmi: {
      type: Object,
      default: null
    },
    selectedSpec: {
      type: Object,
      default: null
    },
    storage: {
      type: Array,
      default: () => []
    },
    monitor: {
      type: Boolean,
      default: false
    },
    instanceInfoChanges: {
      type: Array,
      default: () => []
    }
  },
  computed: {
    // ...mapGetters({
    //   projectInfo: 'project/getSelectedProject'
    // }),
    projectInfo () {
      return {
        project: {
          projectIdx: this.shared.basketData.orderData.projectIdx
        }
      }
    },
    isSelectedAMI () {
      return !!this.selectedAmi
    },
    isSelectedSpec () {
      return !!this.selectedSpec
    }
  },
  watch: {
    activeMonitor (bool) {
      this.$emit('update:monitor', bool)
    },
    'shared.active' (active) {
      if (active) {
        this.getAmiList()
        this.checkBasketEdit()
      } else {
        this.selectedSpec = null
        this.selectedAmi = null
        this.selectedOS = null
        this.amiFilter = {
          name: '',
          os: ''
        }
        this.onResetSpecFilter(false)
      }
    }
  },
  created () {
    if (this.shared.active) {
      if (this.shared.basketEdit) {
        this.checkBasketEdit()
      }

      this.getAmiList()
    }
  },
  methods: {
    onEditOriginData (origin) {
      this.originStorageData = origin
      this.$emit('origin-storage-data', origin)
    },
    checkBasketEdit () {
      if (this.shared.basketEdit) {
        this.$emit('update:instance-name', this.shared.basketData.orderData.instanceName)
        this.activeMonitor = this.shared.basketData.orderData.monitoringState
      }
    },
    onResetSpecFilter (getSpec = true) {
      this.specFilter.specSelect = 'name'
      this.specFilter.keyword = ''
      if (getSpec) this.$refs.specRef.getSpecs()
      else this.$refs.specRef.unActiveSpecs()
    },
    onChangeSpecSelect: debounce(function (value) {
      if (this.specFilter.specSelect) {
        this.$refs.currentPage = 1
        this.$refs.specRef.getSpecs()
      }
    }, 500),
    onChangeSpecFilterOption (filter) {
      this.specFilter.keyword = ''
      this.$refs.specRef.getSpecs()
    },
    onResetAmiFilter () {
      this.amiFilter.name = ''
      this.getAmiList()
    },
    onChangeAmiFilterName: debounce(function (name) {
      this.getAmiList(this.amiFilter.name)
    }, 500),
    /**
     * 장바구니에서 신청건 변경시
     */
    initSelectAmiBasket (amiList = this.amiList) {
      if (amiList && amiList.length) {
        const findAmi = amiList.find(ami => ami.imageId === this.shared.basketData.orderData.amazonImageDto.imageId)
        findAmi.selected = true
        if (findAmi) this.$emit('update:selectedAmi', findAmi)
      }
    },
    /**
     * 자원 수정 상태일 때 AMI 등록
     */
    initSelectAmi (isBasket = false) {
      // if (amiList && amiList.length) {
      //   const findAmi = amiList.find(ami => ami.imageId === this.shared.editData.orderData.amazonImageDto.imageId)
      //   this.$emit('update:selectedAmi', findAmi)
      // }
      const refKey = isBasket ? 'basketData' : 'editData'
      this.$emit('update:selectedAmi', this.shared[refKey].orderData.amazonImageDto)
    },
    /**
     * 포커스 아웃시 인스턴스 이름 중복 체크
     */
    onBlurInstanceName () {
      // TODO 인스턴스 이름 중복 체크
    },
    /**
     * AMI 리스트 조회
     */
    async getAmiList (filterName = undefined) {
      if (this.loadingAmiList) return

      if (this.shared.isEdit) {
        this.initSelectAmi(this.shared.basketEdit)
        return
      }

      try {
        this.loadingAmiList = true

        // 선택된 프로젝트의 리전 조회 필요
        const { data } = await getAmiList(this.shared.regionName, filterName)
        this.amiList = data

        // if (this.shared.isEdit && !this.shared.basketEdit) this.initSelectAmi()
        if (this.shared.basketEdit && !this.shared.isEdit) this.initSelectAmiBasket()
      } catch (error) {
        console.log(error)
        this.$alert('AMI 리스트 조회에 실패하였습니다.')
      } finally {
        this.loadingAmiList = false
      }
    },
    /**
     * 자식 컴포넌트의 값 동기화
     */
    syncStorage (storage) {
      // this.storage = storage
      this.$emit('update:storage', storage)
    },
    /**
     * 모달에서 취소 버튼 클릭시
     * - 생성 모드일 때와 수정 모드일 때에 분기 처리
     * - confirm 창으로 "신청을 취소하시겠습니까?" 문구 노출 후에 확인 버튼 클릭시에 모달 닫음
     */
    cancelInstanceInfo () {
      this.$confirm('수정을 취소하시겠습니까?')
        .then(() => {
          this.$emit('cancel-create')
        })
        .catch(() => false)
    },
    /**
     * 모달에서 다음 단계 버튼 클릭시
     * - 벨리데이션 필요
     */
    async moveNextStep () {
      const validated = await this.validationInstanceInfo()

      if (validated !== true) return

      this.$emit('move-to-next')
    },
    /**
     * 각 항목별 데이터 벨리데이션
     */
    async validationInstanceInfo () {
      // 인스턴스 이름 입력 여부를 체크한다.
      if (!this.instanceName) {
        return this.$alert('인스턴스 이름을 입력해주세요.')
      }

      // 인스턴스 이름에 특수문자 입력 등 정규식 처리를 한다.
      // 백엔드와 협의해서 인스턴스 이름에 들어가면 안되는 문자 등 정리 필요

      // 인스턴스 이름 중복 여부를 체크한다.
      if (this.isErrorInstanceName) {
        return this.$alert(
          '인스턴스 이름이 중복되었습니다.<br>다른 이름을 입력해주세요.',
          { dangerouslyUseHTMLString: true }
        )
      }

      // AMI 선택 여부를 체크한다.
      if (!this.isSelectedAMI) {
        return this.$alert('AMI를 선택해주세요.')
      }

      // 사양 선택 여부를 체크한다.
      if (!this.shared.isEdit && !this.selectedSpec) {
        return this.$alert('인스턴스 사양을 선택해주세요.')
      }

      // 스토리지 벨리데이션 여부를 체크하고 실패 메세지를 노출한다.
      const isStorageError = this.$refs.storageRef.validationStorage()

      if (isStorageError) {
        return this.$alert('스토리지를 확인해주세요.')
      }

      if (this.shared.isEdit) return true

      await this.checkDuplicateInstanceName(this.instanceName)

      if (this.isErrorInstanceName) {
        return this.$alert('인스턴스 이름을 확인해주세요.')
      }

      try {
        // AMI ID, Instance Type, projectIdx
        this.isLoadingCheckInstanceType = true

        await checkUsableInstanceType({
          amiId: this.selectedAmi.imageId,
          instanceType: this.selectedSpec.instanceType,
          projectIdx: this.projectInfo.project.projectIdx
        })
      } catch (error) {
        // console.log(error)
        return this.$alert('선택하신 AMI에서는 ' + this.selectedSpec.instanceType + ' 인스턴스 타입으로 신청이 불가능합니다.')
      } finally {
        this.isLoadingCheckInstanceType = false
      }

      return true
    },
    /**
     * 사양 선택시
     */
    onSelectSpec (spec) {
      // this.selectedSpec = spec
      this.$emit('update:selectedSpec', spec)
    },
    /**
     * AMI 선택시
     */
    onSelectAmi (ami, hardReset) {
      this.$emit('update:selectedAmi', ami)

      // AMI 선택 - 사양 선택도 한 상태에서 AMI를 변경할 경우
      if (hardReset) {
        this.$refs.specRef.resetData()
        this.$refs.storageRef.resetData()
      }
    },
    async checkDuplicateInstanceName (instanceName) {
      try {
        this.isLoadingCheckInstanceName = true
        this.isValidatingInstanceName = true

        const { data } = await getEC2({ projectIdx: this.projectInfo.project.projectIdx, instanceName })

        const exact = data.filter(ec2 => ec2.instanceName === instanceName)
        if (exact.length) {
          this.isErrorInstanceName = true
        } else {
          this.isErrorInstanceName = false
        }
      } catch (error) {

      } finally {
        this.isLoadingCheckInstanceName = false
        this.isValidatingInstanceName = true
      }
    },
    validateInstanceName: debounce(function (e) {
      if (!e) {
        this.isValidatingInstanceName = false
        this.isErrorInstanceName = false
        return
      }

      this.checkDuplicateInstanceName(e)
    }, 450)
  },
  data: () => ({
    isLoadingCheckInstanceName: false,
    isLoadingCheckInstanceType: false,
    originStorageData: null,
    isErrorInstanceName: false,
    isValidatingInstanceName: false,
    selectedOS: null,
    testOptions: [
      { label: 'Amazon Linux', value: 1 },
      { label: 'Cent OS', value: 2 },
      { label: 'Debian', value: 3 },
      { label: 'Fedora', value: 4 },
      { label: 'Gentoo', value: 5 },
      { label: 'openSUSE', value: 6 },
      { label: '기타 Linux', value: 7 },
      { label: 'RedHat', value: 8 },
      { label: 'SUSE Linux', value: 9 },
      { label: 'Ubuntu', value: 10 },
      { label: 'Windows', value: 11 },
      { label: 'macOS', value: 12 }
    ], // 운영체제
    specOptions: [
      { label: '이름', value: 'name' },
      { label: 'vCPU', value: 'vcpu' },
      { label: '메모리', value: 'memory' }
    ],
    specFilter: {
      specSelect: 'name',
      keyword: ''
    },
    activeMonitor: false,
    loadingAmiList: false,
    amiList: [],
    amiFilter: {
      name: '',
      os: ''
    }
  })
}
</script>

<style lang="scss" scoped>
.instance-info {
  &-head {
    margin-bottom: $gap-m;
  }

  h1 {
    font-size: 18px;
  }

  h2 {
    font-size: 15px;
    margin-top: 12px;
  }

  h1,
  h2 {
    &.required {
      position: relative;

      &::after {
        position: absolute;
        content: "*";
        color: $main-blue;
        display: inline-block;
        top: -2px;
        margin-left: 5px;
      }
    }
  }

  &-base {
    &__item {
      display: flex;
      flex-wrap: nowrap;
      margin-bottom: $gap-s;

      > :first-child {
        flex: 0 0 295px;
      }

      &-name,
      .error {
        width: 100%;
      }

      .error {
        margin-top: $gap-s;
        color: $main-blue;
      }
    }
  }

  .instance-ami,
  .instance-spec {
    &-head {
      display: flex;
      flex-wrap: nowrap;
      justify-content: space-between;
      margin-top: $gap-m;

      &__filter {
        display: flex;
        flex-wrap: nowrap;

        &-name,
        &-os {
          display: flex;
          align-items: center;
        }

        &-name {
          > :not(:first-child) {
            margin-left: $gap-s;
          }
        }

        &-os {
          margin-left: 25px;

          span {
            margin-right: $gap-s;
          }
        }

        &-spec {
          margin-right: 25px;
          display: flex;
          align-items: center;
        }

        .el-select.small {
          max-width: 100px;
        }

        &::v-deep {
          .el-input__inner {
            border-left: none;
            border-right: none;
            border-top: none;
          }
        }
      }
    }
  }

  .instance-storage {
    margin-top: $gap-m;

    &-head {
      display: flex;
      align-items: center;
      justify-content: space-between;

      .instance-storage-edit {
        display: flex;

        .edit-item {
          margin-right: 25px;

          .box {
            width: 22px;
            height: 10px;
            border-radius: 2px;
            display: inline-block;
            box-shadow: 2px 2px 10px rgba(11, 1, 1, 0.15);
            margin-right: $gap-s;

            &.default {
              background-color: $white;
            }
            &.new {
              background-color: #0A0C20;
              // background-color: #fff4f4;
              // border: 1px solid #f8dcdc;
            }
          }

          .title {
            display: inline-block;
            color: #666;
            font-size: 12px;
          }
        }
      }
    }
  }

  .instance-monitoring {
    margin-top: $gap-m;

    > h1 {
      display: inline-block;
    }
  }

  .modal-button-area {
    margin-top: 40px;
    border-top: 1px solid #3D435E;
    padding-top: $gap;
  }
}
</style>
