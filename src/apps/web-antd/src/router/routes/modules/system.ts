import type { RouteRecordRaw } from 'vue-router';

// import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    path: '/content',
    name: 'Content',
    meta: {
      icon: 'lucide:folder',
      title: '内容管理',
      order: 1,
    },
    children: [
      {
        path: '/content/counselor',
        name: 'ContentCounselor',
        meta: {
          icon: 'lucide:user-check',
          title: '咨询师管理',
        },
        component: () => import('#/views/content/counselor/index.vue'),
      },
      {
        path: '/content/assessment',
        name: 'ContentAssessment',
        meta: {
          icon: 'lucide:clipboard-list',
          title: '测评问卷',
        },
        component: () => import('#/views/content/assessment/index.vue'),
      },
      {
        path: '/content/activity',
        name: 'ContentActivity',
        meta: {
          icon: 'lucide:users',
          title: '团队活动',
        },
        component: () => import('#/views/content/activity/index.vue'),
      },
      {
        path: '/content/faq',
        name: 'ContentFaq',
        meta: {
          icon: 'lucide:help-circle',
          title: '常见问题',
        },
        component: () => import('#/views/content/faq/index.vue'),
      },
      {
        path: '/content/evaluation',
        name: 'ContentEvaluation',
        meta: {
          icon: 'lucide:star',
          title: '评价管理',
        },
        component: () => import('#/views/content/evaluation/index.vue'),
      },
    ],
  },
  {
    path: '/order',
    name: 'Order',
    meta: {
      icon: 'lucide:shopping-cart',
      title: '订单管理',
      order: 2,
    },
    children: [
      {
        path: '/order/consultation',
        name: 'OrderConsultation',
        meta: {
          icon: 'lucide:list',
          title: '咨询订单列表',
        },
        component: () => import('#/views/order/consultation/index.vue'),
      },
      {
        path: '/order/consultation/detail/:id',
        name: 'OrderConsultationDetail',
        meta: {
          title: '咨询订单详情',
          hideInMenu: true,
        },
        component: () => import('#/views/order/consultation/detail.vue'),
      },
      {
        path: '/order/activity',
        name: 'OrderActivity',
        meta: {
          icon: 'lucide:users',
          title: '团队活动列表',
        },
        component: () => import('#/views/order/activity/index.vue'),
      },
      {
        path: '/order/activity/detail/:id',
        name: 'OrderActivityDetail',
        meta: {
          title: '团队活动详情',
          hideInMenu: true,
        },
        component: () => import('#/views/order/activity/detail.vue'),
      },
    ],
  },
  {
    path: '/company',
    name: 'Company',
    meta: {
      icon: 'lucide:building',
      title: '公司管理',
      order: 3,
    },
    children: [
      {
        path: '/company/management',
        name: 'CompanyManagement',
        meta: {
          icon: 'lucide:building-2',
          title: '公司管理列表',
        },
        component: () => import('#/views/company/management/index.vue'),
      },
    ],
  },
  {
    path: '/user',
    name: 'User',
    meta: {
      icon: 'lucide:users',
      title: '用户管理',
      order: 4,
    },
    children: [
      {
        path: '/user/management',
        name: 'UserManagement',
        meta: {
          icon: 'lucide:user',
          title: '用户管理列表',
        },
        component: () => import('#/views/user/management/index.vue'),
      },
    ],
  },
  {
    path: '/feedback',
    name: 'Feedback',
    meta: {
      icon: 'lucide:message-circle',
      title: '意见反馈',
      order: 5,
    },
    children: [
      {
        path: '/feedback/management',
        name: 'FeedbackManagement',
        meta: {
          icon: 'lucide:message-square',
          title: '意见反馈列表',
        },
        component: () => import('#/views/feedback/management/index.vue'),
      },
    ],
  },
];

export default routes;
