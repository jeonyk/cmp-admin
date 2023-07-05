<!--
  * 파일명 : TaskCommonList.vue
  * 파일 기능 : 사전협의에 넘어온 모든 데이터를 리스트 형태로 보여줍니다.
  * 작성자 : 정재은 외 2명
  * 최종 작성일 : 2021-02-26
  * License By Shinsegae I&C
  * 2021-02-26 Update: 사전협의 목록보기 / 티켓보기 페이징 처리 완료
 -->

<template>
  <div class="task-conference-list">
    <article class="task-todo-list">
      <!-- Filter: 관계사 -->
      <resource-filter-component
        ref="filterComponent"
        @search="newFilter"
        :cloud-type="cloudType.toLowerCase()"
        only-active-project
        @reset="() => resetFilters()"
      >
        <div class="filtering-list">
          <span class="filter-name">{{ $v('분류') }}</span>
          <div class="filter-options">
            <!-- v-model="selectedFilter.orderTypeKor" -->
            <el-select
              v-model="selectedOrderType"
              :placeholder="$t('common.BTN.select')"
              :popper-append-to-body="false"
              @change="filterHandler(), resetCurrPageNum()"
            >
              <el-option
                v-for="item in filteringOptions.orderTypeKor"
                :key="item.groupIdx"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </div>
        </div>

        <!-- 완료 희망일 -->
        <div class="filter-form">
          <span class="filter-name">{{ $v('완료희망일') }}</span>
          <div class="filter-date">
            <el-date-picker
              v-model="selectedDate.start"
              type="date"
              :clearable="false"
            />
            <span class="date-line">~</span>
            <el-date-picker
              v-model="selectedDate.end"
              type="date"
              :clearable="false"
            />
          </div>
        </div>
      </resource-filter-component>

      <!-- <filtering-component
        @reset-data="resetData(), resetCurrPageNum()"
        v-loading="loading.filter"
      >
        <div class="filtering-list">
          <span class="filter-name">{{ $v('관계사') }}</span>
          <div class="filter-options">
            <el-select
              v-model="selectedFilter.company"
              :placeholder="$t('common.BTN.select')"
              :popper-append-to-body="false"
              @change="filterHandler(), resetCurrPageNum()"
            >
              <el-option
                v-for="item in filteringOptions.relCorp"
                :key="item.groupIdx"
                :label="item.groupName"
                :value="item.groupIdx"
              />
            </el-select>
          </div>
        </div>

        <div class="filtering-list">
          <span class="filter-name">{{ $v('처리 상태') }}</span>
          <div class="filter-options">
            <el-select
              v-model="selectedFilter.workState"
              :placeholder="$t('common.BTN.select')"
              :popper-append-to-body="false"
              @change="filterHandler(), resetCurrPageNum()"
            >
              <el-option
                v-for="item in filteringOptions.workState"
                :key="item.groupIdx"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </div>
        </div>

        <div class="filtering-list">
          <span class="filter-name">{{ $v('분류') }}</span>
          <div class="filter-options">
            <el-select
              v-model="selectedFilter.orderTypeKor"
              :placeholder="$t('common.BTN.select')"
              :popper-append-to-body="false"
              @change="filterHandler(), resetCurrPageNum()"
            >
              <el-option
                v-for="item in filteringOptions.orderTypeKor"
                :key="item.groupIdx"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </div>
        </div>
      </filtering-component> -->
    </article>
    <!-- /. 필터링 -->

    <section
      class="conference-list-contents"
      v-loading="loading.task"
    >
      <task-view-type-component @changeView="changeListType" />

      <template v-if="viewList === 'ticket'">
        <new-common-ticket-list
          is-conf
          :data="taskData"
          :process="false"
          @select-item="selectItem"
        />
      </template>
      <!-- /. 티켓으로 보기 -->

      <template v-else>
        <total-count :total-count="totalResultCnt" />

        <cmp-grid
          :item-source="taskData"
          :columns="tableColumns"
          :header-merge="headerMergeColumns"
          @selectedRow="param => selectItem(param.dataItem)"
          selectable
          paging-type="pagination"
          class="overflow-visible-grid"
          :column-data-map="columnDataMap"
          @total-count="cnt => totalResultCnt = cnt"
          @changingPage="gridChangePage"
          page-keeping
        >
          <template #orderTypeKor="{row}">
            <span
              class="type"
              :class="{'urgent' : row.orderTypeKor === $v('긴급')}"
            >
              {{ row.orderTypeKor === $v('긴급') ? $v('긴급') : $v('일반') }}
            </span>
          </template>
          <template #approvalTitle="{row}">
            <div>
              <span
                v-show="row.orderTypeKor !== $v('긴급')"
                class="type"
              >
                {{ row.orderTypeKor }}
              </span>

              {{ row.approvalTitle }}
            </div>
          </template>
          <template #expectedDay="{row }">
            <div>
              {{ row.expectedDay }}
              <cmp-status-tag
                :class="['-status', `${row.isDelayed ? 'is-delay' : 'is-wait'}`]"
                :type="row.isDelayed ? 'is-delay' : 'is-wait'"
              >
                {{ row.delayedTime }}
              </cmp-status-tag>
            </div>
          </template>
          <template #amount="{row}">
            <div>
              <el-tooltip
                placement="top"
                effect="light "
              >
                <div slot="content">
                  <ul>
                    <li
                      v-for="role in displayRoles(row.workRsps)"
                      :key="role.roleName"
                    >
                      {{ role.roleName }} : ({{ role.serviceCount }})
                    </li>
                  </ul>
                </div>
                <div>
                  {{ row.amount }}
                </div>
              </el-tooltip>
            </div>
          </template>

          <!-- <template #state="props">
            <span :class="[`is-${status[props.row.state].color}`, '-status']">
              {{ props.row.taskStatus }}
            </span>
          </template> -->
          <!-- <template #serverCount="{row}">
            <span>
              {{ row.serverCount + 'EA' }}
            </span>
          </template> -->
          <!-- <template #networkCount="{row}">
            <span>
              {{ row.networkCount + 'EA' }}
            </span>
          </template> -->
          <!-- <template #securityCount="{row}">
            <span>
              {{ row.securityCount + 'EA' }}
            </span>
          </template> -->
        </cmp-grid>
      </template>
    </section>

    <!-- [Public] 프로젝트 생성 모달 -->
    <aws-project-modal
      :active="publicProjectModal.view"
      :data="publicProjectModal.item"
      @close="activePublicProject({}, false)"
      @call="init()"
    />
  </div>
</template>

<script src="./TaskCommonList.script"></script>

<style lang="scss" scoped>
.type {
  display: inline-block;
  color: #fff;
  padding: 0px 10px;
  height: 22px;
  line-height: 22px;
  background-color: #39394b;
  font-size: 12px;
  border-radius: 10px;
  margin-right: 10px;
  &.urgent {
    background:#CF494D;
  }
}
</style>
