<template>
  <div
    class="set-resource-switch-certification-list"
  >
    <section class="table-top-wrap">
      <total-count
        class="total-count-wrap"
        :total-count="totalResultCnt"
      />
      <section class="table-top-wrap__btns">
        <button
          class="button"
          type="is-primary"
          @click="handleOpenCertifEdit ('ADD')"
        >
          {{ $v('항목 추가') }}
        </button>

        <button
          class="button"
          type="is-anti"
          :disabled="isDisableDelete"
        >
          {{ $v('삭제') }}
        </button>
      </section>
    </section>
    <section class="table-area">
      <network-certif-grid
        :is-full-columns="true"
        @selectedRow="handleSelectedRow"
      />
    </section>
    <el-dialog
      :title="$v('항목 추가')"
      @close="handleCloseCertifEdit"
      :visible="isOpenCertifEdit"
    >
      <div class="certi-edit-form">
        <register-contents

          :title="$v('스위치 장비명')"
          required
        >
          <el-select
            v-model="netEquipIdx"
            :placeholder="$v('스위치명') +' ' + $v('선택')"
          >
            <el-option
              v-for="(equip, index) in equipOptions"
              :label="equip.netName"
              :value="equip.netIdx"
              :key="index"
            >
              {{ equip.netName }} {{ equip.isManualManagement?`(${$v('수기관리')})`:'' }}
            </el-option>
          </el-select>
        </register-contents>
        <register-contents
          :title="$v('인증서 명')"
          required
        >
          <el-input
            class="certi-edit-from__input--certi-name"
            v-model="certifName"
            :placeholder="$v('인증서 명')+' ' + $v('입력')"
          />
        </register-contents>
        <!-- <register-contents
          title="Certificate Format"
          required
        >
          < <el-radio-group
            class="certi-edit-from__radio--certi-format"
            v-model="certifFormat"
          >
            <el-radio
              label="PEM"
              class="format-option"
            >
              PEM
            </el-radio>
            <el-radio
              label="DER"
              class="format-option"
            >
              DER
            </el-radio>
          </el-radio-group>
        </register-contents> -->
        <register-contents
          title="Certificate File"
          required
        >
          <el-upload
            type="button"
            class="certi-edit-from__btn--file-upload"
            action=""
            :multiple="false"
            :limit="1"
            :auto-upload="false"
            :file-list="certifFile"
            :on-change="(file,fileList) =>
              handleChangeFileList(file,fileList,'certifFile')"
          >
            <button
              class="button"
              type="is-primary"
              :disabled="certifFile.length === 1"
            >
              파일 선택
            </button>
          </el-upload>
        </register-contents>
        <register-contents
          title="Key file"
          required
        >
          <el-upload
            type="button"
            class="certi-edit-from__btn--file-upload"
            action=""
            accept=".key"
            :limit="1"
            :multiple="false"
            :auto-upload="false"
            :file-list="certifKeyFile"
            :on-change="(file,fileList)=>
              handleChangeFileList(file,fileList,'certifKeyFile')"
          >
            <button
              class="button"
              type="is-primary"
              :disabled="certifKeyFile.length === 1"
            >
              파일 선택
            </button>
          </el-upload>
        </register-contents>
        <cmp-grid
          class="certif-grid network-certif-grid-table"
          :use-column-filter="false"
          :columns="certifGridColumns"
          :item-source="certifGridData"
        >
          <template #f="props">
            <trash-icon
              @click="handleClickToDelCert(props)"
              is-button
            />
          </template>
        </cmp-grid>
      </div>
      <common-modal-footer
        @confirm="handleConfirmCertifEdit"
        @close="handleCloseCertifEdit"
      />
    </el-dialog>
  </div>
</template>

<script>
import API, { CommonModalFooter } from '@sd-fe/cmp-core'
export default {
  components: {
    CommonModalFooter
  },
  methods: {
    handleSelectedRow (rowData) {
      this.selectedRow = rowData
    },
    handleOpenCertifEdit (modalType) {
      this.modalType = modalType

      if (modalType === 'MODIFY') {
        this.initModifyModal()
      }
      this.isOpenCertifEdit = true
    },
    /** API_HANDLER (GET) 네트워크 장비 리스트 조회 */
    async getEquipSwitchList () {
      const req = await API.network.getEquipSwitchList()
      return req
    },
    //* * API_HANDLER (POST) 인증서 추가 */
    async uploadSslCertif (payload) {
      try {
        const result = await API.network.uploadSslCertif(payload)
        if (result) { return true }
      } catch (error) {
        let errMessage = '관리자에게 문의 해주세요.'
        if (error.response?.data?.errorCode) {
          const errCode = error.response.data.errorCode
          switch (errCode) {
            case 'a': errMessage = ''; break
          }
        }

        this.$alert(`인증서 추가 중에 오류가 발생하였습니다.<br>[${errMessage}]`, { dangerouslyUseHTMLString: true })
      }
    },
    /** EVENT_HANDLER (삭제) 인증서 첨부 삭제 */
    handleClickToDelCert (props) {
      const selectedRowName = props.row.fileName
      const foundIdx = this.certifGridData.findIndex((el) => el.fileName === selectedRowName)
      const foundFileIdx = this.certifFile.findIndex((el) => el.name === selectedRowName)
      this.certifGridData.splice(foundIdx, 1)
      this.certifFile.splice(foundFileIdx, 1)
    },
    handleChangeFileList (file, fileList, bindName) {
      // bindName = fileList
      this[bindName] = fileList
      console.log(bindName)
    },
    async handleConfirmCertifEdit () {
      console.log('handleConfirmCertifAdd')
      const isConfirm = await this.$confirm('인증서를 추가하시겠습니까?').then(() => true).catch(() => false)
      if (isConfirm) {
        const isSuccess = await this.uploadSslCertif(this.formData)
        if (isSuccess) {
          this.isOpenCertifEdit = false
          this.initModal()
        }
      }
    },
    initModal () {
      this.certifName = null
      this.certifKeyFile = []
      this.certifFile = []

      this.netEquipIdx = null
    },
    /** EVENT_HANDLER (변경 모달 오픈) */
    initModifyModal () {
      const { a, b } = this.selectedRow
      console.log('initModifyModal')
      this.certifName = a
      this.certifKeyFile = []
      this.certifFile = []
      this.netEquipIdx = b
    },
    /** EVENT_HANDLER () */
    handleCloseCertifEdit () {
      this.isOpenCertifEdit = false
      this.initModal()
    }

  },
  computed: {
    totalResultCnt () {
      return this.certifGridData.length
    },

    isDisableDelete () {
      return this.selectedRow === null
    },
    uploadFile () {
      return [...this.certifKeyFile, ...this.certifFile]
    },
    formData () {
      return {
        certName: this.certifName,
        expiryMonitor: true, // 하드코딩 (디폴트 값) // 네트워크API 담당자와 협의
        notificationPeriod: '30', // 하드코딩 (디폴트 값) // 네트워크API 담당자와 협의
        files: this.uploadFile,
        netIdx: this.netEquipIdx
      }
    }
  },

  async created () {
    const _netEquip = await this.getEquipSwitchList()
    // const MOCK_NETEQUIPS = [{name: ''}, {},  {}]
    // const _netEquip = MOCK_NETEQUIPS
    this.equipOptions = _netEquip
  },
  data () {
    return {
      // 모달에서 받는 데이터
      selectedNetworkEquip: null,
      certifKeyFile: [],
      certifFile: [],
      netEquipIdx: null,
      // 모달에서 사용하는 옵션
      equipOptions: {},
      checkedRowsData: [],
      modalType: null, // 'ADD/MODIFY'
      isOpenCertifEdit: false,
      certifName: '',
      isDisableAdd: false,
      certifGridData: [],
      certifGridColumns: [
        { binding: 'certName', header: this.$v('인증서 명') },
        { binding: 'domain', header: this.$v('도메인') },
        { binding: 'validTo', header: this.$v('시작일') },
        { binding: 'validFrom', header: this.$v('만료일') },
        { binding: 'issuer', header: this.$v('발행기관') },
        { binding: 'f', header: this.$v('삭제'), customHtml: true }
      ],
      selectedRow: null
    }
  }
}
</script>

<style scoped lang="scss">
.table-top-wrap__btns {
  display: flex;
  gap: 10px;
}
.certi-edit-form {
  border-top: 1px solid $border-color;

  .certi-edit-from__radio--certi-format {
     &::v-deep {
      gap: 20px;
    }
    & format-option:nth-child(1) {
      margin-right: 40px;
    }
  }
}

</style>
