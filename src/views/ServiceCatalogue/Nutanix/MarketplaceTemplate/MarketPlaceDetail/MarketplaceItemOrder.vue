<!--
  * 파일명 : MarketplaceItemOrder.vue
  * 파일 기능 : 마켓플레이스 제품 주문 페이지 (현재 사용하지 않음)
  * 작성자 : 김예담 외 1명
  * 최종 작성일 : 2020-09-17
  * License By Shinsegae I&C
  * 2020-09-17 fix:[ 마켓플레이스 주문] 간격 조정 및 스타일 수정
 -->

<template>
  <section class="marketplace-item-order">
    <dashboard-panel title="사양선택">
      <cmp-grid
        :columns="selectSpecColumns"
        :item-source="specData"
        header-checkbox
        @selectedRow="specTableSelectedData"
      />
    </dashboard-panel>

    <dashboard-panel title="Local Disk">
      <sc-range-input
        @range-data="rangeData"
        :only-disk="true"
      />
    </dashboard-panel>

    <dashboard-panel title="IP">
      <div class="ip-section">
        <div class="section-contents -legacy">
          <strong>LEGACY</strong>
          <ul class="ip-list">
            <li
              class="ip-item"
              v-for="(label, labelIdx) in ipCheckboxData[0]"
              :key="labelIdx"
            >
              <el-checkbox
                v-model="label.value"
                @change="ipInfoData(label)"
              >
                {{ label.labelName }}
              </el-checkbox>
            </li>
          </ul>
        </div>
        <div class="section-contents -sen">
          <strong>SDN</strong>
          <ul class="ip-list">
            <li
              class="ip-item"
              v-for="(label, labelIdx) in ipCheckboxData[1]"
              :key="labelIdx"
            >
              <el-checkbox
                v-model="label.value"
                @change="ipInfoData(label)"
              >
                {{ label.labelName }}
              </el-checkbox>
            </li>
          </ul>
        </div>
      </div>
      <!-- {{ ipDataPack }} -->
    </dashboard-panel>

    <dashboard-panel title="설치프로그램">
      <cmp-grid
        header-checkbox
        :columns="installProgramColumns"
        :item-source="installProgramData"
        @selectedRow="installProgramTableSelectedData"
      />
    </dashboard-panel>

    <!-- 해당시에만 노출 -->
    <dashboard-panel title="{ JEUS } 관리자">
      <div class="administor-info">
        <!-- v-if -->
        <p>
          ID: <span>administor!!!</span>
        </p>
        <p>
          PW: <span>password!!1</span>
        </p>
      </div>
    </dashboard-panel>

    <section class="submit-arti big-button-area">
      <button
        class="button"
        type="is-anti"
        @click="
          addSourceModal = false;
          $router.go(-1);
        "
      >
        취소
      </button>
      <button
        class="button"
        @click="addSourceModal = true"
        type="is-primary"
      >
        자원바구니 추가
      </button>
    </section>

    <!-- <sc-modal-component
      :modal-show="addSourceModal"
      @modal-closed="addIntoSourceBasket"
    /> -->
  </section>
</template>

<script>
import { DashboardPanel } from '@sd-fe/cmp-core'
import SCRangeInput from '@/components/cmp-components/SCRangeInput'
// import SCModalComponent from '@/components/cmp-components/SC_ModalComponent'

export default {
  name: 'MarketplaceItemOrder',
  components: {
    'dashboard-panel': DashboardPanel,
    'sc-range-input': SCRangeInput
    // 'sc-modal-component': SCModalComponent
  },
  methods: {
    /**
     * @function - [IP]의 데이터를 ipDataPack - 선택된 ip에 대한 정보를Array에 입력합니다.
     * @param {Event Object}
     * @param {Object} - 해당 checkbox 정보
     * @return {Array}
     */
    ipInfoData (label) {
      if (label.value) {
        this.ipDataPack.push(label)
      } else {
        this.ipDataPack.forEach((checkedIp, checkedIdx) => {
          if (checkedIp.label === label.label) {
            this.ipDataPack.splice(checkedIdx, 1)
          }
        })
      }

      return this.ipDataPack
    },
    // ipInfoData (event, label) {
    //   if (event.target.checked) {
    //     this.ipDataPack.push(label)
    //   } else {
    //     this.ipDataPack.forEach((checkedIp, checkedIdx) => {
    //       if (checkedIp.label === label.label) {
    //         this.ipDataPack.splice(checkedIdx, 1)
    //       }
    //     })
    //   }

    //   return this.ipDataPack
    // },
    /**
     * @function - checked된 table 저장
     * @param {Array}
     */
    specTableSelectedData (checkedRows) { this.specDataPack = checkedRows },
    installProgramTableSelectedData (checkedRows) { this.installedDataPack = checkedRows },
    /**
     * @function - range 데이터 저장
     * @param {Array}
     */
    rangeData (range) {
      this.externalDiskDataPack = range
    },
    /**
     * @function - [자원바구니 추가] 버튼 클릭시 동작
     */
    addIntoSourceBasket (sourceData) {
      // 입력된 자원생성 데이터 모음
      console.log(this.specDataPack, 'checked table - 사양선택')
      console.log(this.externalDiskDataPack, 'external disk')
      console.log(this.ipDataPack, 'checked Arr - IP')
      console.log(this.installedDataPack, 'checked table - 설치프로그램')

      console.log(sourceData.emit) // 모달의 데이터

      this.addSourceModal = sourceData.view
    }
  },
  data () {
    return {
      selectSpecColumns: [
        { binding: 'spec', header: '사양', width: '*' },
        { binding: 'vcpus', header: 'VCPUs', width: '*' },
        { binding: 'ram', header: 'RAM', width: '*' },
        { binding: 'disk', header: 'DISK', width: '*' }
      ],
      installProgramColumns: [
        { binding: 'name', header: 'Name', width: '*' },
        { binding: 'version', header: 'VERSION', width: '*' }
      ],
      // 예시 데이터
      specData: [
        { spec: 'r1.nano', vcpus: '1Core', ram: '1GB', disk: '50GB' },
        { spec: 'r1.tiny', vcpus: '1Core', ram: '2GB', disk: '50GB' },
        { spec: 'r1.small', vcpus: '2Core', ram: '4GB', disk: '50GB' },
        { spec: 'r1.medium', vcpus: '2Core', ram: '5GB', disk: '50GB' },
        { spec: 'r1.large', vcpus: '4Core', ram: '16GB', disk: '50GB' },
        { spec: 'r1.xlarge', vcpus: '5Core', ram: '32GB', disk: '50GB' },
        { spec: 'r1.2xlarge', vcpus: '16Core', ram: '64GB', disk: '50GB' },
        { spec: 'r1.4xlarge', vcpus: '32Core', ram: '128GB', disk: '50GB' },
        { spec: 'r1.8xlarge', vcpus: '64Core', ram: '256GB', disk: '50GB' }
      ],
      installProgramData: [
        { name: '설치프로그램 1', version: '버전1' },
        { name: '설치프로그램 2', version: '버전2' },
        { name: '설치프로그램 3', version: '버전3' },
        { name: '설치프로그램 4', version: '버전4' }
      ],
      // ********* ip *********
      ipCheckboxData: [
        [
          { labelName: '내부', label: 'legacyInside', value: false },
          { labelName: 'NAT', label: 'legacyNat', value: false },
          { labelName: '외부', label: 'legacyOutside', value: false }
        ],
        [
          { labelName: '관계사', label: 'sdnRelation', value: false },
          { labelName: 'DB', label: 'sdnDb', value: false },
          { labelName: '개발', label: 'sdnDev', value: false },
          { labelName: '내부', label: 'sdnInside', value: false },
          { labelName: 'NAT', label: 'sdnNat', value: false },
          { labelName: '외부', label: 'sdnOutside', value: false }
        ]
      ],
      addSourceModal: false, // 모달 설정

      // ----- 입력된 데이터 수집 ------
      specDataPack: [], // 사양선택 input 데이터
      externalDiskDataPack: [], // extDisk input 데이터
      ipDataPack: [], // ip input 데이터
      installedDataPack: [] // 설치프로그램 input 데이터
      // adminorDataPack: [] // 관리자 데이터 ..?
    }
  }
}
</script>

<style lang="scss" scoped>
.marketplace-item-order {
  .dashboard-panel {
    & + .dashboard-panel {margin-top: $gap-m;}
  }

  .ip-section {
    display: flex;
    justify-content: space-between;
    flex-direction: column;
    padding: $gap * 2;
    > .section-contents {
      display: flex;
      & + .section-contents {margin-top: $gap;}
      > strong {
        min-width: 150px;
      }
      > .ip-list {
        display: flex;
        > .ip-item {
          min-width: 80px;
          margin-right: $gap-m;
        }
      }
    }
  }
  .administor-info {
    margin-bottom: $gap;
    > p {
      margin-bottom: $gap-s;
    }
  }
}
</style>
