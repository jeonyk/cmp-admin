<!-- S/W 라이선스 추가 모달 -->
<template>
  <el-dialog
    :visible="active"
    :title="$v('인스턴스 유형 설정')"
    width="850px"
    top="50px"
    @close="!loading ? close() : null"
    style="overflow-y: scroll;"
  >
    <div
      class="ami-instance-modal-wrapper"
      v-loading="loading"
    >
      <div class="instance-type-option">
        <search-bar
          ref="search"
          :placeholder="$t('service.InstanceType.PLACEHOLDER.002')"
          @change="value => searchEvent(image.imageId, value)"
          @refresh="value => refreshEvent(image.imageId, undefined)"
        />
      </div>
      <!-- /. 인스턴스 유형 검색 -->

      <div class="instance-list">
        <cmp-grid
          :init-custom-action="init"
          :item-source="instanceData"
          :columns="instanceColumns"
          :use-column-filter="false"
          :init-auto-select-row="instance"
          init-auto-select-row-key="instanceType"
          selectable
          keep-select
          page-keeping
          @selectedRow="selectedInstance"
        />
      </div>
      <!-- /. 인스턴스 목록 -->

      <section class="modal-button-area">
        <button
          class="button"
          type="is-anti"
          @click="close"
        >
          {{ $v('취소') }}
        </button>
        <button
          class="button"
          type="is-primary"
          :disabled="!instance"
          @click="saveInstance"
        >
          {{ $v('저장') }}
        </button>
      </section>
      <!-- /. AMI 이미지 등록 -->
    </div>
  </el-dialog>
</template>

<script>
import SearchBar from '@/components/SearchBar/SearchBar'
import API from '@sd-fe/cmp-core'

export default {
  name: 'AMIBastionInstanceSetting',
  components: {
    'search-bar': SearchBar
  },
  props: {
    active: {
      type: Boolean,
      required: true
    },
    region: {
      type: String,
      default: undefined
    },
    image: {
      type: Object,
      default: () => {}
    }
  },
  watch: {
    active (status) {
      if (status === true) return this.getBastionInstances(this.image?.imageId)
      else return this.close()
    }
  },
  methods: {

    async getBastionInstances (imageId = undefined, instanceTypeName = undefined) {
      try {
        this.loading = true
        const { data } = await API.aws.getBastionInstances({ imageId, instanceTypeName })
        this.instanceData = await data.map(item => ({ ...item, memory: `${item.memory / 1024} Gib` })) /* 기본 데이터는 MiB 라고 함 */

        // 이미 선택된 인스턴스가 있는경우 :: 자동선택
        if (this.image?.defaultInstanceType) {
          const { defaultInstanceType } = this.image
          this.instance = data.filter((instance, index) => {
            if (instance.instanceType === defaultInstanceType) {
              this.instanceIndex = index + 1
              return instance
            }
          })[0]
        }
      } catch (error) {
        console.error('@@ getBastionInstances : ', error)
        this.instanceData = []
      } finally {
        this.loading = false
      }
    },

    /**
     * 선택된 인스턴스 정보 저장
     */
    selectedInstance (row) {
      this.instance = (row === null) ? null : row.dataItem
    },

    async saveInstance () {
      if (await this.dryRun() === false) return this.$alert(this.$v('해당 AMI Image 에 선택된 Instance Type 은 사용 할 수 없습니다.'))

      this.amiBastion()
    },

    /**
     * 인스턴스 유형 설정 전 테스트 결과 반환
     */
    async dryRun () {
      try {
        this.loading = true
        // 일단 테스트하기
        const data = await API.aws.dryRun({
          amiId: this.image.imageId,
          instanceType: this.instance?.instanceType
        })

        return data
      } catch (error) {
        console.error('@@ dryRun : ', error)
        this.loading = false
        return false
      }
    },

    /**
     * ami bastion 여부 설정
     * @param {Boolean} isBastion
     * @param {Object} imageId
     */
    async amiBastion () {
      if (this.instance === null) return

      const params = {
        defaultInstanceType: this.instance?.instanceType, // 선택된 인스턴스
        regionName: this.region, // 선택된 리전 정보
        isBastion: true,
        imageId: this.image.imageId // 현재 보고있는 이미지 ID
      }

      try {
        this.loading = true
        await API.aws.setAMIBastion(params)

        this.$alert(this.$v('등록이 완료 되었습니다.'), {
          callback: () => {
            this.$emit('save', true)
            this.close()
          }
        })
      } catch (error) {
        console.error(error)
        // 변경하는데 실패했습니다. <br> 다시 시도해주세요.
        this.$alert(this.$t('service.AMIImage.ALERT.002'), '', { dangerouslyUseHTMLString: true, callback: () => false })
      } finally {
        this.loading = false
      }
    },

    /**
     * [인스턴스 유형 검색] - 사용중인 인스턴스 유형 변경 이벤트 (그냥 깔끔하게 input 함수를 분리)
     * @param { String } regionName 리전 텍스트
     * @param { Boolean } value 검색 텍스트
     */
    searchEvent (imageId, value) {
      this.searchText = value
      return this.getBastionInstances(imageId, value)
    },
    /**
     * [인스턴스 유형 검색] - 사용중인 인스턴스 유형 refresh 이벤트 (그냥 깔끔하게 input 함수를 분리)
     * refresh 라면 인스턴스타입 검색 API 호출 + 사용중인 인스턴스 유형 false 로 변경
     * @param { String } regionName 리전 텍스트
     * @param { Boolean } value 검색 텍스트
     */
    refreshEvent (imageId, value) {
      this.searchText = value
      return this.getBastionInstances(imageId, value)
    },
    /**
     * [닫기/취소] 이벤트 - 모든 데이터를 리셋합니다.
     */
    close () {
      this.searchText = undefined
      this.instanceData = []
      this.instance = null
      this.$emit('close')
    },

    init (grid, data) {
      this.$nextTick(() => data.moveToPage(parseInt(this.instanceIndex / 10)))
    }
  },
  data () {
    return {
      loading: false,
      searchText: undefined,
      instanceData: [],
      instance: null,
      instanceIndex: 0,
      instanceColumns: [
        { header: this.$t('service.InstanceType.instanceType'), binding: 'instanceType' }, // 인스턴스 유형
        { header: 'vCPU', binding: 'vcpu' }, // vCPU
        { header: this.$t('service.InstanceType.memory'), binding: 'memory', format: '*d' }, // 메모리
        { header: this.$t('service.InstanceType.network'), binding: 'networkPerformance', width: 300 } // 네트워크 성능
      ]
    }
  }
}
</script>

<style lang="scss" scoped>
.ami-instance-modal-wrapper {

  .instance-type-option {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: $gap;
  }

  .instance-list {
    height: 490px;
  }
}
</style>
