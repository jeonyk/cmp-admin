<template>
  <div class="set-resource-certification-detail">
    <dashboard-panel
      :title="$v('설정 정보')"
      :padding-top="0"
      class="product-info -default"
    >
      <vertical-table
        class="product-table"
        :columns="columns"
        :data="certifData"
        type="horizontal"
      >
        <template #publicKeySize="props">
          {{ props.row.publicKeySize }}
        </template>
      </vertical-table>
    </dashboard-panel>
  </div>
</template>

<script>
import API, { DashboardPanel } from '@sd-fe/cmp-core'
export default {
  components: {
    DashboardPanel
  },
  created () {
    this.$store.commit('common/ADD_PARAMETERS', {
      label: this.$route.params.certName,
      path: ''
    })
    this.setCertificationDetail()
  },
  methods: {
    async setCertificationDetail () {
      const payload = this.$route.params
      const res = await this.getCertificationDetail(payload)

      const { commonName, issuerName } = extractCommonNameAndIssuerName(res.issuer)

      // 문자열에서 IssuerName 과 CommonName 반환
      function extractCommonNameAndIssuerName (certString) {
        const fields = certString.split(',')
        let commonName = ''
        let issuerName = ''

        fields.forEach(field => {
          const [key, value] = field.split('=')

          if (key === 'CN') {
            commonName = value
          } else if (key === 'O') {
            issuerName = value
          }
        })

        return { commonName, issuerName }
      }

      this.certifData = { ...res, commonName, issuerName }
    },
    async getCertificationDetail ({ netIdx, certName }) {
      try {
        const payload = {
          netIdx, certName
        }
        const response = await API.network.getCertificationDetail(payload)
        console.log('🚀 ~ file: SetResourceSwitchCertificationDetail.vue:36 ~ getCertificationDetail ~ response:', response)
        return response
      } catch (error) {
        const msg = this.$v('인증서 상세조회를 실패하였습니다. </br>관리자에게 문의해주세요.')
        this.$alert(msg, { dangerouslyUseHTMLString: true })
        console.error(error)
      }
    }

  },
  data () {
    return {
      columns: [
        { binding: 'certName', header: 'Name' },
        { binding: 'commonName', header: 'Common Name' },
        { binding: 'issuerName', header: 'Issuer Name' },
        { binding: 'status', header: 'Status' },
        { binding: 'serialNo', header: 'Serial No.' },
        { binding: 'signatureAlgorithm', header: 'Signature Algorithm' },
        { binding: 'validFrom', header: 'Valid From' },
        { binding: 'validTo', header: 'Valid to' },
        { binding: 'publicKeyAlgorithm', header: 'Public Key Algorithm' },
        { binding: 'publicKeySize', header: 'Public Key Size', customHtml: true },
        { binding: 'issuer', header: 'Issuer' },
        { binding: 'subject', header: 'Subject' }
      ],
      certifData: {}
    }
  }

}
</script>

<style lang="scss">

</style>
