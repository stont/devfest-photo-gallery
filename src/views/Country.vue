<script setup>
import { ref, onMounted, computed } from 'vue';
import { db } from '@/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { RouterLink } from 'vue-router';
import Fuse from 'fuse.js';

const props = defineProps({
  countryName: {
    type: String,
    required: true,
  },
});

const communities = ref([]);
const isLoading = ref(true);
const searchQuery = ref('');

let fuse;
const fuseOptions = {
  keys: ['name'],
  threshold: 0.3,
};

onMounted(async () => {
  const communitiesQuery = query(
    collection(db, 'communities'),
    where('country', '==', props.countryName)
  );
  const communitySnapshot = await getDocs(communitiesQuery);

  const communityPromises = [];
  communitySnapshot.forEach(doc => {
    const community = { id: doc.id, ...doc.data() };
    
    const photoCountPromise = getDocs(query(
      collection(db, 'photos'),
      where('communityId', '==', community.id)
    )).then(photoSnapshot => {
      community.photoCount = photoSnapshot.size;
      return community;
    });

    communityPromises.push(photoCountPromise);
  });

  communities.value = await Promise.all(communityPromises);
  fuse = new Fuse(communities.value, fuseOptions); // Initialize Fuse.js
  isLoading.value = false;
});

const filteredCommunities = computed(() => {
  if (!searchQuery.value) {
    return communities.value;
  }
  return fuse.search(searchQuery.value).map(result => result.item);
});
</script>

<template>
  <div class="country-view">
    <div class="header">
      <RouterLink to="/" class="back-link">&larr; All Countries</RouterLink>
      <h1>{{ countryName }}</h1>
      <p>Explore photos from GDG communities in {{ countryName }}.</p>
    </div>

    <div class="search-wrapper">
      <input 
        type="text" 
        v-model="searchQuery" 
        :placeholder="`Search within ${countryName}...`"
        class="search-input"
      />
    </div>

    <div v-if="isLoading" class="loading-state">
      <p>Loading communities...</p>
    </div>

    <div v-else class="communities-list">
      <RouterLink 
        v-for="community in filteredCommunities" 
        :key="community.id"
        :to="`/community/${community.id}`"
        class="community-item"
      >
        <div class="community-info">
          <h3>{{ community.name }}</h3>
          <span>{{ community.photoCount || 0 }} photos</span>
        </div>
        <span class="arrow">&rarr;</span>
      </RouterLink>
      <div v-if="filteredCommunities.length === 0" class="empty-state">
        <p>No communities found matching your search.</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.header { margin-bottom: 2rem; }
.header h1 { font-size: 2.5em; font-weight: 700; margin: 1rem 0 0.5rem; }
.header p { font-size: 1.2em; color: var(--color-text-secondary); }
.back-link { color: var(--color-primary); text-decoration: none; font-weight: 500; }

.search-wrapper {
  margin-bottom: 2rem;
}

.search-input {
  width: 100%;
  max-width: 400px;
  padding: 10px 15px;
  border-radius: 8px;
  border: 1px solid var(--color-border);
  background-color: var(--color-surface);
  color: var(--color-text-primary);
  font-size: 0.9em;
}

.communities-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.community-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  background-color: var(--color-surface);
  border-radius: 12px;
  text-decoration: none;
  color: var(--color-text-primary);
  transition: background-color 0.2s ease, transform 0.2s ease;
}

.community-item:hover {
  background-color: #3a3a3a;
  transform: translateY(-3px);
}

.community-info h3 { margin: 0 0 0.25rem; }
.community-info span { color: var(--color-text-secondary); font-size: 0.9em; }
.arrow { font-size: 1.5em; color: var(--color-primary); }

.loading-state, .empty-state {
  text-align: center;
  padding: 4rem;
  color: var(--color-text-secondary);
}
</style>
