<!--
  * 파일명 : MeteringModifyResource.vue
  * 파일 기능 :
  * 작성자 : 김예담 외 1명
  * 최종 작성일 : 2020-08-25
  * License By Shinsegae I&C
  * 2020-08-25 fix: 버튼 통일 & 테이블 상단 total갯수와 버튼 영역 통일
 -->

<template>
  <div class="metering-modify-resource">
    <section class="metering-modify-show">
      <g-tab
        :data="meteringTabs"
      >
        <template #modify>
          <filtering-component
            :data="modifyTableFilter"
            @selected="selectFilter"
          />
          <section class="table-top-wrap">
            <total-count
              :total-count="modifyGridData.length"
            />
          </section>

          <section class="table-area">
            <metering-modify-list :data="modifyGridData" />
          </section>
        </template>
        <!-- /. 변경 -->

        <template #remove>
          <filtering-component
            :data="modifyTableFilter"
            @selected="selectFilter"
          />
          <section class="table-top-wrap">
            <total-count
              :total-count="deleteGridData.length"
            />
          </section>
          <section class="table-area">
            <metering-delete-list :data="deleteGridData" />
          </section>
        </template>
        <!-- /. 삭제 -->
      </g-tab>
    </section>
  </div>
</template>
<script>

import MeteringModifyList from './MeteringModifyList'
import MeteringDeleteList from './MeteringDeleteList'
export default {
  name: 'MeteringModifyResource',
  components: {
    'metering-modify-list': MeteringModifyList,
    'metering-delete-list': MeteringDeleteList
  },
  methods: {
    selectFilter (selectedArr) {
      console.log(selectedArr)
    }
  },
  data () {
    return {
      meteringTabs: [
        { field: 'modify', name: '변경', isActive: true }, // routeTo: 'task-todo-list'
        { field: 'remove', name: '삭제' } // routeTo: 'task-done-list'
      ],
      modifyType: '변경',
      modifyTableFilter: [
        {
          field: 'relatedCop',
          label: '관계사',
          children: [
            { field: 'shinsegae', name: '신세계' },
            { field: 'emart', name: '이마트' },
            { field: 'starbucks', name: '스타벅스' }
          ]
        }, {
          field: 'department',
          label: '부서',
          children: [
            { field: 'all', name: '전체' },
            { field: 'dep1', name: '부서1' }
          ]
        }, {
          field: 'processState',
          label: '처리상태',
          children: [
            { field: 'all', name: '전체' },
            { field: 'complete', name: '완료' },
            { field: 'delay', name: '지연' },
            { field: 'wait', name: '대기' }
          ]
        }, {
          field: 'date',
          label: '자원변경일시',
          children: [
            { field: 'asc', name: '오름차순' },
            { field: 'desc', name: '내림차순' }
          ]
        }
      ],

      modifyGridData: [
        {
          processState: 'wait',
          relationCop: '이마트',
          department: '발주',
          name: '신세빈',
          cluster: 'SSG_TEST',
          host: 'scsta-ihpWEB1',
          ip: '61.250.84.100',
          beforeVcpu: 1,
          beforeMemory: 100,
          beforeStorage: 50,
          beforeSw: 6,
          afterVcpu: 1,
          afterMemory: 100,
          afterStorage: 50,
          afterSw: 6,
          date: new Date(),
          memo: 3
        },
        {
          processState: 'complete',
          relationCop: '신세계',
          department: '발주',
          name: '신세빈',
          cluster: 'SSG_TEST',
          host: 'scsta-ihpWEB1',
          ip: '61.250.84.100',
          beforeVcpu: 1,
          beforeMemory: 100,
          beforeStorage: 50,
          beforeSw: 6,
          afterVcpu: 1,
          afterMemory: 100,
          afterStorage: 50,
          afterSw: 6,
          date: new Date(),
          memo: 3
        },
        {
          processState: 'ing',
          relationCop: '신세계',
          department: '발주',
          name: '신세빈',
          cluster: 'SSG_TEST',
          host: 'scsta-ihpWEB1',
          ip: '61.250.84.100',
          beforeVcpu: 1,
          beforeMemory: 100,
          beforeStorage: 50,
          beforeSw: 6,
          afterVcpu: 1,
          afterMemory: 100,
          afterStorage: 50,
          afterSw: 8,
          date: new Date(),
          memo: 4
        },
        {
          processState: 'ing',
          relationCop: '신세계',
          department: '발주',
          name: '신세빈',
          cluster: 'SSG_TEST',
          host: 'scsta-ihpWEB1',
          ip: '61.250.84.100',
          beforeVcpu: 1,
          beforeMemory: 100,
          beforeStorage: 50,
          beforeSw: 6,
          afterVcpu: 1,
          afterMemory: 100,
          afterStorage: 50,
          afterSw: 8,
          date: new Date(),
          memo: 4
        },
        {
          processState: 'wait',
          relationCop: '이마트',
          department: '발주',
          name: '신세빈',
          cluster: 'SSG_TEST',
          host: 'scsta-ihpWEB1',
          ip: '61.250.84.100',
          beforeVcpu: 1,
          beforeMemory: 100,
          beforeStorage: 50,
          beforeSw: 6,
          afterVcpu: 1,
          afterMemory: 100,
          afterStorage: 50,
          afterSw: 6,
          date: new Date(),
          memo: 3
        },
        {
          processState: 'complete',
          relationCop: '신세계',
          department: '발주',
          name: '신세빈',
          cluster: 'SSG_TEST',
          host: 'scsta-ihpWEB1',
          ip: '61.250.84.100',
          beforeVcpu: 1,
          beforeMemory: 100,
          beforeStorage: 50,
          beforeSw: 6,
          afterVcpu: 1,
          afterMemory: 100,
          afterStorage: 50,
          afterSw: 6,
          date: new Date(),
          memo: 3
        },
        {
          processState: 'complete',
          relationCop: '이마트',
          department: '발주',
          name: '신세빈',
          cluster: 'SSG_TEST',
          host: 'scsta-ihpWEB1',
          ip: '61.250.84.100',
          beforeVcpu: 1,
          beforeMemory: 100,
          beforeStorage: 50,
          beforeSw: 6,
          afterVcpu: 1,
          afterMemory: 100,
          afterStorage: 50,
          afterSw: 6,
          date: new Date(),
          memo: 3
        },
        {
          processState: 'delay',
          relationCop: '이마트',
          department: '발주',
          name: '신세빈',
          cluster: 'SSG_TEST',
          host: 'scsta-ihpWEB1',
          ip: '61.250.84.100',
          beforeVcpu: 1,
          beforeMemory: 100,
          beforeStorage: 50,
          beforeSw: 6,
          afterVcpu: 1,
          afterMemory: 100,
          afterStorage: 50,
          afterSw: 6,
          date: new Date(),
          memo: 3
        },
        {
          processState: 'complete',
          relationCop: '신세계',
          department: '발주',
          name: '신세빈',
          cluster: 'SSG_TEST',
          host: 'scsta-ihpWEB1',
          ip: '61.250.84.100',
          beforeVcpu: 1,
          beforeMemory: 100,
          beforeStorage: 50,
          beforeSw: 6,
          afterVcpu: 1,
          afterMemory: 100,
          afterStorage: 50,
          afterSw: 6,
          date: new Date(),
          memo: 3
        },
        {
          processState: 'wait',
          relationCop: '신세계',
          department: '발주',
          name: '신세빈',
          cluster: 'SSG_TEST',
          host: 'scsta-ihpWEB1',
          ip: '61.250.84.100',
          beforeVcpu: 1,
          beforeMemory: 100,
          beforeStorage: 50,
          beforeSw: 6,
          afterVcpu: 1,
          afterMemory: 100,
          afterStorage: 50,
          afterSw: 8,
          date: new Date(),
          memo: 4
        },
        {
          processState: 'ing',
          relationCop: '신세계',
          department: '발주',
          name: '신세빈',
          cluster: 'SSG_TEST',
          host: 'scsta-ihpWEB1',
          ip: '61.250.84.100',
          beforeVcpu: 1,
          beforeMemory: 100,
          beforeStorage: 50,
          beforeSw: 6,
          afterVcpu: 1,
          afterMemory: 100,
          afterStorage: 50,
          afterSw: 8,
          date: new Date(),
          memo: 4
        }
      ],

      deleteGridData: [
        {
          processState: 'wait',
          relationCop: '이마트',
          department: '발주',
          name: '신세빈',
          cluster: 'SSG_TEST',
          host: 'scsta-ihpWEB6',
          ip: '61.250.84.100',
          appDate: '2020.06.15',
          hopeDate: '2020.06.30',
          dueDate: '2020.07.30 예정',
          memo: 3
        },
        {
          processState: 'ing',
          relationCop: '이마트',
          department: '발주',
          name: '신세빈',
          cluster: 'SSG_TEST',
          host: 'scsta-ihpWEB6',
          ip: '61.250.84.100',
          appDate: '2020.06.15',
          hopeDate: '2020.06.30',
          dueDate: '2020.07.30 예정',
          memo: 0
        },
        {
          processState: 'ing',
          relationCop: '이마트',
          department: '발주',
          name: '신세빈',
          cluster: 'SSG_TEST',
          host: 'scsta-ihpWEB6',
          ip: '61.250.84.100',
          appDate: '2020.06.15',
          hopeDate: '2020.06.30',
          dueDate: '2020.07.30 예정',
          memo: 0
        },
        {
          processState: 'delay',
          relationCop: '신세계',
          department: '발주',
          name: '신세빈',
          cluster: 'SSG_TEST',
          host: 'scsta-ihpWEB6',
          ip: '61.250.84.100',
          appDate: '2020.06.15',
          hopeDate: '2020.06.30',
          dueDate: '2020.07.30 예정',
          memo: 5
        },
        {
          processState: 'ing',
          relationCop: '이마트',
          department: '발주',
          name: '신세빈',
          cluster: 'SSG_TEST',
          host: 'scsta-ihpWEB6',
          ip: '61.250.84.100',
          appDate: '2020.06.15',
          hopeDate: '2020.06.30',
          dueDate: '2020.07.30 예정',
          memo: 0
        },
        {
          processState: 'ing',
          relationCop: '이마트',
          department: '발주',
          name: '신세빈',
          cluster: 'SSG_TEST',
          host: 'scsta-ihpWEB6',
          ip: '61.250.84.100',
          appDate: '2020.06.15',
          hopeDate: '2020.06.30',
          dueDate: '2020.07.30 예정',
          memo: 0
        },
        {
          processState: 'complete',
          relationCop: '신세계',
          department: '발주',
          name: '신세빈',
          cluster: 'SSG_TEST',
          host: 'scsta-ihpWEB6',
          ip: '61.250.84.100',
          appDate: '2020.06.15',
          hopeDate: '2020.06.30',
          dueDate: '2020.07.30 예정',
          memo: 0
        },
        {
          processState: 'wait',
          relationCop: '이마트',
          department: '발주',
          name: '신세빈',
          cluster: 'SSG_TEST',
          host: 'scsta-ihpWEB6',
          ip: '61.250.84.100',
          appDate: '2020.06.15',
          hopeDate: '2020.06.30',
          dueDate: '2020.07.30 예정',
          memo: 3
        },
        {
          processState: 'delay',
          relationCop: '신세계',
          department: '발주',
          name: '신세빈',
          cluster: 'SSG_TEST',
          host: 'scsta-ihpWEB6',
          ip: '61.250.84.100',
          appDate: '2020.06.15',
          hopeDate: '2020.06.30',
          dueDate: '2020.07.30 예정',
          memo: 5
        },
        {
          processState: 'ing',
          relationCop: '이마트',
          department: '발주',
          name: '신세빈',
          cluster: 'SSG_TEST',
          host: 'scsta-ihpWEB6',
          ip: '61.250.84.100',
          appDate: '2020.06.15',
          hopeDate: '2020.06.30',
          dueDate: '2020.07.30 예정',
          memo: 0
        },
        {
          processState: 'ing',
          relationCop: '이마트',
          department: '발주',
          name: '신세빈',
          cluster: 'SSG_TEST',
          host: 'scsta-ihpWEB6',
          ip: '61.250.84.100',
          appDate: '2020.06.15',
          hopeDate: '2020.06.30',
          dueDate: '2020.07.30 예정',
          memo: 0
        },
        {
          processState: 'delay',
          relationCop: '신세계',
          department: '발주',
          name: '신세빈',
          cluster: 'SSG_TEST',
          host: 'scsta-ihpWEB6',
          ip: '61.250.84.100',
          appDate: '2020.06.15',
          hopeDate: '2020.06.30',
          dueDate: '2020.07.30 예정',
          memo: 5
        },
        {
          processState: 'ing',
          relationCop: '이마트',
          department: '발주',
          name: '신세빈',
          cluster: 'SSG_TEST',
          host: 'scsta-ihpWEB6',
          ip: '61.250.84.100',
          appDate: '2020.06.15',
          hopeDate: '2020.06.30',
          dueDate: '2020.07.30 예정',
          memo: 0
        },
        {
          processState: 'complete',
          relationCop: '신세계',
          department: '발주',
          name: '신세빈',
          cluster: 'SSG_TEST',
          host: 'scsta-ihpWEB6',
          ip: '61.250.84.100',
          appDate: '2020.06.15',
          hopeDate: '2020.06.30',
          dueDate: '2020.07.30 예정',
          memo: 0
        },
        {
          processState: 'delay',
          relationCop: '신세계',
          department: '발주',
          name: '신세빈',
          cluster: 'SSG_TEST',
          host: 'scsta-ihpWEB6',
          ip: '61.250.84.100',
          appDate: '2020.06.15',
          hopeDate: '2020.06.30',
          dueDate: '2020.07.30 예정',
          memo: 5
        }
      ]
    }
  }
}
</script>
<style lang="scss">
  // .metering-modify-resource {
  // }
</style>
