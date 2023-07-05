<template>
  <div
    v-loading="isLoadingAudit"
    class="audit"
  >
    <div class="audit-filter">
      <div class="audit-filter__option">
        <i class="mdi mdi-tune" />
        <span>
          {{ $t("common.PLACEHOLDER.searchSet") }}
        </span>
        <i
          class="mdi mdi-refresh reset-button"
          @click="resetFilter"
        />
      </div>
      <template v-for="filterItem in filtering">
        <div
          v-if="!filterItem.type"
          :key="filterItem.displayName"
          class="audit-filter__item"
          :class="filterItem.customClass"
        >
          <label :for="filterItem.binding">
            {{ filterItem.displayName }}
          </label>
          <el-input
            v-model="filterItem.binding"
            :name="filterItem.binding"
            :placeholder="filterItem.displayName"
            @keypress.native.enter="searchFilter"
          />
        </div>
        <div
          class="audit-filter__item date"
          :class="{ mrg: filterItem.keyName === 'startTime' }"
          v-else
          :key="filterItem.displayName"
        >
          <label>{{ filterItem.displayName }}</label>
          <el-date-picker
            v-model="filterItem.binding"
            @input="onChangeDateFilter"
            type="datetimerange"
            range-separator="~"
            popper-class="date-popper-log-check"
            :placeholder="filterItem.displayName"
            :picker-options="pickerOptions"
            :start-placeholder="` ${$t('common.GRID.NETWORK.startDate')} `"
            :end-placeholder="$t('common.REGCON.endTime')"
          />
        </div>
      </template>
      <button
        class="button search-button"
        type="is-primary"
        @click="searchFilter"
      >
        {{ $t("common.PLACEHOLDER.search") }}
      </button>
    </div>
    <div class="audit-grid">
      <div class="audit-grid-total">
        {{ $t("common.TERMS.totalCount", { count: totalCount }) }}
      </div>
      <cmp-grid
        ref="auditGrid"
        :columns="columns"
        :item-source="auditData"
        :total-page-size="totalCount"
        :server-side-now-page="currPage"
        :use-column-filter="false"
        server-side-paging
        @changingPage="onChangePage"
        routable="cmp-audit-detail"
      >
        <template #userId="{ row }">
          {{ row.userId | maskingName }}
        </template>
        <template #createTime="{ row }">
          {{ row.createTime | date("YYYY-MM-DD HH:mm:ss") }}
        </template>
      </cmp-grid>
    </div>
  </div>
</template>

<script>
import columns from './AuditGrid.columns'
import dayjs from 'dayjs'
import API from '@sd-fe/cmp-core'

export default {
  name: 'AuditList',
  created () {
    if (this.$route.query) {
      const { p, id, name, ip, start, end } = this.$route.query

      this.currPage = parseInt(p) || 1
      this.startTime = start || null
      this.endTime = end || null
      this.filtering.find(item => item.keyName === 'date').binding = [
        new Date(start) || null,
        new Date(end) || null
      ]
      this.filtering.find(item => item.keyName === 'userId').binding = id || null
      this.filtering.find(item => item.keyName === 'userName').binding = name || null
      this.filtering.find(item => item.keyName === 'ip').binding = ip || null
    }

    this.loadAudit()
  },
  computed: {
    userId () {
      return this.filtering.find(item => item.keyName === 'userId')
    },
    userName () {
      return this.filtering.find(item => item.keyName === 'userName')
    },
    ip () {
      return this.filtering.find(item => item.keyName === 'ip')
    },
    // searchKeyword () {
    //   return this.filtering.find(item => item.keyName === 'searchWord')
    // },
    isSetFilter () {
      return (
        this.userId.binding ||
        this.userName.binding ||
        this.ip.binding ||
        // this.searchKeyword.binding ||
        (this.startTime && this.endTime)
      )
    }
  },
  methods: {
    onChangeDateFilter () {
      const date = this.filtering.find(item => item.keyName === 'date')
      this.startTime = date.binding ? dayjs(date.binding[0]).format('YYYY-MM-DD HH:mm:ss') : ''
      this.endTime = date.binding ? dayjs(date.binding[1]).format('YYYY-MM-DD HH:mm:ss') : ''
    },
    resetFilter () {
      this.filtering.forEach(item => {
        if (item.keyName !== 'date') item.binding = ''
        else item.binding = []
      })
      this.currPage = 1
      this.startTime = null
      this.endTime = null
      this.loadAudit()
    },
    searchFilter () {
      if (this.isSetFilter) this.currPage = 1
      this.loadAudit()
    },
    /**
     * 표준시로 변환
     */
    convertDate (date) {
      return date ? dayjs(date).subtract(9, 'hours').format('YYYY-MM-DD HH:mm:ss') : null
    },
    async loadAudit () {
      try {
        this.isLoadingAudit = true

        this.$router.replace({
          query: {
            id: this.userId.binding || undefined,
            name: this.userName.binding || undefined,
            ip: this.ip.binding || undefined,
            p: this.currPage || 1,
            start: this.startTime || undefined,
            end: this.endTime || undefined
          }
        }).catch(() => {})

        const { data } = await API.audit.getAudit({
          userId: this.userId.binding || null,
          userName: this.userName.binding || null,
          ip: this.ip.binding || null,
          // searchWord: this.searchKeyword.binding || null,
          startTime: this.convertDate(this.startTime) || null,
          endTime: this.convertDate(this.endTime) || null,
          nowPage: this.currPage,
          perPage: this.perPage
        })

        this.totalCount = data.totalCount
        this.auditData = data.auditList.map(audit => ({ ...audit, userName: !audit.userName ? '' : decodeURIComponent(audit.userName) }))
      } catch (error) {
        console.log(error)
      } finally {
        this.isLoadingAudit = false
      }
    },
    onChangePage (page) {
      this.currPage = page
      this.loadAudit()
    }
  },
  data: root => ({
    columns: columns(root),
    isLoadingAudit: true,
    auditData: [],
    totalCount: 0,
    currPage: 1, // 현재 페이지
    perPage: 10, // 페이지 당 보여줄 아이템 갯수
    startTime: null,
    endTime: null,
    filtering: [
      {
        binding: '',
        displayName: root.$t('admin.NOTI.employeeNumber'),
        keyName: 'userId',
        customClass: root.$i18n.locale === 'en' ? 'emp-num' : ''
      },
      {
        binding: '',
        displayName: root.$t('common.REGCON.name'),
        keyName: 'userName'
      },
      {
        binding: '',
        displayName: 'IP',
        keyName: 'ip'
      },
      // {
      //   binding: '',
      //   displayName: root.$t('admin.AUDIT.searchWord'),
      //   keyName: 'searchWord'
      // },
      {
        binding: [],
        displayName: root.$t('admin.AUDIT.searchDate'),
        keyName: 'date',
        type: 'date'
      }
    ],
    pickerOptions: {
      disabledDate (value) {
        const calendarDay = new Date(value)
        return calendarDay.getTime() > new Date().getTime()
      }
    }
  })
}
</script>

<style lang="scss" scoped>
.audit {
  &-filter {
    display: flex;
    flex-wrap: wrap;

    &__option {
      width: 100%;
      margin-bottom: $gap-s;
      padding: 0 $gap-s;
      display: flex;
      align-items: center;

      & > .mdi {
        margin-right: $gap-s;

        &.reset-button {
          transform: translateY(-2px);
          margin-left: $gap-s;
          color: #999;
          cursor: pointer;
          transition: 0.5s ease;
          &::before {
            transition: 0.5s ease;
            font-size: 18px;
          }
          &:hover {
            transform: rotate(180deg);
            &::before {
              color: $white;
            }
          }
        }
      }
    }

    &__item {
      display: flex;
      flex-wrap: nowrap;
      align-items: center;
      margin: 0 5px;
      flex: 0 0 220px;

      label {
        white-space: pre;
        margin-right: $gap-s;
      }

      &.emp-num {
        flex: 1 0 200px;
      }

      &.mrg {
        margin-left: $gap-m;
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

      .el-input {
        &::v-deep {
          .el-input__inner {
            border: none;
            border-bottom: 1px solid $purple-gray;
          }
        }
      }
    }

    .search-button {
      margin-left: $gap;
    }
  }

  &-grid {
    margin: $gap-m 0;

    &-total {
      padding: 0 0 $gap $gap-s;
    }
  }
}
</style>
