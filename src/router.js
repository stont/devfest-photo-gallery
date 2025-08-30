import { createRouter, createWebHistory } from 'vue-router';
// No longer need to import all components statically at the top

const routes = [
  {
    path: '/',
    name: 'Explore',
    // Use a dynamic import for route-based code splitting
    component: () => import('@/views/Explore.vue'),
  },
  {
    path: '/create',
    name: 'Create',
    component: () => import('@/views/Create.vue'),
  },
  {
    path: '/country/:countryName',
    name: 'Country',
    component: () => import('@/views/Country.vue'),
    props: true,
  },
  {
    path: '/community/:communityId',
    name: 'Community',
    component: () => import('@/views/Community.vue'),
    props: true,
  },
  {
    path: '/upload/:communityId',
    name: 'CommunityUpload',
    component: () => import('@/components/CommunityUpload.vue'),
    props: true,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
