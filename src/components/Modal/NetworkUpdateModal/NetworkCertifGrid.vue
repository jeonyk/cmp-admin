<template>
  <div class="network-certif-grid">
    <cmp-grid
      class="network-certif-grid-table"
      :columns="columns"
      :item-source="certifGridData"
      paging-type="list"
      :loading="isLoading"
      :height="450"
      :changing-page-reset="false"
      selectable
      @selectedRow="handleSelectedRow"
    >
      <template #download>
        <div class="download-components">
          <file-down-component
            class="download-component__button"
            type="button"
            button-text="Certificate Download"
          />
          <file-down-component
            type="button"
            button-text="Key File Download"
          />
        </div>
      </template>
      <template #detail="prop">
        <file-icon
          :width="20"
          :height="20"
          class="file-svg"
          is-button
          @click="() => handleRouteDetail(prop.row)"
        />
      </template>
    </cmp-grid>
  </div>
</template>
<script>
import API, { FileDownComponent } from '@sd-fe/cmp-core'
import FileIcon from '@/components/Icons/FileIcon.vue'
export default {
  props: {
    isFullColumns: {
      type: Boolean,
      default: false
    }

  },
  components: {
    FileDownComponent,
    FileIcon
  },
  created () {
    if (this.isFullColumns) {
      this.columns = this.defaultColumns.concat(this.addColumns)
    } else {
      this.columns = this.defaultColumns
    }
    this.initGridData()
  },
  methods: {
    handleSelectedRow (row) {
      if (row !== null) {
        this.$emit('selectedRow', row._data)
        this.selectedRow = row._data
      } else this.$emit('selectedRow', null)
    },
    handleRouteDetail (rowItem) {
      console.log('handleRouteDetail')
      const rowData = rowItem
      this.$router.push({
        name: 'set-resource-switch-certification-detail',
        params: {
          idx: 2,
          data: rowData
        }
      })
    },
    /** API_HANDLER (GET) 인증서 조회 */
    async getSslCertif () {
      try {
        console.log('getSslCertif')
        const result = await API.network.getSslCertif()
        return result
      } catch (error) {
        let errMessage = '관리자에게 문의 해주세요.'
        if (error.response?.data?.errorCode) {
          const errCode = error.response.data.errorCode
          switch (errCode) {
            case 'a': errMessage = ''; break
          }
        }

        this.$alert(`인증서 조회 중 오류가 발생했습니다.<br>[${errMessage}]`, { dangerouslyUseHTMLString: true })
      }
    },
    // 초기 그리드 값을 세팅합니다.
    async initGridData () {
      try {
        this.isLoading = true
        this.certifGridData = await this.getSslCertif()
      } catch (error) {
        console.error('알 수 없는 에러 발생')
      } finally {
        this.isLoading = false
      }
    }
  },
  data () {
    return {
      isLoading: false,
      defaultColumns: [
        { binding: 'certName', header: this.$v('인증서 명') },
        { binding: 'domain', header: this.$v('도메인') },
        { binding: 'validTo', header: this.$v('시작일') },
        { binding: 'validFrom', header: this.$v('만료일') },
        { binding: 'issuer', header: this.$v('발행 기관') }
      ],
      addColumns: [
        { binding: 'f', header: this.$v('연결된 로드밸런스명') },
        { binding: 'download', header: this.$v('인증서 다운로드'), customHtml: true, width: 400 },
        { binding: 'detail', header: this.$v('상세'), customHtml: true, width: 120 }
      ],
      MOCK_GRID_ITEMS: [{
        a: 'certif1',
        b: 'certification',
        c: '2011-11-11',
        d: '2099-99-99',
        e: 'Issuer1',
        f: '로드벨런스명',
        g: 'test',
        h: 'test'
      }],
      certifGridData: [],
      selectedRow: []
    }
  }
}
</script>
<style lang="scss" scoped>
.download-components {
  display: flex;
  justify-content: center;
  gap: 20px;
}
.network-certif-grid-table{
  &::v-deep .wj-row:hover {
    .file-svg,
    .file-svg * {
      fill: $purple-gray;
    }
  }
}
</style>
