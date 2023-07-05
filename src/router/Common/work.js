/** 공통, 업무 라우터 */
/** @typedef {import('vue-router').RouteConfig} CRoute */

/** @type {CRoute} */
const workRoutes = {
  path: 'task',
  name: 'task',
  meta: {
    breadcrumbs: ['Task']
  },
  redirect: { name: 'task-list' },
  component: () =>
    import(/* webpackChunkName: 'task' */ '../../views/Task/Nutanix/Task'),
  children: [
    {
      path: 'lists',
      name: 'task-list',
      redirect: { name: 'task-status' },
      meta: {
        breadcrumbs: ['Task', 'Task Status Board']
      },
      component: () =>
        import(
          /* webpackChunkName: 'task-list' */ '../../views/Task/Nutanix/TaskLists'
        ),
      children: [
        {
          path: 'status',
          name: 'task-status',
          meta: {
            breadcrumbs: ['Task', 'Task Status Board']
          },
          component: () =>
            import(
            /* webpackChunkName: 'task-conference-list' */ '../../components/TaskStatusBoard'
            )
        },
        {
          path: 'conference',
          name: 'task-conference', // 사전 협의
          meta: {
            breadcrumbs: ['Task', 'Task Conference']
          },
          component: () =>
            import(
              /* webpackChunkName: 'task-conference-list' */ '../../views/Task/Nutanix/TaskConference/ConferenceList/ConferenceList'
            )
        },
        {
          path: 'todo',
          name: 'task-todo',
          meta: {
            breadcrumbs: ['Task', 'Task Todo']
          },
          component: () =>
            import(
              /* webpackChunkName: 'task-todo' */ '../../views/Task/Nutanix/TaskTodo/TodoList/TodoList'
            )
        },
        {
          path: 'done',
          name: 'task-done',
          meta: {
            breadcrumbs: ['Task', 'Task Done']
          },
          component: () =>
            import(
              /* webpackChunkName: 'task-done' */ '../../views/Task/Nutanix/TaskDone/DoneList/DoneList'
            )
        },
        {
          path: 'approved',
          name: 'task-approved',
          meta: {
            breadcrumbs: ['Task', 'Task Approved']
          },
          component: () =>
            import(
              /* webpackChunkName: 'task-approved' */ '../../views/Task/Nutanix/TaskApproved/ApprovedList/ApprovedList'
            )
        }
      ]
    },

    {
      path: 'process/:step/document/:orderNo', // (step: 사전협의/할일) 보고서 작성
      name: 'task-document',
      meta: {
        breadcrumbs: ['Task', 'Task Document']
      },
      component: () =>
        import(
        /* webpackChunkName: 'task-document' */ '../../components/DocumentDetail/DocumentWorkDetail/DocumentWorkDetail'
        )
    },
    {
      path: 'process/:step/apply-approval/:orderNo', // 결재 신청 페이지
      name: 'task-apply-approval',
      meta: {
        breadcrumbs: ['Task']
      },
      component: () =>
        import(
        /* webpackChunkName: 'task-apply-approval' */ '../../views/Task/Nutanix/ApprovalApply/ApprovalApply'
        )
    },
    {
      // path: 'todo/:field/:id', // 할 일 상세
      path: 'todo/:id', // 할 일 상세
      name: 'todo-detail',
      meta: {
        breadcrumbs: ['Task', 'Task Todo']
      },
      component: () =>
        import(
          /* webpackChunkName: 'todo-detail' */ '../../views/Task/Nutanix/TaskTodo/TodoDetail/TodoDetail'
        )
    },
    {
      // path: 'done/:field/:id', // 한 일 상세
      path: 'done/:id', // 한 일 상세
      name: 'done-detail',
      meta: {
        breadcrumbs: ['Task', 'Task Done']
      },
      component: () =>
        import(
          /* webpackChunkName: 'done-detail' */ '../../views/Task/Nutanix/TaskDone/DoneDetail/DoneDetail'
        )
    },
    {
      // path: 'done/:field/:id', // 한 일 상세
      path: 'done/project/:id', // 한 일 상세
      name: 'done-project-detail',
      meta: {
        breadcrumbs: ['Task', 'Task Done']
      },
      component: () =>
        import(
          /* webpackChunkName: 'done-detail' */ '../../views/Task/Nutanix/TaskDone/DoneDetail/DoneProjectDetail'
        )
    },
    {
      path: 'conference/:id', // 사전협의 상세
      name: 'conference-detail',
      meta: {
        breadcrumbs: ['Task', 'Task Conference']
      },
      component: () =>
        import(
          /* webpackChunkName: 'conference-detail' */ '../../views/Task/Nutanix/TaskConference/ConferenceDetail/ConferenceDetail'
        )
    },
    { // vmware 업무 추가 시
      path: 'conference/vmw/:id',
      name: 'conference-vmw-detail',
      meta: {
        breadcrumbs: ['Task', 'Task Conference']
      },
      component: () =>
        import(
        /* webpackChunkName: 'conference-detail' */ '../../views/Task/VMW/TaskConference/ConferenceDetail/ConferenceDetail'
        )
    },

    {
      path: 'detail/:approvalNo', // 결재함 상세
      name: 'approved-detail',
      meta: {
        breadcrumbs: ['Task', 'Task Approved']
      },
      component: () =>
        import(
          /* webpackChunkName: 'approved-detail' */ '../../views/Task/Nutanix/TaskApproved/ApprovedDetail/ApprovedDetail'
        )
    },
    {
      path: 'conference/aws/:id', // 사전협의 상세
      name: 'conference-aws-detail',
      meta: {
        breadcrumbs: ['Task', 'Task Conference']
      },
      component: () =>
        import(
          /* webpackChunkName: 'conference-detail' */ '../../views/Task/AWS/ConferenceDetail/ConferenceDetail'
        )
    },
    {
      path: 'todo/aws/:id', // 할일 상세
      name: 'todo-aws-detail',
      meta: {
        breadcrumbs: ['Task', 'Task Todo']
      },
      component: () =>
        import(
          /* webpackChunkName: 'conference-detail' */ '../../views/Task/AWS/Todo/TodoDetail'
        )
    },
    {
      path: 'done/aws/:id', // 사전협의 상세
      name: 'done-aws-detail',
      meta: {
        breadcrumbs: ['Task', 'Task Done']
      },
      component: () =>
        import(
          /* webpackChunkName: 'conference-detail' */ '../../views/Task/AWS/Done/DoneDetail'
        )
    },
    {
      path: 'approved/aws/:approvalNo', // 사전협의 상세
      name: 'approved-aws-detail',
      meta: {
        breadcrumbs: ['Task', 'Task Approved']
      },
      component: () =>
        import(
          /* webpackChunkName: 'conference-detail' */ '../../views/Task/AWS/Approved/ApprovedDetail'
        )
    }
  ]
}

export default workRoutes
