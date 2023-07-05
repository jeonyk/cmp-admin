<!--
  * 파일명 : ManageProject.vue
  * 파일 기능 : 구성관리 > 프로젝트 관리 > 프로젝트
  * 작성자 : 염창윤
  * 최종 작성일 : 2021-08-23
  * License By Shinsegae I&C
 -->

<template>
  <div class="set-project">
    <div
      class="set-project-body"
      v-loading="loading.delete"
    >
      <!-- 관계사 - 조직 (프로젝트 수) -->
      <dashboard-panel
        class="body-panel -left"
        :title="$t('admin.ORG.affOrgCount')"
        :padding-top="0"
      >
        <template #header>
          <div class="button-area -right">
            <button
              class="button"
              type="is-primary"
              @click="orgChrtModalShow = true"
            >
              <!-- 조직도 -->
              {{ $t('common.MODAL.orgChart') }}
            </button>
          </div>
        </template>

        <div class="company-area">
          <select-group-dropdown
            v-loading="loading.groupTree"
            ref="companyDropdown"
            class="company-area__dropdown"
            :class="{ '-is-selected': selectedCompany !== null }"
            trigger-mode="click"
            placement="bottom"
            :popper-offset="0"
            @select-item="param => {
              selectItem(param)
              resetSelectedOrg()
            }"
            @searchInputChange="searchInputChange"
            @open="menuOpened = !menuOpened"
            @close="menuOpened = !menuOpened"
            custom-template
            :placeholder-prefix="$t('common.TERMS.rel')"
          >
            <!-- :data-source="filteredCompanyList" -->
            <div
              :class="['dropdown__button', { '-menu-opened': menuOpened }]"
            >
              <!-- 관계사 선택 -->
              {{ selectedCompany ? selectedCompany : $t('admin.ACCOUNT.selectAff') }}
              <i
                :class="{ '-rotate': menuOpened }"
                class="el-icon-arrow-down el-icon--right"
              />
            </div>
            <template #custom>
              <div
                v-for="(item, idx) in filteredCompanyList"
                :key="idx"
                class="ti-dropdown-item-value__item no-group"
                @click="$refs.companyDropdown.clickItem(item)"
              >
                <!-- {{ `${item.groupName} (조직 ${item.orgNum}개 / 프로젝트 ${item.prjNum}개)` }} -->
                {{ `${item.groupName} (${$t('common.TERMS.group')} ${item.orgNum}${$i18n.locale === 'ko' ? '개' : 'EA'} / ${$t('common.TERMS.project')} ${item.prjNum}${$i18n.locale === 'ko' ? '개' : 'EA'})` }}
              </div>
            </template>
          </select-group-dropdown>
          <div
            v-if="treeData.length > 0"
            class="company-area__folder"
            :class="{ '-public': cloudType === 'public' }"
          >
            <fold-company-group
              ref="folderGroup"
              :tree-data="treeData"
              :cloud-type="cloudType"
              :max-height="cloudType === 'public'
                ? '600px' : '510px'"
              @change="selectOrg"
            />
          </div>
          <div
            v-else
            class="company-area__folder -empty"
            :class="{ '-public': cloudType === 'public' }"
          >
            <!-- {{ selectedCompany ? '하위 조직이 없습니다.' : '관계사를 선택해주세요.' }} -->
            {{ selectedCompany ? $t('common.ALERT.PROJECT.062') : $t('common.ALERT.PROJECT.008') }}
          </div>
        </div>
      </dashboard-panel>

      <dashboard-panel
        v-loading="pjDetailLoading || loading.isUpdatingKey"
        class="body-panel -right"
        :class="{'-public': cloudType === 'public'}"
        :padding-top="0"
      >
        <template v-if="cloudType === 'private'">
          <div
            slot="header"
            class="button-area -right"
          >
            <button
              v-if="selectedPrj"
              :disabled="selectedPrj.projectStatus === 0"
              class="button"
              type="is-anti"
              @click="deleteProject"
            >
              <!-- 삭제 -->
              {{ $t('common.BTN.delete') }}
            </button>
            <button
              v-if="selectedPrj"
              :disabled="selectedPrj.projectStatus === 0 || selectedPrj.projectStatus === 1"
              class="button"
              type="is-primary"
              @click="projectModalOpen('change')"
            >
              <!-- 변경 -->
              {{ $t('common.BTN.change') }}
            </button>
            <button
              class="button"
              type="is-primary"
              @click="projectModalOpen('create')"
            >
              <!-- 프로젝트 생성 -->
              {{ $t('common.BTN.ADMIN.newProject') }}
            </button>
          </div>
        </template>
        <div
          v-if="selectedOrg && projectList.length > 0"
          class="project-area"
          :style="{
            height: cloudType === 'public' ? '710px' : '580px',
            gridTemplateRows: cloudType === 'public' ? '50px 660px' : '50px 530px'
          }"
        >
          <div class="project-area__header -left">
            <!-- 프로젝트 -->
            {{ $t('common.TERMS.project') }}
          </div>
          <div class="project-area__header -right">
            <!-- 프로젝트 상세 -->
            {{ $t('common.BTN.ADMIN.detailProject') }}
          </div>
          <div
            ref="projectAreaBodyLeft"
            class="project-area__body -left"
          >
            <ul>
              <li
                v-for="(prj, idx) in projectList"
                :key="prj.projectIdx"
                :class="{ '-selected': selectedPrj ? prj.projectIdx === selectedPrj.projectIdx : idx === 0 }"
                @click="selectProject(prj)"
              >
                <cmp-status-tag
                  class="__tag"
                  :contents="prj.inCommon ? $t('config.PROJECT.common') : $t('config.PROJECT.general')"
                  :line-style="true"
                />
                <div
                  class="__name"
                  @mouseover="e => isEllipsisActive(e, prj)"
                >
                  <span
                    class="tag is-waiting"
                    v-if="prj.projectStatus <= 0"
                  >[승인대기]</span>

                  <span
                    class="tag is-deleting"
                    v-if="prj.projectStatus >= 3"
                  >[삭제대기]</span>

                  <el-tooltip
                    v-if="prj.ellipsisActive"
                    :content="prj.projectName"
                    effect="light"
                    placement="top"
                  >
                    <span>{{ prj.projectName }}</span>
                  </el-tooltip>
                  <span v-else>{{ prj.projectName }}</span>
                </div>
              </li>
            </ul>
          </div>
          <div class="project-area__body -right">
            <div class="project-area__body__inner -left tiny-scroll">
              <ul>
                <li>
                  <!-- 프로젝트 소유자 -->
                  {{ $t('common.REGCON.projectOwner') }}
                </li>
                <li>
                  <!-- 프로젝트 초대 -->
                  {{ $t('common.REGCON.invitedProject') }}
                </li>
                <li>
                  <!-- 생성일 -->
                  {{ $t('common.GRID.createDate') }}
                </li>
                <li
                  v-if="cloudType === 'public'
                    && selectedPrj && selectedPrj.accessKey && selectedPrj.secretKey"
                  style="margin-bottom: 150px;"
                >
                  <!-- 계정정보 -->
                  계정정보
                </li>
                <li>
                  <!-- 히스토리 -->
                  {{ $t('meter.history') }}
                </li>
              </ul>
            </div>
            <div
              v-if="selectedPrj"
              class="project-area__body__inner -right"
            >
              <ul>
                <li>
                  <span v-if="selectedPrj.projectOwner">
                    {{ selectedPrj.projectOwner.userName ? selectedPrj.projectOwner.userName : '-' }}
                    {{ selectedPrj.projectOwner.userId ? ` (${semiBlindId(selectedPrj.projectOwner.userId)})` : '' }}
                  </span>
                  <span v-else>-</span>
                </li>
                <li>
                  <!-- 프로젝트 소유자 -->

                  <!-- 총 {selectedPrj.inviteCount}명 -->
                  {{ $t('common.TERMS.totalPeople', {count: selectedPrj.inviteCount}) }}
                </li>
                <li>{{ selectedPrj.projectStatus > 0 ? changeHumanTime(selectedPrj.createTime): '승인대기' }}</li>
              </ul>

              <!-- [Public] ACCESS KEY -->
              <form
                v-if="cloudType === 'public'
                  && selectedPrj && selectedPrj.accessKey && selectedPrj.secretKey"
                class="access-key-form -reverse"
              >
                <div class="form-control">
                  <label
                    class="access-key-label"
                    for="access-key"
                  >Access Key</label>
                  <div style="position:relative;">
                    <el-input
                      v-model="accessKeyField"
                      ref="accessKeyRef"
                      :type="isMasked || isUpdatingKey ? 'password': 'text'"
                      :show-password="isUpdatingKey"
                      placeholder="Access key"
                      :disabled="!isUpdatingKey && !!selectedPrj.accessKey"
                    >
                      <i
                        v-if="!(isUpdatingKey || isMasked)"
                        slot="suffix"
                        @click.stop="copyText('accessKeyRef')"
                        @mousedown="changeColor"
                        class="mdi mdi-content-copy copy-icon"
                      />
                    </el-input>
                  </div>
                </div>
                <div class="form-control">
                  <label
                    class="access-key-label"
                    for="secret-access-key"
                  >Secret Access Key</label>
                  <div style="position:relative;">
                    <el-input
                      v-model="secretAccessKeyField"
                      ref="secretAccessKeyRef"
                      class="secret-access-key-input"
                      :type="isMasked || isUpdatingKey ? 'password': 'text'"
                      :show-password="isUpdatingKey"
                      placeholder="Secret Access Key"
                      :disabled="!isUpdatingKey && !!selectedPrj.secretKey"
                    >
                      <i
                        v-if="!(isUpdatingKey || isMasked)"
                        slot="suffix"
                        @click.stop="copyText('secretAccessKeyRef')"
                        @mousedown="changeColor"
                        class="mdi mdi-content-copy copy-icon"
                      />
                    </el-input>
                  </div>
                </div>
                <div style="display:flex; justify-content:flex-end; margin-top:10px;">
                  <div class="button-area">
                    <template>
                      <button
                        v-if="!isUpdatingKey"
                        class="button"
                        @click.prevent="() => {
                          isUpdatingKey = true
                          accessKeyField = ''
                          secretAccessKeyField = ''
                        }"
                      >
                        <!-- 변경 -->
                        {{ $t('common.BTN.change') }}
                      </button>
                      <button
                        v-if="isUpdatingKey"
                        class="button"
                        @click.prevent="() => {
                          isUpdatingKey = false
                          accessKeyField = selectedPrj.accessKey
                          secretAccessKeyField = selectedPrj.secretKey
                        }"
                      >
                        <!-- 취소 -->
                        {{ $t('common.BTN.cancel') }}
                      </button>
                      <button
                        v-if="isUpdatingKey"
                        class="button"
                        type="is-primary"
                        :disabled="!accessKeyField || !secretAccessKeyField"
                        @click.prevent="updateProjectKey"
                      >
                        <!-- 저장 -->
                        {{ $t('common.BTN.save') }}
                      </button>
                    </template>

                    <span
                      v-if="!isUpdatingKey"
                      class="divider"
                      style="background-color: #999;"
                    />

                    <template v-if="!isUpdatingKey">
                      <button
                        v-if="isMasked"
                        class="button"
                        type="is-primary"
                        @click.prevent="checkPasswordModal = true"
                      >
                        <!-- 조회 -->
                        {{ $t('common.BTN.view') }}
                      </button>

                      <button
                        v-else
                        class="button"
                        type="is-primary"
                        @click.prevent="maskKeys"
                      >
                        <!-- 감추기 -->
                        {{ $t('common.BTN.hidden') }}
                      </button>
                    </template>
                  </div>
                </div>
              </form>

              <div
                class="project-area__body__inner__history tiny-scroll"
                :style="{
                  height: cloudType === 'public' ? '310px' : '365px'
                }"
              >
                <ul class="history-content">
                  <li v-if="!selectedPrj.projectHistory || !selectedPrj.projectHistory.length">
                    <span>
                      <!-- 히스토리가 없습니다. -->
                      {{ $t('config.PROJECT.noHistory') }}
                    </span>
                  </li>
                  <template v-else>
                    <li
                      v-for="(hist, idx) in selectedPrj.projectHistory"
                      :key="idx"
                      class="-has-history"
                    >
                      <span>{{ changeHumanTime(hist.createTime) }}</span>
                      <div>
                        <p
                          v-if="hist.title && hist.title.indexOf('첨부') < 0"
                          class="title"
                        >
                          {{ hist.title }}
                        </p>
                        <p
                          v-if="(hist.previous && hist.current) && hist.title === '소유자 변경'"
                          class="cont"
                        >
                          {{ hist.previous | maskingNameHistory }} → {{ hist.current | maskingNameHistory }}
                        </p>
                        <p
                          v-else-if="hist.previous && hist.current"
                          class="cont"
                        >
                          {{ `${hist.previous} → ${hist.current}` }}
                        </p>

                        <div
                          v-if="hist.fileHistDto"
                          class="cont -with-file"
                        >
                          <span>
                            <!-- 첨부파일 : -->
                            {{ $t('common.TERMS.file') }}&nbsp;:&nbsp;
                          </span>
                          <file-down-component
                            class="file-down-comp"
                            :file-name="hist.fileHistDto.fileName"
                            @click="downloadFile(hist.fileHistDto)"
                          />
                        </div>
                      </div>
                    </li>
                  </template>
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div
          v-else
          class="project-area -empty"
          :style="{
            height: cloudType === 'public' ? '710px' : '580px'
          }"
        >
          <!-- {{ selectedOrg ? '프로젝트가 없습니다.' : '조직을 선택해주세요.' }} -->
          {{ selectedOrg ? $t('config.PROJECT.noProject') : $t('config.PROJECT.noGroup') }}
        </div>
      </dashboard-panel>
    </div>

    <!-- 조직도 모달. 단순 조회성 조직도. -->
    <el-dialog
      :title="$t('common.MODAL.orgChart')"
      :visible.sync="orgChrtModalShow"
      width="370px"
      top="15vh"
      class="organization-chart-modal"
    >
      <div
        class="side-tree-area tiny-scroll"
        style="min-height: 410px; max-height: 410px"
        v-loading="loading.groupTree"
      >
        <g-tree
          :data="allTreeData"
          :view-line="true"
          :selectable="false"
          ref="tree"
          :root-parent="hasRootGroup"
        >
          <template #title="{ node }">
            {{ node.groupName }}
          </template>
        </g-tree>
      </div>

      <div class="modal-button-area">
        <button
          class="button"
          type="is-primary"
          @click="orgChrtModalShow = false"
        >
          <!-- 확인 -->
          {{ $t('common.BTN.confirm') }}
        </button>
      </div>
    </el-dialog>
    <!-- :loading="treeDataLoading" -->

    <!-- 프로젝트 생성 및 변경 모달 -->
    <el-dialog
      v-loading="pjModalLoading || loading.fileUpload"
      :title="projectModalTitle"
      :visible.sync="showProjectModal[showProjectModal.mode]"
      class="project-modal"
      top="10vh"
      width="700px"
      @close="projectModalClose"
      :before-close="handleClose"
    >
      <section>
        <article class="modal-body">
          <register-contents
            :title="$t('config.PROJECT.projectType')"
            class="modal__project-type"
            required
          >
            <div class="input-sect">
              <el-radio-group
                v-model="projectModal.isCommon"
                :disabled="showProjectModal.mode === 'change'"
              >
                <el-radio :label="false">
                  <!-- 일반 -->
                  {{ $t('config.PROJECT.general') }}
                </el-radio>

                <el-radio
                  v-if="isViewCommonOption"
                  :label="true"
                >
                  <!-- 공통 -->
                  {{ $t('config.PROJECT.common') }}
                </el-radio>
              </el-radio-group>
            </div>
          </register-contents>
          <!-- /. 프로젝트 종류 -->

          <register-contents
            :title="$t('config.PROJECT.selectCompanyGroup')"
            class="modal__company"
            required
          >
            <div
              v-if="showProjectModal.mode === 'change' && !projectModal.isSelectMode"
              class="__select-company --change-mode"
            >
              <span>{{ selectedPrj.companyName + ' ' + (selectedPrj.groupName ? '> ' + selectedPrj.groupName : '') }}</span>
              <button
                v-if="user.userPermLevel === 0"
                class="button -modal-button"
                type="is-primary"
                @click="projectModal.isSelectMode = !projectModal.isSelectMode"
              >
                <!-- 관계사 및 조직 변경 -->
                {{ $t('config.PROJECT.changeCompanyGroup') }}
              </button>
            </div>
            <div
              v-else
              class="__select-company"
            >
              <select-group-dropdown
                ref="mdCompanyDropdown"
                class="__company"
                trigger-mode="click"
                placement="bottom"
                :popper-offset="0"
                @select-item="selectGroup(...arguments, 'company')"
                :data-source="allCompanyOptions"
                :placeholder-prefix="$t('common.TERMS.rel')"
              />
              <!-- 관계사 -->
              <select-group-dropdown
                ref="mdOrgDropdown"
                class="__organization"
                trigger-mode="click"
                placement="bottom"
                org-tooltip
                :popper-offset="0"
                @select-item="selectGroup(...arguments, 'organization')"
                :data-source="projectModal.organizationList"
                :placeholder-prefix="$t('common.TERMS.group')"
                :pre-items-text="$t('common.ALERT.PROJECT.008')"
                :no-items-text="$t('common.ALERT.PROJECT.062')"
              />
              <!-- 조직 -->
            </div>
            <div
              v-loading="loading.isGetGroupInfo"
              v-if="projectModal.midMngrList.length"
              class="__tags"
            >
              <el-tag
                v-for="item in projectModal.midMngrList"
                :key="item.userId"
                class="tag"
              >
                <span class="name">{{ `${$t('admin.ACCOUNT.middleManager')}(${item.managerType ? $t('admin.ORG.sub') : $t('admin.ORG.main')}) ${item.userName}` }}</span>
              </el-tag>
            </div>
          </register-contents>
          <!-- 관계사 및 조직 선택 -->

          <register-contents
            :title="$t('common.REGCON.projectOwner')"
            class="modal__owner"
            required
          >
            <p
              v-if="!projectModal.company.idx"
              class="-cp-unselected"
            >
              <!-- 관계사를 선택해주세요. -->
              {{ $t('common.ALERT.PROJECT.008') }}
            </p>
            <div
              v-else
              class="-cp-selected"
            >
              <el-tag
                v-if="projectModal.projectOwner"
                class="tag"
              >
                <span class="name">{{ projectModal.projectOwner.tag }}</span>
              </el-tag>
              <button
                class="button -modal-button"
                type="is-primary"
                @click="openManagerModal"
              >
                <!-- 소유자 변경 -->
                {{ projectModal.projectOwner ? $t('config.PROJECT.changeProjectOwner') : $t('config.PROJECT.selectProjectOwner') }}
              </button>
            </div>
          </register-contents>
          <!-- 프로젝트 소유자 -->

          <register-contents
            :title="$t('common.GRID.projectName')"
            class="modal__project-name"
            required
          >
            <p
              v-if="!projectModal.company.idx"
              class="-cp-unselected"
            >
              <!-- 관계사를 선택해주세요. -->
              {{ $t('common.ALERT.PROJECT.008') }}
            </p>
            <template
              v-else
            >
              <div class="__input-pj-name">
                <el-input
                  :placeholder="$t('common.ALERT.PROJECT.063')"
                  v-model="projectModal.projectName"
                  @input="projectModal.availablePrjName = null"
                  @keydown.native.enter="() => {
                    if(!projectModal.projectName || !projectModal.projectName.trim()) return
                    checkReduplication()
                  }"
                  class="__input"
                />
                <button
                  class="button -modal-button"
                  type="is-primary"
                  @click="e => checkReduplication()"
                  :disabled="!projectModal.projectName || !projectModal.projectName.trim()"
                >
                  <!-- 중복 확인 -->
                  {{ $t('config.PROJECT.doubleCheck') }}
                </button>
              </div>
              <template
                v-if="projectModal.availablePrjName !== null"
              >
                <div
                  v-if="projectModal.availablePrjName"
                  class="__msg --is-available"
                >
                  <i class="check-icon" />
                  <span>
                    <!-- 사용 가능한 프로젝트 명입니다. -->
                    {{ $t('common.ALERT.PROJECT.069') }}
                  </span>
                </div>
                <div
                  v-else
                  class="__msg --is-not-available"
                >
                  <i class="check-icon" />
                  <span>
                    <!-- 중복된 프로젝트 명입니다. -->
                    {{ $t('common.ALERT.PROJECT.070') }}
                  </span>
                </div>
              </template>
            </template>
          </register-contents>
          <!-- 프로젝트 명-->

          <register-contents
            v-if="projectModal.isCommon"
            :title="$t('common.TERMS.distCompany_1')"
            class="modal__possess-company"
            required
          >
            <div
              class="contents-wrapper"
            >
              <template
                v-if="ownerCompanyInfo.ownerCompany.length > 1"
              >
                <!-- showProjectModal.mode === 'change' -->

                <section v-if="showProjectModal.mode !== 'change'">
                  <div
                    v-for="(com, idx) in ownerCompanyInfo.ownerCompany"
                    :key="idx"
                    class="wrapper"
                  >
                    <el-select
                      class="__select-box"
                      v-model="ownerCompanyInfo.ownerCompany[idx]"
                      :placeholder="$t('admin.ACCOUNT.selectAff')"
                      value-key="groupIdx"
                      @change="val => {
                        ownerCompanyInfo.ownerCompany[idx] = val
                      }"
                    >
                      <el-option
                        :class="[{'-disabled' : checkIfSelected(item.groupName)}]"
                        v-for="item in allCompanyOptions"
                        :key="item.groupIdx"
                        :value="item"
                        :label="item.groupName"
                      />
                    </el-select>
                    <span
                      v-if="ownerCompanyInfo.ownerCompany.length > 1"
                      class="__delete-icon"
                      @click="e => {
                        deleteSelectBox(idx, ownerCompanyInfo.ownerCompany)
                        deleteRelatedCommon(com.groupIdx)
                      }"
                    />
                  </div>
                </section>
                <!-- 프로젝트 변경 진입 시 select list -->
                <section v-else>
                  <div>
                    <el-select
                      disabled
                      v-for="group in immutableCompanyList"
                      class="__select-box"
                      style="width:306px; margin-bottom:5px;"
                      :value="group.groupName"
                      :key="group.groupName"
                      :placeholder="$t('admin.ACCOUNT.selectAff')"
                    >
                      <el-option
                        :key="group.groupName"
                        :value="group.groupName"
                        :label="group.groupName"
                      />
                    </el-select>
                  </div>
                </section>
              </template>
              <template
                v-else
              >
                <!-- 관계사 선택 select  -->
                <div
                  v-if="showProjectModal.mode !== 'change'"
                  class="wrapper"
                >
                  <el-select
                    class="__select-box"
                    v-model="ownerCompanyInfo.ownerCompany[0]"
                    :placeholder="$t('admin.ACCOUNT.selectAff')"
                    value-key="groupIdx"
                    @change="val => {
                      ownerCompanyInfo.ownerCompany[0] = val
                    }"
                  >
                    <el-option
                      :class="[{'-disabled' : checkIfSelected(item.groupName)}]"
                      v-for="item in allCompanyOptions"
                      :key="item.groupIdx"
                      :value="item"
                      :label="item.groupName"
                    />
                  </el-select>
                </div>
              </template>
              <div
                v-if="showProjectModal.mode !== 'change'"
                class="__add-button"
                @click="addSelectBox"
              >
                <span class="add-icon" />
              </div>
            </div>
          </register-contents>
          <!-- 소유관계사 -->

          <register-contents
            :title="$t('admin.ORG.BTN.setOperManager') "
            class="modal__appoint-mngr"
          >
            <p
              v-if="!projectModal.company.idx"
              class="-cp-unselected"
            >
              <!-- 관계사를 선택해주세요. -->
              {{ $t('common.ALERT.PROJECT.008') }}
            </p>
            <div
              v-else
              class="-cp-selected"
            >
              <div class="title">
                <div>{{ $t('admin.ROLE.jobRole') }}</div>
                <div>{{ $t('admin.ROLE.chargeRole') }}</div>
                <div />
              </div>
              <ul class="opratr-list">
                <li
                  v-if="!projectModal.operatingMngrList.length"
                  class="opratr-item --empty"
                >
                  <!-- 운영 담당자가 없습니다. -->
                  {{ $t('common.ALERT.PROJECT.068') }}
                </li>
                <template v-else>
                  <li
                    v-for="(mngr, idx) in projectModal.operatingMngrList"
                    :key="idx"
                    class="opratr-item"
                  >
                    <div class="opratr-upper-role">
                      <span>
                        {{ mngr.upperRoleName }}
                      </span>
                    </div>
                    <div class="opratr-role">
                      <!-- v-if="showProjectModal.mode === 'change' && mngr.company && mngr.company.length" -->
                      <section
                        @click="$refs.operatorTooltip[0].showPopper = !$refs.operatorTooltip[0].showPopper"
                        @blur="hideTooltip"
                        :tabindex="0"
                        style="display:inline; cursor:pointer;"
                      >
                        <el-tooltip
                          ref="operatorTooltip"
                          v-if="mngr.company && mngr.company.length"
                          v-model="mngr.tooltipShow"
                          popper-class="company-tooltip-popper"
                          effect="light"
                          placement="right"
                          manual
                          style="pointer-events:none;"
                        >
                          <div
                            slot="content"
                            class="popper-content"
                          >
                            <p
                              v-for="(company, index) in mngr.company"
                              :key="index"
                            >
                              {{ company }}
                            </p>
                          </div>
                          <span
                            class="__roleName"
                            @click="showTooltip(idx)"
                          >
                            <span
                              v-if="mngr.isDeleted"
                              class="deleted-role"
                            >
                              {{ mngr.roleName }} &nbsp; (삭제됨)
                            </span>
                            <span v-else>{{ mngr.roleName }}</span>
                          </span>
                        </el-tooltip>
                        <span v-else>
                          <span
                            v-if="mngr.isDeleted"
                            class="deleted-role"
                          >
                            {{ mngr.roleName }} &nbsp; (삭제됨)
                          </span>
                          <span v-else>{{ mngr.roleName }}</span>
                        </span>
                      </section>
                    </div>
                    <div class="opratr-edit-icon">
                      <span
                        @click="projectModal.showOperModal = true"
                      />
                    </div>
                  </li>
                </template>
              </ul>
            </div>
          </register-contents>
          <!-- 운영 담당자 지정 -->

          <register-contents
            :title="$t('bill.chargedOrNot')"
            class="modal__billing"
            required
          >
            <div class="input-sect">
              <el-radio-group
                v-model="projectModal.isBilling"
              >
                <el-radio :label="true">
                  <!-- 과금 -->
                  {{ $t('bill.charged') }}
                </el-radio>
                <el-radio
                  v-if="user.userPermLevel === 0"
                  :label="false"
                >
                  <!-- 미과금 -->
                  {{ $t('bill.uncharged') }}
                </el-radio>
              </el-radio-group>
            </div>
          </register-contents>
          <!-- 과금 여부 -->

          <register-contents
            v-if="projectModal.isCommon && showProjectModal.mode === 'change'"
            :title="$t('common.REGCON.remark')"
            class="modal__note"
          >
            <el-input
              type="textarea"
              :rows="2"
              :placeholder="$t('common.PLACEHOLDER.remark')"
              v-model="projectModal.noteText"
            />
          </register-contents>
          <!-- 비고 -->

          <register-contents
            v-if="projectModal.isCommon
              && showProjectModal.mode === 'change'
              && selectedPrj.groupIdx !== projectModal.organization.idx"
            :title="$t('common.TERMS.file')"
            class="modal__add-file"
            required
          >
            <div class="wrapper">
              <el-upload
                class="image-uploader cmp-upload"
                action=""
                :auto-upload="false"
                :multiple="false"
                :limit="1"
                ref="fileRefs"
                :file-list="fileList"
                :on-remove="changeFile"
                :on-change="changeFile"
              >
                <button
                  class="button"
                  slot="trigger"
                >
                  <!-- 파일 업로드 -->
                  {{ $t('common.BTN.ADMIN.uploadFile') }}
                </button>
              </el-upload>
            </div>
          </register-contents>
          <!-- 첨부파일 -->
        </article>

        <div class="modal-footer modal-button-area">
          <button
            class="button -modal-button"
            type="is-anti"
            @click="projectModalClose"
          >
            <!-- 취소 -->
            {{ $t('common.BTN.cancel') }}
          </button>
          <button
            class="button -modal-button"
            type="is-primary"
            @click="createUpdateProject"
          >
            <!-- 확인 -->
            {{ $t('common.BTN.confirm') }}
          </button>
        </div>
      </section>
    </el-dialog>

    <!-- 소유자 선택 모달 -->
    <set-owner-modal
      :active.sync="projectModal.ownerModalShow"
      @close="projectModal.ownerModalShow = false"
      @select="setMapping(...arguments, 'prjOwner')"
      :title="$t('config.PROJECT.changeProjectOwner')"
      :data="projectModal.ownerModalList"
      selectable-only
      :plus-version="isPlusVer"
    />
    <!-- :init-auto-select-row="newRole.manager" -->

    <!-- 운영 담당자 변경 모달 -->
    <el-dialog
      :title="$t('admin.ORG.BTN.changeOperManager')"
      :visible.sync="projectModal.showOperModal"
      width="370px"
      top="30vh"
      class="opratr-rgstr-modal"
    >
      <change-op-manager
        v-if="projectModal.showOperModal"
        :data="projectModal.operatingMngrList"
        @close="projectModal.showOperModal = false"
        @save="operatorConfirm"
      />
    </el-dialog>

    <!-- [Public] Access Key 비밀번호 확인 모달 -->
    <confirm-password-modal
      :is-visible="checkPasswordModal"
      @close="checkPasswordModal = false"
      @confirm="confirmPassword"
    />
  </div>
</template>
<script>
import API, { GTree, DashboardPanel, FoldCompanyGroup } from '@sd-fe/cmp-core'

import SetOwnerModal from './SetOwnerModal'
import ChangeOpManager from './ChangeOpManager'
import { mapState } from 'vuex'

import Dayjs from 'dayjs'
import { cloneDeep, groupBy } from 'lodash'
import ConfirmPasswordModal from '@/components/ConfigAws/ConfirmPasswordModal.vue'

export default {
  name: 'ManageProject',
  components: {
    DashboardPanel,
    FoldCompanyGroup,
    ChangeOpManager,
    GTree,
    // SelectGroupDropdown,
    SetOwnerModal,
    ConfirmPasswordModal
  },
  async created () {
    // console.log('@created:', this.user, this.packageType)
    await this.getGroupManageTree()
    // 운영관리자의 경우 부여된 역할 내 포함된 관계사만 가지고 오기
    if (this.user.userPermLevel === 1) await this.getUserPermRoleData()
  },
  computed: {
    ...mapState({
      user: state => state.auth.user,
      packageType: state => state.auth.packageType,
      cloudType: state => state.cloud.cloudType,
      rootGroup: state => state.common.rootGroup
    }),
    hasRootGroup () {
      return this.rootGroup ? { groupName: this.rootGroup, groupUpper: 0, isRootParent: true } : undefined
    },
    isPlusVer () { // 플러스 버전 여부
      return this.packageType === 'PL'
    },
    filteredCompanyList () {
      if (this.searchText !== '') {
        const regex = new RegExp(this.searchText, 'gi')
        return this.allTreeData.filter(item => regex.test(item.groupName))
      } else {
        return this.allTreeData
      }
    },
    projectModalTitle () {
      return this.showProjectModal.mode === 'create' ? this.$t('common.BTN.ADMIN.newProject') : this.$t('common.MODAL.modProject') // 프로젝트 생성 : 프로젝트 변경
    },
    isViewCommonOption () {
      // 최고관리자:
      // 일반 / 공통 생성 가능
      // 일반 변경 가능
      // 공통 변경 가능

      // 운영관리자:
      // 일반 만 생성 가능
      // 일반 변경 가능
      // 공통 변경 가능 (부여받은 프로젝트에 한함)
      return this.user.userPermLevel === 0 ||
      (this.user.userPermLevel === 1 && this.showProjectModal.mode === 'change' && this.projectModal.isCommon === true)
    },
    selectedCompanyNames () {
      return this.ownerCompanyInfo.ownerCompany.map(c => c.groupName)
    },
    selectedCloudType () {
      return this.$store.state.cloud.cloudType.toUpperCase()
    }
  },
  methods: {
    checkIfSelected (gName) {
      if (this.selectedCompanyNames.includes(gName)) return true
      return false
    },
    sortByASCII (a, b) {
      const sortByASCII = a.projectName[0].toUpperCase().charCodeAt() < b.projectName[0].toUpperCase().charCodeAt()
      if (sortByASCII) return -1
      else return 0
    },
    switchLowerCaseToFront (a, b) {
      const switchLowerCaseToBack = b.projectName[0].charCodeAt() - a.projectName[0].charCodeAt() === -32
      if (switchLowerCaseToBack) return -1
      else return 0
    },
    validateChangedData () {
      const isEqualObject = JSON.stringify(this.initialProjectData) === JSON.stringify(this.projectModal)
      if (isEqualObject) return false
      else return true
    },
    handleClose () {
      if (this.validateChangedData()) {
        this.$confirm(this.$t('common.CONFIRM.BASE.037'))
          .then(() => {
            this.projectModalClose()
          }).catch(() => {})
      } else {
        this.projectModalClose()
      }
    },
    hideTooltip () {
      if (this.$refs.operatorTooltip[0].showPopper) this.$refs.operatorTooltip[0].showPopper = false
    },
    /**
     * API : 프로젝트 하위에 자원 존재하는지 체크
     * @return {Boolean} True: 삭제 가능 -> 하위에 자원 존재하지 않음
     */
    async getProjectResource (projectIdx) {
      try {
        this.loading.delete = true
        const result = await API.iam.getProjectResource(projectIdx)
        return result
      } catch (error) {
        console.error(error)
        const message = (error.response && error.response.data) ? error.response.data.message : error.message
        return this.$alert(message)
      } finally {
        this.loading.delete = false
      }
    },
    /**
     * API : 공통 프로젝트 변경시, 파일을 업로드 합니다.
     * @return {Object} 업로드 된 파일 정보
     */
    async iamProjectUpload (formData) {
      try {
        this.loading.fileUpload = true
        const result = await API.iam.iamProjectUpload(formData)
        return result
      } catch (error) {
        console.error(error)
        return this.$alert('IAM 파일 업로드에 문제가 발생했습니다.')
      } finally {
        this.loading.fileUpload = false
      }
    },
    /**
     * 운영관리자의 경우 부여된 역할 내 포함된 관계사만 가지고 오기 위해 처리
     */
    async getUserPermRoleData () {
      // console.log(this.user.userPermRoleList)
      // const res = await Promise.all(
      //   this.user.userPermRoleList.map(async role => API.iam.getRole({ roleIdx: role.roleIdx }))
      // )
      // console.log(res)
      let tempCompany = []
      for await (const role of this.user.userPermRoleList) {
        const response = await API.iam.getRole({ roleIdx: role.roleIdx })
        if (response) {
          tempCompany = tempCompany.concat(response[0].company)
        }
      }
      this.userPermRoleCompanyList = [...new Set(tempCompany)]
      console.log('userPermRoleCompanyList:', this.userPermRoleCompanyList)

      // 트리 데이터 필터링
      this.allTreeData = this.filterCompany(this.allTreeData)
      console.log('this.allTreeData: 2차', this.allTreeData)
      this.dropdownLoading = false
    },
    /**
     * 역할 내 포함되는 관계사 리스트만 filtering
     */
    filterCompany (data) {
      return data.filter(group => {
        if (this.userPermRoleCompanyList.includes(group.groupName)) return group
      })
    },
    /**
     * API: 그룹 트리 데이터를 받아옴.
     */
    async getGroupManageTree () {
      try {
        this.loading.groupTree = true
        const data = await API.iam.getGroupManageTree({ project: true, user: false })
        if (data?.length) {
          this.allTreeData = this.setOrgPrjNumber(data)
          if (data[0].companyCode === 'common') data.shift()
        }
        console.log('this.allTreeData: 1차', this.allTreeData)
      } catch (error) {
        console.error(error)
        const message = (error.response && error.response.data) ? error.response.data.message : error.message
        this.$alert(message)
      } finally {
        this.loading.groupTree = false
      }
    },
    /**
     * 그룹 이하 하위 조직 평탄화 (depth 없앰)
     */
    getAllChildrenData (group) {
      const result = []
      if (group.children.length > 0) factorial(group.children)

      function factorial (chldrn) {
        return chldrn.map(item => {
          if (item.children.length > 0) {
            const itemCopy = { ...item }
            if (itemCopy.children) delete itemCopy.children
            result.push(itemCopy)

            return factorial(item.children)
          } else {
            result.push(item)
          }
        })
      }
      return result
    },
    /**
     * 그룹 트리 중 그룹에 조직 및 프로젝트 수 세팅.
     */
    setOrgPrjNumber (data) {
      if (!data) return []
      // 하위 조직에도 deepChildren 넣어줌
      const getDeepChildren = (data, round = 0) => {
        return data.map(group => {
          if (group?.children?.length > 0 && !group.deepChildren) {
            group.deepChildren = this.getAllChildrenData(group)
            getDeepChildren(group.children, round++)
          }
          return group
        })
      }
      const tempGroupData = getDeepChildren(data) || []
      console.log('@setOrgPrjNumber: tempGroupData:', tempGroupData)
      return tempGroupData.map(group => {
        if (group.deepChildren) {
          group.orgNum = group.deepChildren.length || 0
          let prjNum = 0
          group.deepChildren.map(item => {
            if (item.groupProject.length > 0) {
              item.groupProject.map(pj => {
                if (!pj.isDeleted && pj.cloudType?.toLowerCase() === this.cloudType) prjNum++
              })
            }
          })
          group.prjNum = prjNum
        } else {
          group.orgNum = 0
          group.prjNum = 0
        }
        return group
      })
    },
    bindGroupData () {
      const toArray = Object.values(this.filteredCompanyList) // 객체 => 배열
      toArray.forEach(item => {
        if (item.groupName === this.selectedGroupName) {
          this.selectedGroupName = item.groupName //
          // this.setTreeData(item) // 조직 변경
          this.selectItem(item)
        }
      })
    },
    /**
     * 관계사 선택 시 실행
     */
    selectItem (item) {
      console.log('@selectItem', item)
      // 폴더 컴포넌트가 존재할 때만 폴더 모두 닫기
      if (this.treeData.length) this.$refs.folderGroup.collapseAll()

      this.selectedCompany = `${item.groupName} (${this.$t('common.TERMS.group')} ${item.orgNum}${this.$i18n.locale === 'ko' ? '개' : 'EA'} / ${this.$t('common.TERMS.project')} ${item.prjNum}${this.$i18n.locale === 'ko' ? '개' : 'EA'})` // groupName (조직 *개 / 프로젝트 * 개)
      this.selectedGroupName = item.groupName

      // 하단 트리 데이터 세팅
      this.setTreeData(item)

      // 우측 프로젝트 상세 초기화 => resetSelectedOrg() 메서드로 따로 뺐습니다.
      // this.selectedOrg = null
      // this.projectList = []
      // this.selectedPrj = null
      // this.searchText = ''
    },
    /**
     * 선택 조직/프로젝트 초기화
     */
    resetSelectedOrg () {
      this.selectedOrg = null
      this.projectList = []
      this.selectedPrj = null
      this.searchText = ''
    },
    /**
     * 선택된 관계사 기준으로 treeData 세팅.
     */
    setTreeData (data) {
      this.treeData = data.children
    },
    /**
     * 소유 관계사 선택 박스 추가
     */
    addSelectBox () {
      const newObj = ''
      this.ownerCompanyInfo.ownerCompany.push(newObj)
    },
    /**
     * 소유 관계사 선택 박스 삭제
     */
    deleteSelectBox (deleteIdx, list) {
      list.splice(deleteIdx, 1)
    },
    /**
     * 소유관계사 제거 -> 공통관계사에 영향
     */
    deleteRelatedCommon (groupIdx) {
      this.ownerCompanyInfo.commonCompany.forEach((common, index) => {
        if (!common.children) return
        const deletedCommonIdx = common.children.findIndex(item => item.groupIdx === groupIdx)
        if (deletedCommonIdx !== undefined) this.deleteSelectBox(deletedCommonIdx, common.children)

        if (!common.children.length) this.deleteSelectBox(index, this.ownerCompanyInfo.commonCompany)
      })
    },
    /**
     * 조직 선택 시 실행
     */
    async selectOrg (org, updatePrj = false) {
      console.log('@selectOrg', org)
      if (org) {
        this.pjDetailLoading = true

        this.selectedOrg = org

        let param = {
          groupIdx: org.groupIdx,
          cloudType: this.cloudType
        }
        if (this.packageType === 'PL') {
          param = Object.assign(param, { isAdmin: true })
        }

        // 선택 조직이 가지고 있는 프로젝트 가져오기
        const res = await API.iam.getProject(param)
        let projectList = this.filteringIsDeleted(res)
        projectList = this.filterCloudType(projectList)

        // 현재 선택된 관계사가 공통일 경우 공통 프로젝트만,
        // 그 외에는 일반 프로젝트만 보여줌
        // if (this.selectedCompany.indexOf('공통') > -1) {
        //   projectList = projectList.filter(pj => {
        //     if (pj.inCommon) return pj
        //   })
        // } else {
        //   projectList = projectList.filter(pj => {
        //     if (!pj.inCommon) return pj
        //   })
        // }

        // 가나다순 정렬
        projectList
          .sort(this.sortByASCII)
          .sort(this.switchLowerCaseToFront)
        if (projectList.length > 0) {
          this.projectList = projectList
          console.log('projectList', projectList)
          if (!updatePrj) {
            // 첫 프로젝트 클릭 상태 만들기
            this.getEachProjectData(projectList[0].projectIdx, projectList[0].isAdmin)
          } else {
            this.selectProject(this.selectedPrj)
          }
        } else {
          this.projectList = []
          this.selectedPrj = null
        }
        this.pjDetailLoading = false
      }
    },
    filterCloudType (projects) {
      if (this.selectedCloudType === 'PUBLIC') {
        return projects.filter(project => project.cloudType === 'PUBLIC')
      } else {
        return projects.filter(project => project.cloudType === 'PRIVATE')
      }
    },
    /**
     * 각 프로젝트 정보 가져오기
     */
    async getEachProjectData (pjIdx, isAdmin) {
      console.log('@getEachProjectData', pjIdx, isAdmin)
      const param = { projectIdx: pjIdx, isAdmin: isAdmin }
      const res = await API.iam.getProject(param)
      if (res) {
        this.selectedPrj = res[0]

        if (this.cloudType === 'public' &&
         this.selectedPrj.projectStatus > 0 && this.selectedPrj.projectStatus < 3) await this.getPublicProjectKey(pjIdx) // Public && 생성된 프로젝트(승인대기 x / 삭제대기 x) > 액세스 키 조회
      }
    },
    /**
     * 삭제된 것 필터링
     */
    filteringIsDeleted (list) {
      return list.filter(item => {
        if (!item.isDeleted) return item
      })
    },
    /**
     * 프로젝트 선택 시 실행
     */
    async selectProject (prj) {
      console.log('@selectProject', prj)
      await this.getEachProjectData(prj.projectIdx, prj.isAdmin)
    },
    /**
     * 시간 변환
     */
    changeHumanTime (timestamp) {
      timestamp = new Date(timestamp)
      return Dayjs(timestamp).format('YYYY-MM-DD')
    },
    /**
     * 프로젝트 삭제
     */
    deleteProject () {
      console.log(this.selectedPrj)
      // 프로젝트: {projectName} 을(를) 삭제 하시겠습니까?
      this.$confirm(this.$t('common.CONFIRM.PROJECT.014', { projectName: this.selectedPrj.projectName })
      ).then(async () => {
        const qs = this.packageType === 'PL' ? '?isAdmin=true' : ''

        const check = await this.getProjectResource(this.selectedPrj.projectIdx)
        if (!check) return this.$alert(this.$t('common.ALERT.PROJECT.042'), { dangerouslyUseHTMLString: true }) // 프로젝트 하위에 자원이 존재하여<br>삭제 불가능합니다.

        try {
          this.loading.delete = true
          const res = await API.iam.deleteProject(this.selectedPrj.projectIdx, qs)

          if (res) {
            this.$alert(this.$t('common.ALERT.BASE.017')) // 삭제하였습니다
            this.$refs.projectAreaBodyLeft.scrollTop = 0
            await this.getGroupManageTree() // 그룹 트리 재조회
            this.bindGroupData() // 선택한 관계사 세팅
            this.selectOrg(this.selectedOrg) // 선택한 조직 세팅
            if (this.$refs?.folderGroup) this.$refs.folderGroup.openFoldPanel(this.selectedOrg) // 선택한 조직 있는 panel 펼쳐지게 세팅
          } else {
            this.$alert(this.$t('common.ALERT.BASE.016')) // 삭제에 실패했습니다
          }
        } catch (error) {
          this.$alert(this.$t('common.ALERT.BASE.016')) // 삭제에 실패했습니다
        } finally {
          this.loading.delete = false
        }
      })
    },
    /**
     * 프로젝트 생성 및 변경 모달 open
     */
    async projectModalOpen (mode) {
      const list = await API.iam.getGroupList({ groupUpper: 0 })
      if (list[0].companyCode === 'common') list.shift()
      // this.projectModal.companyList = list // 관계사 목록 세팅
      this.allCompanyOptions = list

      if (mode === 'change') {
        this.pjDetailLoading = true
        // projectOwner: null, // 프로젝트 소유자
        // projectName: null, // 프로젝트 명
        // availablePrjName: null, // 프로젝트명 사용 가능 여부
        // ownerCompany: [], // 소유관계사
        // operatingMngrList: [], // 운영 담당자 그리드 데이터
        // mngrRole: {}, // 운영 담당자 선택된 역할
        // mngrRoleLists: {}, // 운영 담당자 변경 담당역할 리스트 세팅
        // allRoleLists: [], // 모든 역할
        // isBilling: true, // 빌링여부
        // noteText: '', // 비고
        // midMngrList: [], // 중간관리자 리스트
        // ownerModalList: [], // 소유자 선택 모달 리스트
        // fileList: [], // 첨부파일
        // ownerModalShow: false, // 소유자 변경 모달 show
        // showOperModal: false // 운영담당자 변경 모달
        console.log('@projectModalOpen: selectedPrj:', this.selectedPrj)

        if (this.selectedPrj.commonProject) {
          // this.$nextTick(async function () {
          await this.setInitCommonData(this.selectedPrj.commonProject) // 공통프로젝트 관련 정보 세팅
          // })
        }

        let mngrType
        let tagName
        if (this.selectedPrj.projectOwner) {
          mngrType = this.selectedPrj.projectOwner.manageType === null
            ? null
            : this.selectedPrj.projectOwner.manageType === 1
              ? this.$t('admin.ORG.sub') // 부
              : this.$t('admin.ORG.main') // 정

          if (this.isPlusVer) {
            tagName = `${this.selectedPrj.projectOwner.userPosition} ${this.selectedPrj.projectOwner.userName}`
          } else {
            tagName = mngrType
              ? `${this.$t('admin.ACCOUNT.middleManager')}(${mngrType}) ${this.selectedPrj.projectOwner.userName}`
              : this.selectedPrj.projectOwner.userName
          }
        }

        // 변경 여부 위해 저장
        this.prevProjecName = this.selectedPrj.projectName
        this.prevCompanyIdx = this.selectedPrj.companyIdx

        // 해당 역할이 관리하는 관계사 범위 출력 위해 역할 정보 조회
        // if (this.selectedPrj.operationManger.length) {
        //   for await (const role of this.selectedPrj.operationManger) {
        //     const response = await API.iam.getRole({ roleIdx: role.roleIdx })
        //     if (response) {
        //       Object.assign(role, { company: response[0].company })
        //     }
        //   }
        //   console.log('operationManger:', this.selectedPrj.operationManger)
        // }

        this.projectModal = {
          isCommon: this.selectedPrj.inCommon,
          isSelectMode: false,
          // companyList: null,
          company: {
            idx: this.selectedPrj.companyIdx,
            name: this.selectedPrj.companyName
          },
          // organizationList: null,
          organization: {
            idx: this.selectedPrj.groupIdx,
            name: this.selectedPrj.groupName
          },
          projectOwner: this.selectedPrj.projectOwner ? {
            userId: this.selectedPrj.projectOwner.userId,
            userIdx: this.selectedPrj.projectOwner.userIdx,
            userName: this.selectedPrj.projectOwner.userName,
            userPosition: this.selectedPrj.projectOwner.userPosition,
            tag: tagName
          } : null,
          projectName: this.selectedPrj.projectName,
          availablePrjName: null,
          ownerCompany: this.ownerCompanyInfo.ownerCompany,
          operatingMngrList: this.selectedPrj.operationManger,
          mngrRole: {},
          mngrRoleLists: {},
          allRoleLists: [],
          isBilling: !this.selectedPrj.noBilling,
          noteText: this.selectedPrj.projectMemo,
          midMngrList: [],
          ownerModalList: [],
          ownerModalShow: false,
          showOperModal: false
        }
        await this.setMidMngrAndOprMngr(this.selectedPrj.companyIdx)
        await this.getManagerList()

        await this.getOpManagerList(this.selectedPrj.companyIdx)
        // await this.getRoleList()
      }
      this.showProjectModal.mode = mode
      this.showProjectModal[mode] = true
      this.pjDetailLoading = false
      this.initialProjectData = cloneDeep(this.projectModal) // 생성/변경 시 clone
    },
    /**
     * 공통 프로젝트일 때, 정보를 세팅합니다.
     */
    setInitCommonData (commonData) {
      const distGroups = commonData.distributeGroups
      // 배부기준명
      this.ownerCompanyInfo.distName = commonData.distributeStandardName

      // 소유관계사
      this.changeOriginOwnerCompany = cloneDeep(distGroups)
      this.ownerCompanyInfo.ownerCompany = this.changeOriginOwnerCompany.filter(g => g.groupIdx)
      this.immutableCompanyList = this.changeOriginOwnerCompany
        .filter(
          (arr, index, self) => index === self.findIndex(t => t.groupName === arr.groupName)
        )

      // 공통관계사
      const isParentGroupNameData = distGroups.filter(group => group.parentGroupName)
      const commonDist = groupBy(isParentGroupNameData, 'parentGroupName')
      for (const key in commonDist) {
        this.ownerCompanyInfo.commonCompany.push({
          name: key,
          children: [...commonDist[key]]
        })
      }
    },
    /**
     * 프로젝트 생성 및 변경 모달 close
     */
    projectModalClose () {
      // init modal data
      this.projectModal = {
        isCommon: false,
        isSelectMode: false,
        companyList: null,
        company: {
          idx: null,
          name: null
        },
        organizationList: null,
        organization: {
          idx: null,
          name: null
        },
        projectOwner: null,
        projectName: null,
        availablePrjName: null,
        ownerCompany: [],
        operatingMngrList: [],
        mngrRole: {},
        mngrRoleLists: {},
        allRoleLists: [],
        isBilling: true,
        noteText: '',
        midMngrList: [],
        ownerModalList: [],
        ownerModalShow: false,
        showOperModal: false
      }
      this.fileList = []
      this.changeOriginOwnerCompany = []

      if (this.$refs.mdCompanyDropdown && this.$refs.mdOrgDropdown) {
        this.$refs.mdCompanyDropdown.init()
        this.$refs.mdOrgDropdown.init()
      }
      this.showProjectModal.mode = null
      this.showProjectModal[this.showProjectModal.mode] = false
      this.initialProjectData = null

      this.ownerCompanyInfo = {
        distName: '',
        ownerCompany: [], // 소유관계사
        commonCompany: [] // 공통관계사
      }
    },
    /**
     * 모달창: 관-조 선택 시 실행
     */
    async selectGroup (param, mode) {
      console.log('@selectGroup', param, mode)
      this.projectModal[mode] = { idx: param.groupIdx, name: param.groupName }
      if (mode === 'company') { // 관계사 선택 시
        // 선택된 조직 초기화
        this.projectModal.organization = {
          idx: null,
          name: null
        }
        this.$refs.mdOrgDropdown.init()
        // 프로젝트 명 초기화
        // 플젝 명 초기화 하는 것 보단 중복 확인을 다시하게 하는 방향으로??? 일단 처리.
        // if (this.showProjectModal.mode !== 'change') this.projectModal.projectName = null
        this.projectModal.availablePrjName = null

        try {
          this.loading.isGetGroupInfo = true

          // 조직 선택 리스트 세팅
          const res = await API.iam.getGroupList({ companyIdx: this.projectModal.company.idx })
          if (res) this.projectModal.organizationList = res

          // 중간 관리자 태그 & 운영 담당자 리스트 세팅
          await this.setMidMngrAndOprMngr()

          // 소유자 초기화
          this.projectModal.projectOwner = null
          // 소유자 변경 모달 리스트 세팅
          await this.getManagerList()

          // 운영 담당자 세팅
          await this.getOpManagerList(this.projectModal.company.idx)
        } catch (err) {
          console.error('관계사 정보 조회 실패: ', err)
        } finally {
          this.loading.isGetGroupInfo = false
        }
      }
    },
    /**
     * 중간 관리자 태그 & 운영 담당자 리스트 세팅
     */
    async setMidMngrAndOprMngr (groupIdx = null) {
      const grpInfo = await API.iam.getGroupList({ groupIdx: groupIdx || this.projectModal.company.idx })
      if (grpInfo) {
        // 중간 관리자 태그 세팅
        this.projectModal.midMngrList = grpInfo[0].middleManagerList
        // 운영 담당자 리스트 세팅
        this.projectModal.operatingMngrList = grpInfo[0].operationManagerList
        if (this.projectModal.operatingMngrList.length) {
          // 운영 담당자 툴팁 관계사 데이터 세팅
          const promises = this.projectModal.operatingMngrList.map(async role => {
            role.tooltipShow = false
            const roleRes = await API.iam.getRoleManageList({ roleIdx: role.roleIdx })
            if (roleRes) {
              role.company = roleRes[0].company
            }
            return role
          })
          this.projectModal.operatingMngrList = await Promise.all(promises)
        }
        console.log('operatingMngrList:', this.projectModal.operatingMngrList)
      }
    },
    /**
     * 역할 리스트 세팅
     */
    // async getRoleList () {
    //   const roleRes = await API.iam.getRoleList()
    //   if (roleRes) {
    //     this.allRoleLists = roleRes
    //     const role = {}
    //     const roleLists = {}
    //     this.projectModal.operatingMngrList.map(mngr => {
    //       if (!roleLists[mngr.upperRoleName]) {
    //         role[mngr.upperRoleName] = mngr.roleIdx
    //         roleLists[mngr.upperRoleName] = []
    //       }
    //       return roleRes.map(role => {
    //         if (role.roleUpper === mngr.upperRoleIdx) {
    //           return roleLists[mngr.upperRoleName].push(role)
    //         }
    //       })
    //     })
    //     this.projectModal.mngrRole = role
    //     this.projectModal.mngrRoleLists = roleLists
    //     console.log('@getRoleList', role, roleLists)
    //   }
    // },
    /**
     * 선택한 관계사에 따라 '운영 담당자 목록'을 가져옵니다.
     */
    async getOpManagerList (companyIdx) {
      let list
      if (companyIdx === undefined) list = []
      else {
        const grpInfo = await await API.iam.getGroupList({ groupIdx: companyIdx })
        // 운영 담당자 리스트 세팅

        // if (grpInfo?.length) list = grpInfo[0].operationManagerList
        // 관계사에 등록된 업무역할이 삭제되었으면 isDeleted= true
        if (grpInfo?.length) {
          const allRoles = await API.iam.getRoleList() ?? []
          const allRolesIdx = allRoles.map(role => role.roleIdx)

          list = grpInfo[0].operationManagerList.map(role => {
            return {
              ...role,
              isDeleted: !allRolesIdx.includes(role.roleIdx)
            }
          })
        }
      }

      const projectMngList = this.selectedPrj ? this.selectedPrj.operationManger : []

      const promises = list.map(async item => {
        const sameMng = projectMngList.find(mng => mng.upperRoleIdx === item.upperRoleIdx)
        const roleIdx = sameMng ? sameMng.roleIdx : item.roleIdx
        const roleRes = await API.iam.getRoleManageList({ roleIdx: roleIdx })

        return {
          ...item,
          roleIdx,
          company: roleRes?.length ? roleRes[0].company : [],
          roleName: sameMng ? sameMng.roleName : item.roleName,
          edit: true
        }
      })
      this.projectModal.operatingMngrList = await Promise.all(promises)
      console.log('this.projectModal.operatingMngrList: ', this.projectModal.operatingMngrList)
    },

    /**
     * 운영 담당자 수정 팝업 > 변경 클릭 시 실행
     */
    async operatorConfirm (roleInfo) {
      // this.projectModal.operatingMngrList = this.projectModal.operatingMngrList.map(list => {
      //   const targetRole = this.allRoleLists.find(role => role.roleIdx === this.projectModal.mngrRole[list.upperRoleName])
      //   list.roleName = targetRole.roleName
      //   return list
      // })
      if (!roleInfo) return
      // this.projectModal.operatingMngrList = [...roleInfo]

      this.projectModal.operatingMngrList = roleInfo.map(item => {
        delete item.isDeleted
        return { ...item }
      })

      const updatedRoleCompany = roleInfo.map(async role => {
        const roleRes = await API.iam.getRoleManageList({ roleIdx: role.roleIdx })
        return {
          ...role,
          tooltipShow: false,
          company: roleRes?.length ? roleRes[0].company : []
        }
      })
      this.projectModal.operatingMngrList = await Promise.all(updatedRoleCompany)

      this.projectModal.showOperModal = false
    },
    /**
    * 프로젝트 생성 전, 선택한 업무 역할이 존재하는지 확인합니다.
    */
    async roleExist (managerList = this.projectModal.operatingMngrList) {
      const allRoles = await API.iam.getRoleList() ?? []
      const allRolesIdx = allRoles.map(role => role.roleIdx)
      return managerList.every(role => allRolesIdx.includes(role.roleIdx))
    },

    /**
     * 프로젝트 생성, 변경 입력값 vatidation
     */
    async validateForm () {
      // console.log('@validateForm', this.projectModal)
      if (!this.projectModal.company.idx) {
        this.$alert(this.$t('common.ALERT.PROJECT.008'), () => false) // 관계사를 선택해주세요.
        return false
      }
      if (!this.projectModal.organization.idx) {
        this.$alert(this.$t('common.ALERT.PROJECT.064'), () => false) // 조직을 선택해주세요.
        return false
      }
      if (!(this.projectModal.projectOwner && this.projectModal.projectOwner.userIdx)) {
        this.$alert(this.$t('common.ALERT.PROJECT.065'), () => false) // 프로젝트 소유자를 선택해주세요.
        return false
      }
      if (!this.projectModal.projectName) {
        this.$alert(this.$t('common.ALERT.PROJECT.063'), () => false) // 프로젝트 명을 입력해주세요.
        return false
      }

      if (this.projectModal.operatingMngrList.some(item => item.isDeleted)) {
        this.$alert(this.$t('common.ALERT.PROJECT.078'), () => false) // 삭제된 담당 역할이 포함되어 있습니다.
        return false
      }

      // 저장 전, 삭제된 업무 역할이 포함되어 있는지 다시 확인
      if (!await this.roleExist()) {
        await this.getOpManagerList(this.projectModal.company.idx)
        this.$alert(this.$t('common.ALERT.PROJECT.079'), { dangerouslyUseHTMLString: true }, () => false) // 선택한 역할이 존재하지 않습니다.<br>다시 선택해주세요.
        return false
      }

      // console.log(this.prevProjecName, this.projectModal.projectName)
      if ((this.showProjectModal.mode === 'create' && this.projectModal.availablePrjName === null) || (this.showProjectModal.mode === 'change' && this.prevProjecName !== this.projectModal.projectName && this.projectModal.availablePrjName === null) || (this.showProjectModal.mode === 'change' && this.prevCompanyIdx !== this.projectModal.company.idx && this.projectModal.availablePrjName === null)) {
        this.$alert(this.$t('common.ALERT.PROJECT.066')) // 프로젝트 명 중복 확인을 해주세요.
        return false
      }
      if (this.projectModal.isCommon &&
      !this.ownerCompanyInfo.ownerCompany.length &&
      (this.showProjectModal.mode === 'create' || this.selectedPrj.commonProject)) {
        this.$alert(this.$t('common.ALERT.PROJECT.067')) // 소유관계사를 선택해주세요.
        return false
      }

      if (this.projectModal.isCommon && this.showProjectModal.mode === 'change' &&
      this.selectedPrj.groupIdx !== this.projectModal.organization.idx &&
      !this.fileList?.length) {
        this.$alert(this.$t('common.BTN.SERV.selectAttach')) // 첨부파일을 선택해주세요. (프로젝트 위치 이동 시 필수 선택 요소)
        return false
      }
      return true
    },
    /**
     * 프로젝트 생성 및 변경
     */
    async createUpdateProject () {
      const canGoNext = await this.validateForm()
      if (!canGoNext) return

      const createMode = this.showProjectModal.mode === 'create'

      // 운영담당자 roleIdx 만 배열로 추출
      // const mngrRoleArr = Object.values(this.projectModal.mngrRole)
      const mngrRoleArr = this.projectModal.operatingMngrList.map(role => role.roleIdx)
      // let distGrops
      // if (this.projectModal.isCommon) {
      //   distGrops = this.projectModal.ownerCompany.map(grp => {
      //     return {
      //       iamGroupIdx: grp.groupIdx, // 소유 관계사 idx
      //       name: grp.groupName // groupName
      //     }
      //   })
      // }
      let payload
      let defaultPayload
      if (createMode) {
        defaultPayload = {
          companyIdx: this.projectModal.company.idx,
          // distGroups: this.projectModal.isCommon ? distGrops : [],
          // distributeStandardName: '',
          groupIdx: this.projectModal.organization.idx,
          inCommon: this.projectModal.isCommon,
          noBilling: !this.projectModal.isBilling,
          operationManagers: mngrRoleArr, // 운영 담당자 roleIdx [5, 8]
          ownerCompany: this.projectModal.isCommon ? 1 : this.projectModal.company.idx, // 공통 일 경우 1, 일반 일 경우 관계사 idx
          projectMemo: this.projectModal.noteText,
          projectName: this.projectModal.projectName.trim(),
          userIdx: this.projectModal.projectOwner.userIdx // 프로젝트 소유자
        }
      } else {
        defaultPayload = {
          // distGroups: this.projectModal.isCommon ? distGrops : [],
          // distributeStandardName: '',
          companyIdx: this.projectModal.company.idx,
          groupIdx: this.projectModal.organization.idx,
          inCommon: this.projectModal.isCommon,
          noBilling: !this.projectModal.isBilling,
          operationManagers: mngrRoleArr,
          ownerCompany: this.projectModal.isCommon ? 1 : this.projectModal.company.idx,
          // projectFileIdx: 0,
          projectIdx: this.selectedPrj.projectIdx,
          projectMemo: this.projectModal.noteText,
          projectName: this.projectModal.projectName.trim(),
          userIdx: this.projectModal.projectOwner.userIdx
        }
      }

      if (this.projectModal.isCommon) {
        let projectFileIdx

        if ((this.selectedPrj?.groupIdx !== this.projectModal.organization.idx) &&
        this.fileList.length) { // 공통 + 관계사 및 조직 변경일 때
          const formData = new FormData()
          formData.append('file', this.fileList[0].raw)

          const iamUpdatedFile = await this.iamProjectUpload(formData)
          projectFileIdx = iamUpdatedFile ? iamUpdatedFile.fileIdx : undefined
        }

        payload = Object.assign({
          projectMemo: this.projectModal.noteText,
          projectFileIdx
        }, defaultPayload)

        if (createMode || this.selectedPrj.commonProject) { // 배부모델이 사용자 노출Y일 때
          const commonProject = await this.setCommonProjectParams()

          payload.commonProject = commonProject
        }
      } else payload = defaultPayload
      console.log('@createUpdateProject: payload:', payload)

      if (this.packageType === 'PL') payload = Object.assign(payload, { isAdmin: true })

      try {
        this.pjModalLoading = true
        // createMode ? 프로젝트를 생성하였습니다.
        // else 프로젝트를 수정하였습니다.
        const message = createMode ? this.$t('common.ALERT.PROJECT.044') : this.$t('common.ALERT.PROJECT.045')

        const qs = this.packageType === 'PL' ? '?ownerLevel=true' : ''

        let response

        if (createMode) response = await API.iam.createProject(payload, qs)
        else response = await API.iam.updateProject(payload, qs)

        if (response) {
          const groupProject = await API.iam.getProject({
            inCommon: true,
            isDeleted: false,
            companyIdx: payload.companyIdx,
            groupIdx: payload.groupIdx
          })
          const createdProject = groupProject.find(pr => pr.projectName === payload.projectName)// 방금 생성/변경한 프로젝트

          this.$alert(message, '', {
            callback: async () => {
              if (this.$refs.projectAreaBodyLeft) this.$refs.projectAreaBodyLeft.scrollTop = 0

              if (payload.inCommon && createMode) {
              // 공통 생성 시 배부 모델 페이지로 이동 (배부모델명 없거나 공통관계사 없을 때만)

                this.$confirm(this.$t('common.CONFIRM.PROJECT.023'), { dangerouslyUseHTMLString: true }) // '공통 프로젝트를 생성했습니다. <br> 배부 기준/비율 입력 페이지로 이동하시겠습니까? <br> 확인 시 배부모델 설정 페이지로 이동합니다.'
                  .then(() => {
                    this.$router.push({
                      name: 'nx-billing-model-dist-create',
                      query: {
                        projectIdx: payload.projectIdx || (createdProject ? createdProject.projectIdx : null)
                      }
                    })
                  }).catch(async () => false)
              }
            }
          })

          await this.getGroupManageTree() // 그룹 트리 재조회
          this.bindGroupData() // 선택한 관계사 세팅
          this.selectOrg(this.selectedOrg, true) // 선택한 조직 세팅
          if (this.$refs?.folderGroup) this.$refs.folderGroup.openFoldPanel(this.selectedOrg) // 선택한 조직 있는 panel 펼쳐지게 세팅
        }
      } catch (error) {
        console.error(error)
        // IAM033 ? 동일한 프로젝트명이 존재합니다.
        // create ? 프로젝트 생성에 실패했습니다.
        // else 프로젝트 수정에 실패했습니다.
        const message = error.code === 'IAM033' ? this.$t('common.ALERT.PROJECT.034') : createMode ? this.$t('common.ALERT.PROJECT.041') : this.$t('common.ALERT.PROJECT.050')

        this.$alert(message)
      } finally {
        this.pjModalLoading = false
        this.showProjectModal[this.showProjectModal.mode] = false
      }
    },
    /**
     * [공통] 공통 프로젝트의 params 세팅 (commonProject)
     */
    setCommonProjectParams () {
      const commonGroups = []
      const commonGroupsIdx = []
      const ownerGroupsIdx = this.ownerCompanyInfo.ownerCompany.map(item => item.groupIdx)
      this.ownerCompanyInfo.commonCompany.forEach(group => {
        group.children.forEach(item => {
          if (!ownerGroupsIdx.includes(item.groupIdx)) return

          commonGroups.push({
            amount: item.amount,
            groupIdx: item.groupIdx,
            groupName: item.groupName,
            parentGroupName: group.name
          })
          commonGroupsIdx.push(item.groupIdx)
        })
      })

      const ownerGroups = this.ownerCompanyInfo.ownerCompany.filter(group => !commonGroupsIdx.includes(group.groupIdx))
      const noGroupIdxOwnerGroups = this.changeOriginOwnerCompany.filter(c => !c.groupIdx)

      return {
        distributeGroups: [...ownerGroups, ...commonGroups, ...noGroupIdxOwnerGroups].map(item => {
          return {
            amount: item.amount || 1,
            groupIdx: item.groupIdx,
            groupName: item.groupName,
            parentGroupName: item.parentGroupName || null
          }
        }),
        distributeStandardName: this.ownerCompanyInfo.distName // 배부기준명

      }
    },
    /**
     * 소유자 변경 버튼 클릭 시 실행
     */
    openManagerModal () {
      this.projectModal.ownerModalShow = true
    },
    /**
     * 담당자 조회 메소드
     */
    async getManagerList () {
      let mngrList
      if (this.isPlusVer) {
        // 관리자 전체 리스트
        mngrList = await API.iam.getUserList({ isAdmin: true })
        if (mngrList) {
          this.projectModal.ownerModalList = mngrList.userList.map(man => {
            return {
              userIdx: man.userIdx,
              userId: man.userId,
              userName: man.userName,
              userPosition: man.userPosition,
              userGroup: man.userGroupName,
              userCompany: man.userCompanyName
            }
          })
        }
      } else {
        // 관계사 조직 내 중간관리자
        mngrList = this.projectModal.midMngrList
        if (mngrList) {
          this.projectModal.ownerModalList = mngrList.map(man => {
            return {
              userIdx: man.userIdx,
              userId: man.userId,
              userName: man.userName,
              mngrType: man.managerType ? '부' : '정',
              userCompany: this.projectModal.company.name,
              isSelectable: !!man.userIdx // grid 에서 선택 할 수 있는지 여부 설정
            }
          })
        }
      }
      console.log('소유자 변경 선택 시 (담당자)리스트:', this.projectModal.ownerModalList)
    },
    /**
     * 모달에서 선택한 관계사 데이터를 가져옵니다.
     * @param [Array] 모달에서 선택한 관계사들 el-tag에 넣을 수 있도록 변환합니다.
     */
    setMapping (parameter, range) {
      console.log('@setMapping', parameter)
      const [param] = parameter
      const { mngrType, userName, userPosition } = param.dataItem
      const tagName = this.isPlusVer
        ? `${userPosition} ${userName}`
        : `${this.$t('admin.ACCOUNT.middleManager')}(${mngrType}) ${userName}` // 중간 관리자 ()
      this.projectModal.projectOwner = {
        ...param.dataItem,
        tag: tagName
      }
    },
    /**
     * 프로젝트 명 중복 확인
     * @param {String} projectName 검사 할 프로젝트 명
     * @param {String} exceptName 검사에서 제외 할 프로젝트 명
     */
    async checkReduplication (
      projectName = this.projectModal.projectName,
      exceptName = this.showProjectModal.mode === 'change' ? this.selectedPrj?.projectName : undefined
    ) {
      let param = { companyIdx: this.projectModal.company.idx, isDeleted: false }
      if (this.packageType === 'PL') param = Object.assign(param, { isAdmin: true })
      const res = await API.iam.getProject(param)
      if (res) {
        // const projects = res.map(item => {
        //   if (!item.isDeleted) return item.projectName
        // })
        // const filteredProjects = projects.filter(item => item)
        // this.projectModal.availablePrjName = !filteredProjects.includes(this.projectModal.projectName)

        let checkNames

        const allNames = res.map(item => item.projectName?.trim())

        if (exceptName) checkNames = allNames.filter(name => name !== exceptName.trim())
        else checkNames = allNames
        checkNames = checkNames.map(name => name.toLowerCase())
        this.projectModal.availablePrjName = !checkNames?.includes(projectName?.trim().toLowerCase())
      }
    },
    searchInputChange (val) {
      this.searchText = val
    },
    /**
     * 첨부 파일 다운로드
     */
    downloadFile (filePath) {
      if (!filePath) return

      this.$confirm(this.$t('common.CONFIRM.NUTA.002')) // 해당 파일을 다운로드 하시겠습니까?
        .then(async () => {
          try {
            const fileIdx = filePath.fileIdx
            if (fileIdx) {
              window.location.assign(process.env.VUE_APP_ZUUL_URL + '/api/cmp/v1/iam/project/file/download?fileIdx=' + fileIdx)
            }
          } catch (error) {
            this.$alert(this.$t('common.ALERT.BASE.071'), { // 파일 다운로드에 문제가 발생했습니다.<br>관리자 문의 바랍니다.
              dangerouslyUseHTMLString: true
            })
          }
        }).catch(() => false)
    },
    /**
     * 사번 블라인드 처리
     */
    semiBlindId (id) {
      if (id) {
        // const length = id.length
        // const start = id.substring(0, 2)
        // const last = id.substring(length - 2, length)
        // let mid = ''
        // for (let i = 0; i < length - 4; i++) {
        //   mid += '*'
        // }
        // return start + mid + last
        return '**' + id.substring(2)
      } else {
        return null
      }
    },
    /**
     * 역할 클릭 시 툴팁 노출
     */
    showTooltip (idx) {
      // console.log('showTooltip', idx, this.projectModal.operatingMngrList[idx].tooltipShow)
      if (this.selectedIdx !== idx) {
        // 초기화
        this.projectModal.operatingMngrList = this.projectModal.operatingMngrList.map(item => {
          item.tooltipShow = false
          return item
        })
      }
      this.selectedIdx = idx
      this.projectModal.operatingMngrList[idx].tooltipShow = !this.projectModal.operatingMngrList[idx].tooltipShow
      this.$forceUpdate()
    },
    /**
     * 프로젝트 명 툴팁 여부
     @param {Mouseover Event} e 마우스 오버 이벤트
     @param {Object} item 프로젝트
     */
    isEllipsisActive (e, item) {
      if (!e?.target || e.target.className === '__name') return

      const el = e.target
      const parentEl = el.parentElement
      if (!parentEl) return
      // const isEllipsis = el.offsetWidth < el.scrollWidth
      const isEllipsis = el.offsetWidth > parentEl.offsetWidth
      item.ellipsisActive = isEllipsis
      this.$forceUpdate()
    },
    /**
     * 파일 변경시 이벤트
     * @param    {Object} file 업로드된 파일 한개
     * @param    {Array} formData 업로드된 파일 리스트
     * @return   {void}
     */
    changeFile (file, fileList) {
      if (file.size > (1024 * 1024 * 100)) { // 100MB 이하 파일만 업로드 가능
        this.fileList = []
        return this.$alert(this.$t('common.ALERT.PROJECT.059', { size: '100MB' }))
      }
      this.fileList = !fileList.length ? [...fileList] : fileList.slice(-1)
    },

    // =================== PUBLIC =======================
    /**
     * [Public] 활성화된 프로젝트 키를 조회합니다.
     */
    async getPublicProjectKey (projectIdx) {
      const reset = () => {
        this.accessKeyField = ''
        this.secretAccessKeyField = ''

        this.selectedPrj.accessKey = ''
        this.selectedPrj.secretKey = ''
      }
      try {
        const { data } = await API.aws.getPublicProjectKey({ projectIdx })
        if (data) {
          const { accessKey, secretKey } = data
          this.selectedPrj = {
            ...this.selectedPrj,
            accessKey,
            secretKey
          }

          this.accessKeyField = accessKey
          this.secretAccessKeyField = secretKey
        } else reset()
        return data
      } catch (error) {
        // console.error(error?.message)
        reset()
      } finally {
        this.isMasked = true
        this.isUpdatingKey = false
      }
    },
    /**
     * 계정 정보 > 비밀번호 확인 성공
     */
    async confirmPassword () {
      this.isMasked = false
      this.checkPasswordModal = false
    },
    maskKeys () {
      this.isMasked = true
    },
    /**
     * 계정 정보 > 액세스 키 변경 완료
     */
    updateProjectKey () {
      const { projectName, projectIdx, accessKey, secretKey } = this.selectedPrj

      // 동일한 키 입력 시
      if (
        accessKey === this.accessKeyField &&
        secretKey === this.secretAccessKeyField
      ) {
        this.isUpdatingKey = false
        return
      }

      this.$confirm('Access Key를 변경하시겠습니까?').then(async () => {
        try {
          this.loading.isUpdatingKey = true
          const result = await API.aws.updateAWSProjectKey({
            name: projectName,
            projectIdx,
            accessKey: this.accessKeyField,
            secretKey: this.secretAccessKeyField
          })
          console.log(result)

          this.$alert('Access Key를 변경했습니다.')

          return await this.getPublicProjectKey(this.selectedPrj.projectIdx)
        } catch (error) {
          let alertMsg = this.$t('common.ALERT.PROJECT.075') // 'Access Key 변경에 문제가 발생했습니다.'

          const msg = {
            'Already exist project key': this.$t('common.ALERT.PROJECT.073'), // '이미 사용 중인 Access Key 입니다.',
            'project key is not available': this.$t('common.ALERT.PROJECT.074') // 'Access Key가 올바르지 않습니다.'
          }
          if (msg[error.response.data.message]) alertMsg = msg[error.response.data.message]
          return this.$alert(alertMsg, () => false)
        } finally { this.loading.isUpdatingKey = false }
      }).catch(() => false)
    },
    changeColor (e) {
      e.target.style.color = '#3E57C9'
      setTimeout(() => {
        e.target.style.color = '#9596A0'
      }, 100)
    },
    copyText (refName) {
      if (!this.$refs[refName]) return
      const inputEls = this.$refs[refName].$el?.getElementsByTagName('input')
      if (!inputEls?.length) return

      const copyEl = inputEls[0]
      copyEl.select()

      navigator.clipboard
        .writeText(copyEl.value)
        .then(() => {
          this.$alert('복사에 성공하였습니다.')
        })
        .catch(() => {
          this.$alert('복사에 실패했습니다.')
        })
    }
  },
  data () {
    return {
      immutableCompanyList: [],
      initialProjectData: null,
      selectedGroupName: undefined,
      searchText: '', // 관계사 선택 dropdown 검색 텍스트
      menuOpened: false,
      treeData: [], // 기본 트리 데이터
      allTreeData: [], // 가공된 트리 데이터
      selectedCompany: null, // 선택된 관계사
      selectedOrg: null, // 선택된 조직
      projectList: [], // 프로젝트 리스트
      selectedPrj: null, // 선택된 프로젝트
      orgChrtModalShow: false, // 조직도 모달 show
      showProjectModal: { // 프로젝트 생성 모달
        mode: null,
        create: false,
        change: false
      },
      projectModal: { // 프로젝트 생성 모달 데이터
        isCommon: false, // 공통 프로젝트 여부
        isSelectMode: false, // 관계사 조직 선택 모드 변경
        companyList: null, // 관계사 리스트
        company: { // 선택된 관계사
          idx: null,
          name: null
        },
        organizationList: null, // 조직 리스트
        organization: {
          idx: null,
          name: null
        }, // 선택된 조직
        projectOwner: null, // 프로젝트 소유자
        projectName: null, // 프로젝트 명
        availablePrjName: null, // 프로젝트명 사용 가능 여부
        ownerCompany: [], // 소유관계사
        operatingMngrList: [], // 운영 담당자 그리드 데이터
        mngrRole: {}, // 운영 담당자 선택된 역할
        mngrRoleLists: {}, // 운영 담당자 변경 담당역할 리스트 세팅
        allRoleLists: [], // 모든 역할
        isBilling: true, // 빌링여부
        noteText: '', // 비고
        midMngrList: [], // 중간관리자 리스트
        ownerModalList: [], // 소유자 선택 모달 리스트
        ownerModalShow: false, // 소유자 변경 모달 show
        showOperModal: false // 운영담당자 변경 모달
      },
      pjDetailLoading: false,
      pjModalLoading: false,
      prevProjecName: '',
      prevCompanyIdx: null,
      userPermRoleCompanyList: [], // 역할 내 포함되는 관계사 리스트
      dropdownLoading: true,
      selectedIdx: null, // 운영담당자 툴팁 용
      loading: {
        groupTree: false, // 그룹 트리 정보 조회
        delete: false, // 프로젝트 삭제
        isGetGroupInfo: false, // 조직 정보 조회
        isUpdatingKey: false // [public] Access Key 업데이트
      },

      // 공통
      ownerCompanyInfo: {
        distName: '',
        ownerCompany: [], // 소유관계사
        commonCompany: [] // 공통관계사
      },
      allCompanyOptions: [],
      fileList: [],
      changeOriginOwnerCompany: [],

      // ============= PUBLIC ==============
      accessKeyField: '',
      secretAccessKeyField: '',
      accessKey: '',
      secretAccessKey: '',
      isMasked: true,
      isUpdatingKey: false, // 키 정보 변경 중인지?
      hasAccessKeys: false,
      checkPasswordModal: false // 비밀번호 확인 모달 핸들러
    }
  }
}
</script>
<style lang="scss">
.company-area__dropdown {
  .ti-dropdown-item {
    width: 610px;
    max-height: 230px;
    padding: 10px 20px 20px 20px;
    border-bottom-right-radius: 6px;
    border-bottom-left-radius: 6px;
    .ti-dropdown-item-value__item {
      padding: $gap-s 0;
      &:hover {
        cursor: pointer;
        background-color: rgb(244, 248, 251);
      }
    }
  }
}
.appint-mngr__popper {
  .popper__arrow {
    border-top-color: transparent !important;
    &::after {
      border-top-color: transparent !important;
    }
  }
}
.file-down-comp {
  > .file-down-wrap {
    padding-top: 2px !important;
    .file-name {
      overflow: hidden;
      max-width: 150px;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: $text-dark-gray !important;
    }
  }
}

.secret-access-key-input {
  .el-input__inner[type=text] {
    & + .el-input__suffix {
      .el-icon-view {
        position: relative;
        &::after {
          content: '';
          position: absolute;
          top: 26%;
          left: 50%;
          transform: translate(-50%, -50%);
          height: 16px;
          width: 1px;
          transform: rotate(-45deg);
          background: $main-red;
        }
      }
    }
  }
}

.dashboard-panel.-right.-public .panel-head { padding: 10px 0 0 0; }
</style>
<style lang="scss" scoped>
 .-disabled {
    display:none;
  }

.set-project-body {
  display: flex;
  .body-panel {
    &.-left {
      width: 610px;
      margin-right: 30px;
      .company-area {
        .company-area__dropdown {
          width: 100%;
          .dropdown__button {
            cursor: pointer;
            padding: 20px;
            height: 60px;
            border: 1px solid $purple-gray;
            box-sizing: border-box;
            border-radius: 6px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            transition: opacity 0.2s ease-out;
            .el-icon-arrow-down {
              transition: all 0.2s ease-out;
              color: #fff;
              font-weight: bold;
              &.-rotate {
                transform: rotate(0.5turn);
              }
            }
            &.-menu-opened {
              color: #888;
              background: $white;
              border-color: #D9D9D9;
              border-bottom-left-radius: 0;
              border-bottom-right-radius: 0;
              .el-icon-arrow-down {
                color: $text-black;
              }
            }
          }
          .company-search {
            position: relative;
            margin-bottom: 10px;
            .company-search__input {
              border: none;
              border-bottom: 1px solid #E0E0E0;
              padding: 10px 0;
              width: 100%;
              &::placeholder {
                color: $text-lighter-gray;
              }
              &:focus {
                outline: none;
              }
            }
            .company-search__icon {
              position: absolute;
              right: 0;
              top: 10px;
              display: inline-block;
              background: url('../../../../assets/images/icon-search.svg') no-repeat;
              width: 15px;
              height: 15px;
            }
          }
        }
        .company-area__folder {
          margin-top: 10px;
          height: 510px;
          &.-public { height: 600px; }
          &.-empty {
            border: 1px solid $purple-gray;
            border-radius: 6px;
            color: $input-placeholder;
            font-weight: normal;
            font-size: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
        }
      }
    }
    &.-right {
      width: calc(100% - 610px - 30px);
      .project-area {
        display: grid;
        grid-template-columns: 350px 610px;
        grid-template-rows: 50px 530px;
        height: 580px;
        &.-empty {
          border: 1px solid $purple-gray;
          border-radius: 6px;
          color: $input-placeholder;
          font-weight: normal;
          font-size: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .project-area__header {
          background: #353951;
          font-weight: bold;
          font-size: 14px;
          color: $white;
          display: grid;
          justify-content: center;
          align-items: center;
          &.-left {
            border-top-left-radius: 6px;
          }
          &.-right {
            border-top-right-radius: 6px;
          }
        }
        .project-area__body {
          &.-left {
            border-left: 1px solid $purple-gray;
            border-bottom: 1px solid $purple-gray;
            box-sizing: border-box;
            border-bottom-left-radius: 6px;
            overflow-y: auto;
            > ul > li {
              display: flex;
              align-items: center;
              gap: 8px;
              padding: 12px 26px;
              border-bottom: 1px solid $purple-gray;
              cursor: pointer;
              &.-selected {
                background-color: $white;
                color: $text-dark-gray;
              }
              > .__tag {
                padding: 0 3px;
              }
              > .__name {
                display: inline-block;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                width: 230px;
                margin-left: 8px;
              }
            }
          }
          &.-right {
            background: $white;
            border-bottom-right-radius: 6px;
            display: grid;
            grid-template-columns: 210px auto;
            padding-top: 10px;
            padding-bottom: 10px;
            .project-area__body__inner {
              &.-left {
                > ul > li {
                  font-size: 13px;
                  line-height: 40px;
                  padding-left: 50px;
                  color: $text-black;
                }
              }
              &.-right {
                > ul > li {
                  color: $text-dark-gray;
                  font-size: 13px;
                  line-height: 40px;
                  font-weight: normal;
                }
                > .project-area__body__inner__history {
                  color: $text-dark-gray;
                  font-weight: normal;
                  line-height:1.7em;
                  margin-top: 15px;
                  width: 370px;
                  height: 365px;
                  box-sizing: border-box;
                  border-radius: 0px 15px 15px 15px;
                  background-color: #F7F7F7;
                  padding: 15px 20px;
                  overflow-y: auto;
                  .history-content > li {
                    margin-bottom: 15px;
                    &.-has-history {
                      display: grid;
                      grid-template-columns: 70px auto;
                      grid-column-gap: 10px;
                    }
                    > span {
                      color: $text-lighter-gray;
                    }
                    > div {
                      .title {
                        color: $text-black;
                      }
                      .cont {
                        color: $text-dark-gray;
                        &.-with-file {
                          display: flex;
                          .file-down-comp {
                            margin-left: 5px;
                            line-height: 1em;
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}
.opratr-rgstr-modal {
  .title {
    display: flex;
    align-items: center;
    height: 42px;
    background-color: #2A2D44;
    margin-bottom: 15px;
    div {
      display: flex;
      justify-content: center;
      &:first-child {
        width: 100px;
      }
      &:last-child {
        width: calc(100% - 100px);
      }
    }
  }
  .opratr-rgstr-list {
    margin-bottom: $gap;
    > .opratr-rgstr-item {
      display: flex;
      align-items: center;
      margin-bottom: $gap-s;
      .opratr-rgstr-label {
        font-size: 13px;
        font-weight: normal;
        min-width: 100px;
        padding-left: 20px;
        box-sizing: border-box;
      }
    }
  }
  .divider {
    height: 1px;
    background-color: #3D435E;
  }
}

  .project-modal {
    .modal-body {
      overflow-y: auto;
      overflow-x: hidden;
      max-height: 70vh;
      border-top: 1px solid $border-color;
      .tag {
        .name {
          font-size: 12px;
          color: $text-color;
        }
      }
      .-cp-unselected {
        color: #9D9D9D;
      }
      .modal__company {
        .__select-company {
          display: flex;
          &.--change-mode {
            align-items: center;
            .-modal-button {
              margin-left: 24px;
            }
          }
          .__organization {
            margin-left: 10px;
          }
        }
        .__tags {
          margin-top: 10px;
        }
      }
      .modal__project-name {
        .__input-pj-name {
          display: flex;
          .__input {
            width: 200px;
            margin-right: 10px;
          }
        }
        .__msg {
          margin-top: 8px;
          font-size: 12px;
          &.--is-available {
            color: $primary;
            .check-icon {
              display: inline-block;
              background: url('../../../../assets/images/icon-check.svg') no-repeat;
              width: 13px;
              height: 8.8px;
              margin-right: 3px;
            }
          }
          &.--is-not-available {
            color: $main-red;
            .check-icon {
              display: inline-block;
              background: url('../../../../assets/images/icon-x.svg') no-repeat;
              background-size: cover;
              width: 12px;
              height: 12px;
              margin-right: 3px;
              position: relative;
              top: 2px;
            }
          }
        }
      }
      .modal__possess-company {
        position: relative;
        .dimmed-wrap {
          position: absolute;
          top: 0;
          right: 0;
          left: -0px;
          bottom: 0;
          background-color: $black;
          opacity: .8;
          z-index: 10;
          display: flex;
          align-items: center;
          gap: $gap;
          justify-content: center;
        }
        div.contents-wrapper {
          .wrapper {
            display: flex;
            align-items: center;
            margin-bottom: 5px;
            .__select-box {
              width: 306px;
            }
            .__delete-icon {
              display: inline-block;
              background: url('../../../../assets/images/icon-trashcan.png') no-repeat;
              width: 12px;
              height: 16px;
              cursor: pointer;
              margin-left: 15px;
            }
          }
          .__add-button{
            width: 306px;
            background: rgba(193, 188, 208, 0.05);
            border: 1px dashed #727797;
            box-sizing: border-box;
            border-radius: 2px;
            height: 32px;
            display: flex;
            justify-content: center;
            align-items: center;
            cursor: pointer;
            .add-icon {
              display: inline-block;
              background: url('../../../../assets/images/icon-add.svg') no-repeat;
              width: 14px;
              height: 14px;
            }
          }
        }
      }
      .modal__appoint-mngr {
        .-cp-selected {
          .title {
            display: flex;
            align-items: center;
            height: 42px;
            background-color: #2A2D44;
            div {
              display: flex;
              justify-content: center;
              &:first-child {
                width: 150px;
              }
              &:nth-child(2) {
                width: calc(100% - 200px);
              }
              &:last-child {
                width: 50px;
              }
            }
          }
          .opratr-list {
            > .opratr-item {
              display: flex;
              align-items: center;
              padding: 10px 0;
              border-bottom: 1px solid #2A2D44;
              &.--empty {
                display: block;
                text-align: center;
                color: #727797;
              }
              .opratr-upper-role {
                font-size: 13px;
                font-weight: normal;
                width: 150px;
                box-sizing: border-box;
                text-align: center;
              }
              .opratr-role {
                width: calc(100% - 200px);
                text-align: center;
                .__roleName {
                  cursor: pointer;
                }
                .deleted-role { color: $input-placeholder; }
              }
              .opratr-edit-icon {
                width: 50px;
                text-align: center;
                > span {
                  display: inline-block;
                  background: url('../../../../assets/images/icon-edit.svg') no-repeat;
                  width: 16px;
                  height: 16px;
                  cursor: pointer;
                }
              }
            }
          }
        }
      }
      .modal__add-file {
        .wrapper {
          display: flex;
        }
      }
    }
  }
  .company-tooltip-popper {
    .popper-content {
      line-height: 1.5em;
      color: $text-black;
      font-weight: normal;
    }
  }

.tag {
  margin-right: 5px;
  font-size:12px;
  font-weight:500;
  &.is-waiting {
    color: $main-blue;
  }
  &.is-deleting {
    color: $yellow;
  }
}

.access-key-form {
  height:auto;
  padding-right:35px;
  .form-control {
    .access-key-label {
      display:block;
      color: #333;
      font-weight: 500;
      margin:10px 0px;
    }

    .copy-icon {
      cursor: pointer;
      position:absolute;
      top: 50%;
      right: 5px;
      transform:translateY(-50%);
      color: #9596A0;
      &::before { font-size: 14px; }
      &:hover { color: $primary; }
    }
  }
}
</style>
