<template>
  <section
    v-loading="isLoadingLicense"
    class="view-license"
  >
    <div class="package-license">
      <div class="package-license-sells">
        <status-badge
          v-for="version in versions"
          :key="version.version"
          v-bind="version"
        />
      </div>
      <!-- 버전별 -->
      <div class="package-license-types">
        <div class="package-license-types__inner">
          <div class="left">
            <div class="left-title">
              {{ $t('license.TEXT.purchaseType') }}
            </div>
            <div class="left-count">
              {{ licenses ? licenses.salesRate.type.purchase : 0 }}
            </div>
          </div>
          <!-- 구매형 -->
          <div class="separator" />
          <div class="right">
            <div class="right-title">
              {{ $t('license.TEXT.subscription') }}
            </div>
            <div class="right-count">
              {{ licenses ? licenses.salesRate.type.subscription : 0 }}
            </div>
          </div>
          <!-- 구독형 -->
        </div>
      </div>
      <!-- 유형별 -->
    </div>
    <license-grid
      v-if="licenses && sharedPackage.packageTypeList.length"
      :license="licenses.license"
      :license-type-map="packageTypeMap"
      @refresh="initAll"
      @refresh-by-filter="refreshByFilter"
    />
  </section>
</template>

<script>
import StatusBadge from '@/components/Package/License/StatusBadge.vue'
import LicenseGrid from '@/components/Package/License/LicenseGrid.vue'
import API from '@sd-fe/cmp-core'
import dayjs from 'dayjs'

export default {
  name: 'License',
  components: {
    StatusBadge,
    LicenseGrid
  },
  beforeRouteLeave (to, from, next) {
    if (to.path && to.path.endsWith('/package')) {
      this.$emit('leave-router')
      return
    }
    next()
  },
  inject: ['sharedPackage'],
  async created () {
    await this.initAll()
    this.setPackageTypeList()
  },
  methods: {
    async initAll () {
      await this.getAllLicense()
      this.initStatusBadgeData()
    },
    async refreshByFilter (filterForm) {
      await this.getAllLicense({ beginDate: filterForm.startDate, endDate: filterForm.endDate })
    },
    setPackageTypeList () {
      if (this.sharedPackage.packageTypeList && this.sharedPackage.packageTypeList.length) {
        this.sharedPackage.packageTypeList.forEach(packageType => {
          this.packageTypeMap[packageType.packageTypeIdx] = packageType
        })
      }
    },
    async getAllLicense (params) {
      try {
        const { data } = await API.license.getLicenseList(params)
        this.licenses = data

        if (this.licenses) {
          this.licenses.license.sort((a, b) => {
            const convertDate = (date) => {
              return dayjs(date).toDate().getTime()
            }

            const first = convertDate(a.createTime)
            const end = convertDate(b.createTime)

            if (first > end) return -1
            else if (first < end) return 1
            return 0
          })
        }
      } catch (error) {
        console.error(error)
        this.$alert('라이선스 정보 받아오기 실패')
      } finally {
        this.isLoadingLicense = false
      }
    },
    initStatusBadgeData () {
      const types = Object.keys(this.licenses.salesRate.version)
      const versions = []

      types.forEach(type => {
        versions.push({
          version: type,
          count: this.licenses.salesRate.version[type]
        })
      })

      this.versions = versions
    }
  },
  data: () => ({
    isLoadingLicense: true,
    licenses: null,
    versions: [{
      version: 'plus',
      count: 0
    },
    {
      version: 'basic',
      count: 0
    },
    {
      version: 'standard',
      count: 0
    },
    {
      version: 'enterprise',
      count: 0
    }],
    packageTypeMap: {}
  })
}
</script>

<style lang="scss" scoped>
.view-license {
  .package-license {
    display: flex;
    width: 100%;

    &-sells {
      display: flex;
      margin-right: 35px;

      > * + * {
        margin-left: $gap;
      }
    }

    &-types {
      height: 66px;
      width: 100%;
      display: flex;
      background-color: $dark-slate;
      border-radius: 6px;

      &__inner {
        display: flex;
        align-items: center;
        width: 100%;
        padding: 25px 50px 25px 40px;

        & .separator {
          height: 30px;
          width: 1px;
          background-color: $dark-gray;
          margin: 0 50px;
        }

        & .left,
        & .right {
          display: flex;
          align-items: center;
          width: 100%;
          justify-content: space-between;

          &-title {
            font-size: 16px;
          }

          &-count {
            font-size: 30px;
            color: $main-blue;
          }
        }
      }
    }
  }
}
</style>
