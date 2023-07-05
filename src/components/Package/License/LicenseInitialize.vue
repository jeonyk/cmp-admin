<template>
  <div class="license-initialize">
    <div class="license-initialize-text">
      {{ $t('license.PLACEHOLDER.upload') }}
    </div>
    <div class="license-initialize-btn">
      <el-upload
        v-loading="isLoadingUpload"
        action=""
        :auto-upload="false"
        :on-change="onChangeFile"
        accept="text/plain"
        :show-file-list="false"
      >
        <button
          class="button"
          type="is-primary"
        >
          {{ $t('license.TEXT.uploadKey') }}
        </button>
      </el-upload>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import API from '@sd-fe/cmp-core'

export default {
  name: 'LicenseInitialize',
  computed: {
    ...mapGetters({
      licenseInitialized: 'getLicenseInitialized'
    })
  },
  watch: {
    licenseInitialized (init) {
      console.log(init)
    }
  },
  methods: {
    async onChangeFile (file) {
      this.isLoadingUpload = true

      const form = new FormData()
      form.append('file', file.raw)

      try {
        await API.license.uploadLicenseKey(form)
        this.$alert('라이선스 키를 정상적으로 업로드 하였습니다.', {
          callback: () => {
            window.location.href = '/'
          }
        })
      } catch (error) {
        if (error.response && error.response.data.code) {
          switch (error.response.data.code) {
            case 'LIC011':
              return this.$alert('라이선스 복호화에 실패하였습니다.\n라이선스 키를 확인해주세요.', { dangerouslyUseHTMLString: true })
            case 'LIC013':
              return this.$alert('해당 라이선스가 만료되어 파일을 업로드 할 수 없습니다.')
            case 'LIC501':
              return this.$alert('파일을 읽는데 실패하였습니다.')
            case 'LIC502':
              return this.$alert('파일에서 데이터를 가져오는데 실패하였습니다.')
            case 'LIC503':
              return this.$alert('텍스트 파일이 아닙니다.\n업로드할 파일을 확인해주세요.', { dangerouslyUseHTMLString: true })
            case 'LIC505':
              return this.$alert('모듈을 복호화하는데 실패하였습니다.\n라이선스 파일을 확인해주세요.', { dangerouslyUseHTMLString: true })
            default:
              return this.$alert('파일 업로드에 실패하였습니다.')
          }
        } else {
          return this.$alert('파일 업로드에 실패하였습니다.')
        }
      } finally {
        this.isLoadingUpload = false
      }
    }
  },
  data: () => ({
    isLoadingUpload: false
  })
}
</script>

<style lang="scss" scoped>
.license-initialize {
  width: 100%;
  height: 600px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  border: 1px solid $purple-gray;
  border-radius: 6px;

  &-text {
    font-size: 15px;
  }

  &-btn {
    margin-top: $gap;
  }
}
</style>
