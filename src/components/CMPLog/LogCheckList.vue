<template>
  <div class="log-check">
    <span
      v-loading="isDownloading"
      element-loading-text="로그 압축 파일 생성중..."
    >
      <div class="log-check-date">
        <label>{{ $t("license.TEXT.date") }}</label>
        <el-date-picker
          v-model="datePicker"
          type="daterange"
          range-separator="~"
          popper-class="date-popper-log-check"
          :picker-options="pickerOptions"
          start-placeholder="시작일"
          end-placeholder="종료일"
          :disabled="isDownloading"
        />
      </div>
      <div class="log-check-list">
        <el-checkbox
          v-model="modules[mod]"
          v-for="mod in moduleKeys"
          :key="mod"
          :disabled="isDownloading"
          class="module-checkbox"
        >
          {{ mod }}
        </el-checkbox>
      </div>
    </span>
    <div class="log-check-download">
      <button
        class="button"
        type="is-primary"
        size="is-large"
        @click="toggleAllSelect"
        :disabled="isDownloading"
      >
        {{
          isAllSelected
            ? $t("common.BTN.allUnSelect")
            : $t("common.BTN.allSelect")
        }}
      </button>
      <button
        v-if="isDownloading"
        class="button"
        type="is-primary"
        size="is-large"
        @click="cancelLogDownload"
      >
        {{ `${$t("common.BTN.download")} ${$t("common.BTN.cancel")}` }}
      </button>
      <button
        v-else
        class="button"
        type="is-primary"
        size="is-large"
        @click="downloadModuleLog"
        :disabled="!checkedModules.length || !isSetDate"
      >
        {{ $t("common.BTN.download") }}
      </button>
    </div>
  </div>
</template>

<script>
import dayjs from 'dayjs'
import { mapGetters } from 'vuex'
import axios from 'axios'

const CancelToken = axios.CancelToken
const BASE_URL = process.env.VUE_APP_ZUUL_URL

export default {
  name: 'LogCheckList',
  computed: {
    ...mapGetters({ packageType: 'packageType' }),
    formatDate () {
      if (this.datePicker) {
        return [
          dayjs(this.datePicker[0]).format('YYYY-MM-DD'),
          dayjs(this.datePicker[1]).format('YYYY-MM-DD')
        ]
      } else {
        return null
      }
    },
    moduleKeys () {
      return Object.keys(this.modules)
    },
    checkedModules () {
      return this.moduleKeys.filter(key => this.modules[key])
    },
    isAllSelected () {
      return this.moduleKeys.length === this.checkedModules.length
    },
    isSetDate () {
      return this.formatDate
        ? !!(this.formatDate[0] && this.formatDate[1])
        : null
    }
  },
  created () {
    this.source = CancelToken.source()
    this.datePicker[0] = new Date(dayjs().subtract(7, 'day'))

    if (this.packageType === 'PL') {
      delete this.modules['cmp-network']
    }
    if (this.packageType !== 'ENT') {
      delete this.modules['cmp-aws']
    }
  },
  beforeDestroy () {
    this.source.cancel()
  },
  methods: {
    async downloadLog (body, token) {
      const res = await axios.post(BASE_URL + '/system/log/download', body, {
        cancelToken: token
      })
      return res
    },
    toggleAllSelect () {
      if (!this.isAllSelected) {
        this.moduleKeys.forEach(key => (this.modules[key] = true))
      } else {
        this.moduleKeys.forEach(key => (this.modules[key] = false))
      }
    },
    cancelLogDownload () {
      this.source.cancel()
      this.isDownloading = false
      this.source = CancelToken.source()
      this.downloadPercentage = 0
      this.$alert(this.$t('common.ALERT.BASE.072'))
    },
    async downloadModuleLog () {
      try {
        this.isDownloading = true

        const body = {
          moduleNameList: [...this.checkedModules],
          startTime: this.formatDate[0],
          endTime: this.formatDate[1]
        }

        const res = await this.downloadLog(body, this.source.token)
        if (!res || !res.data || !res.data.result) return
        const { data } = res
        const downloadUrl = BASE_URL + '/system/log/download?fileName=' + data.fileName
        const link = document.createElement('a')
        link.href = downloadUrl
        link.click()
      } catch (error) {
        if (error.__CANCEL__) return
        if (error.response && error.response.data.code === 'ZUUL0001') {
          this.$alert('다운로드 가능한 로그가 존재하지 않습니다.')
        } else {
          this.$alert(this.$t('common.ALERT.BASE.028'))
        }
      } finally {
        this.isDownloading = false
      }
    }
  },
  data: () => ({
    datePicker: [new Date(), new Date()],
    pickerOptions: {
      disabledDate (value) {
        const calendarDay = new Date(value)
        return calendarDay.getTime() > new Date().getTime()
      }
    },
    isDownloading: false,
    modules: {
      'cmp-alarm': false,
      'cmp-billing': false,
      'cmp-config': false,
      'cmp-iam': false,
      'cmp-license': false,
      'cmp-metering': false,
      'cmp-network': false,
      'cmp-nutanix': false,
      'cmp-sw': false,
      'cmp-work': false,
      'cmp-zuul': false,
      'cmp-aws': false
    },
    source: null
  })
}
</script>

<style lang="scss" scoped>
.log-check {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;

  &-date {
    & label {
      margin-right: $gap;
      font-size: 14px;
    }

    .el-date-editor {
      background-color: transparent;
      border: none;
      border-bottom: 1px solid $purple-gray;

      &::v-deep {
        & > *:not(:last-child) {
          color: $white;
        }

        .el-range-input {
          background-color: transparent;

          &::placeholder {
            color: $input-placeholder;
          }
        }
      }
    }
  }

  &-list {
    padding: 30px 0;
    margin: 50px 0 25px 0;
    border-top: 1px solid $purple-gray;
    border-bottom: 1px solid $purple-gray;
    width: 700px;
    text-align: left;

    & > .module-checkbox {
      display: block;

      &:not(:last-of-type) {
        margin-bottom: $gap;
      }

      &::v-deep {
        .el-checkbox__label {
          display: inline-block;
          position: relative;
          top: -3px;
        }
      }
    }
  }

  &-download {
    & > :first-child {
      margin-right: $gap-s;
    }
  }
}
</style>
