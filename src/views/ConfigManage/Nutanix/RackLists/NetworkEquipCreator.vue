<!--
  * 파일명 : NetworkEquipCreator.vue
  * 파일 기능 : 네트워크 장비 추가/변경 form
  * 작성자 : 정재은 외 2명
  * 최종 작성일 : 2021-01-15
  * License By Shinsegae I&C
  * 2021-01-15 Update: lodash 사용방식 변경
 -->

<template>
  <div class="network-equip-creator">
    <section class="modal-body">
      <register-contents
        :title="$t('common.GRID.category')"
        required
      >
        <el-radio-group
          v-model="radioCategory"
        >
          <el-radio label="SWITCH">
            {{ $t('config.RACK.switch') }}
          </el-radio>
          <el-radio label="IPMI">
            IPMI
          </el-radio>
        </el-radio-group>
      </register-contents>
      <!-- 카테고리 -->

      <register-contents
        :title="$t('common.MODAL.name')"
        required
      >
        <el-input
          :placeholder="$t('common.MODAL.name')"
          v-model="nameInput"
        />
      </register-contents>
      <!-- 이름 -->

      <register-contents
        :title="$t('common.REGCON.remark')"
      >
        <el-input
          :placeholder="$t('common.REGCON.remark')"
          v-model="descInput"
        />
      </register-contents>
      <!-- 비고 -->
    </section>

    <section class="modal-footer modal-button-area">
      <button
        class="button -modal-button"
        type="is-anti"
        @click="closeModal"
      >
        {{ $t('common.BTN.cancel') }}
      </button>
      <button
        class="button -modal-button"
        type="is-primary"
        @click="applySave"
      >
        {{ !data ? $t('common.BTN.add') : $t('common.BTN.apply') }}
      </button>
    </section>
  </div>
</template>

<script>
// import { cloneDeep } from 'lodash'

export default {
  name: 'NetworkEquipCreator',
  props: {
    rackIdx: {
      type: Number,
      default: 0
    },
    data: {
      type: Object,
      default: null
    },
    ctgDatas: { // 네트워크 카테고리 전체 데이터
      type: Array,
      default: () => []
    },
    clusters: {
      type: Array,
      default: () => []
    }
  },
  created () {
    this.setCtgOptions()
  },
  watch: {
    data: {
      immediate: true,
      handler (newVal) {
        if (newVal !== null) this.setInitData(newVal)
      }
    }
  },
  methods: {
    /**
     * 수정일 때, 초기 데이터 세팅
     * @param {Object} data 초기 데이터 {isNew, listInfo(선택 네트워크카테고리), order, elementIdx, type, name, desc}
     */
    setInitData (data) {
      if (data.listInfo) {
        this.listInfo.ctg = data.listInfo.ctg // 데이터센터
        this.changeCtg(data.listInfo.ctg) // 대역 옵션
        this.listInfo.type = data.listInfo.type // 대역
        this.changeType(data.listInfo.type) // 클러스터 옵션
        this.listInfo.element = data.listInfo.element // 클러스터
      }
      if (data.type) this.radioCategory = data.type // 카테고리
      if (data.name) this.nameInput = data.name // 이름
      if (data.desc) this.descInput = data.desc // 비고
    },
    /**
     * Element 정보 > 데이터센터 선택 옵션 설정
     */
    setCtgOptions () {
      this.ctgOptions = this.ctgDatas.filter(ctg => ctg.upperCategoryIdx === 0)
    },
    /**
     * 카테고리 변경 이벤트
     * @param {Number} val 선택한 카테고리의 ipCategoryIdx
     */
    changeCtg (val) {
      this.typeOptions = []
      this.clusterOptions = []
      this.listInfo.type = null
      this.listInfo.element = null
      this.typeOptions = this.ctgDatas.filter(type => type.upperCategoryIdx === val)
    },
    /**
     * 타입(네트워크 환경) 변경 이벤트
     * @param {Number} val 선택한 타입의 ipCategoryIdx
     */
    changeType (val) {
      this.listInfo.element = null

      let ctgName, typeName
      this.ctgDatas.forEach(item => {
        if (item.ipCategoryIdx === this.listInfo.ctg) ctgName = item.codeValue
        if (item.ipCategoryIdx === this.listInfo.type) typeName = item.codeValue
      })
      this.clusterOptions = [...this.setElementOption(ctgName, typeName)]
    },
    /**
     * 데이터센터, 네트워크 환경에 따른 랙실장도 옵션을 설정
     * @param {String} datacenter 데이터센터 정보
     * @param {String} networkInfo 네트워크 환경 정보
     * @return filteredData 데이터센터, 네트워크 환경 정보로 필터링된 후 클러스터 정보
     */
    setElementOption (datacenter, networkInfo) {
      this.clusterOptions = []
      let filteredData = [...this.clusters]

      if (datacenter) filteredData = filteredData.filter(el => el.datacenter === datacenter)
      if (networkInfo) filteredData = filteredData.filter(el => el.networkInfo?.toLowerCase() === networkInfo.toLowerCase())
      return filteredData
    },
    /**
     * 모달 정보 초기화
     */
    initData () {
      this.typeOptions = []
      this.clusterOptions = []
      this.listInfo = {
        ctg: null,
        type: null,
        element: null
      }
      this.radioCategory = ''
      this.nameInput = ''
      this.descInput = ''
    },
    /**
     * 모달 닫기 이벤트
     */
    closeModal () {
      this.$emit('close-modal')
    },
    /**
     * [추가, 수정]
     */
    applySave () {
      if (!this.validForm()) return

      let message
      if (this.data === null) message = this.$t('common.CONFIRM.NETWORK.002') // 네트워크 장비를<br>추가하시겠습니까?
      else message = this.$t('common.CONFIRM.NETWORK.001') // 네트워크 장비 정보를<br>수정하시겠습니까?

      this.$confirm(message, '알림', {
        confirmButtonText: this.$t('common.BTN.confirm'),
        cancelButtonText: this.$t('common.BTN.cancel'),
        dangerouslyUseHTMLString: true
      }).then(() => {
        const payload = {
          isNew: this.data === null,
          // listInfo: cloneDeep(this.listInfo),
          order: this.data === null ? 1 : this.data.order,
          elementIdx: this.rackIdx,
          type: this.radioCategory,
          name: this.nameInput,
          desc: this.descInput
        }
        // console.log('@@@applySave: ', payload)
        this.$emit('apply-save', payload)
      })
        .catch(() => false)
    },
    /**
     * 생성, 수정시 validation
     * @return validation 통과 유무
     */
    validForm () {
      const alert = (message, callback) => {
        this.$alert(message, '알림', {
          confirmButtonText: this.$t('common.BTN.confirm'),
          callback: callback
        })
      }

      // if (Object.values(this.listInfo).includes(null)) return alert(this.$t('common.ALERT.NUTA.020'), () => false) // element 선택 정보를 확인해주세요.
      if (!this.radioCategory) return alert(this.$t('common.ALERT.NETWORK.014'), () => false) // 카테고리를 선택해주세요
      if (!this.nameInput) return alert(this.$t('common.ALERT.ORG.009'), () => false) // 이름을 입력해주세요.
      return true
    }
  },
  data () {
    return {
      ctgOptions: [], // 카테고리(데이터 센터) 옵션
      typeOptions: [], // 타입(대역) 옵션
      clusterOptions: [], // 클러스터(element) 옵션
      listInfo: { // 셀렉트박스에서 선택한 카테고리/타입/클러스터
        ctg: null,
        type: null,
        element: null
      },
      radioCategory: '', // 카테고리
      nameInput: '', // 이름
      descInput: '' // 비고
    }
  }
}
</script>

<style lang="scss" scoped>
.network-equip-creator {
  .datacenter-selector {
    width: 150px;
    margin-right: $gap-s;
  }

  .modal-body {
    border-top: 1px solid $border-color;
  }
}
</style>
