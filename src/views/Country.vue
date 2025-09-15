<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { db } from '@/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { RouterLink } from 'vue-router';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const route = useRoute();
const countryName = route.params.countryName;

const communities = ref([]);
const isLoading = ref(true);
const searchQuery = ref('');

onMounted(async () => {
  const photosQuery = query(collection(db, 'photos'), orderBy('createdAt', 'desc'));
  const photosSnapshot = await getDocs(photosQuery);
  const photoCounts = {};
  photosSnapshot.forEach(doc => {
    const communityId = doc.data().communityId;
    photoCounts[communityId] = (photoCounts[communityId] || 0) + 1;
  });

  const communitiesQuery = query(collection(db, 'communities'), where('country', '==', countryName));
  const querySnapshot = await getDocs(communitiesQuery);
  
  const fetchedCommunities = querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    photoCount: photoCounts[doc.id] || 0
  }));

  communities.value = fetchedCommunities;
  isLoading.value = false;
});

const filteredCommunities = computed(() => {
  if (!searchQuery.value) {
    return communities.value;
  }
  return communities.value.filter(community => 
    community.name.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});
</script>


<template>
  <div class="country-view">
    <div class="page-header">
      <RouterLink to="/" class="back-link">&larr; {{ t('allCountries') }}</RouterLink>
      <h1>{{ countryName }}</h1>
      <p>{{ t('exploreCountry', { countryName }) }}</p>
    </div>

    <div v-if="isLoading" class="loading-state">
      <p>{{ t('loadingCommunities') }}</p>
    </div>

    <div v-else class="communities-section">
       <input 
        type="text" 
        v-model="searchQuery" 
        :placeholder="t('searchCommunity', { countryName })"
        class="search-input"
      />

      <div class="community-list">
        <RouterLink 
          v-for="community in filteredCommunities" 
          :key="community.id" 
          :to="`/community/${community.id}`"
          class="community-list-item"
        >
          <div>
            <h3>{{ community.name }}</h3>
            <span>{{ community.photoCount }} {{ t('photos') }}</span>
          </div>
          <span class="arrow">&rarr;</span>
        </RouterLink>
      </div>

       <div v-if="filteredCommunities.length === 0" class="empty-state">
        <p>{{ t('noCommunities') }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-header { text-align: center; margin-bottom: 2rem; }
.back-link { display: inline-block; margin-bottom: 1rem; color: var(--color-primary); text-decoration: none; }
.page-header h1 { margin: 0; }
.page-header p { color: var(--color-text-secondary); }
.communities-section { max-width: 800px; margin: 0 auto; padding: 0 1rem; }
.search-input { width: 100%; padding: 12px 15px; margin-bottom: 2rem; border-radius: 8px; border: 1px solid var(--color-border); background-color: var(--color-surface); color: var(--color-text-primary); font-size: 1em; box-sizing: border-box; }
.community-list { display: flex; flex-direction: column; gap: 1rem; }
.community-list-item { display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.5rem; background-color: var(--color-surface); border-radius: 8px; text-decoration: none; color: var(--color-text-primary); transition: background-color 0.2s ease, transform 0.2s ease; }
.community-list-item:hover { background-color: #2a2a2a; transform: translateX(5px); }
.community-list-item h3 { margin: 0; text-transform: capitalize; }
.community-list-item span { color: var(--color-text-secondary); }
.arrow { font-size: 1.5em; color: var(--color-primary); }
.loading-state, .empty-state { text-align: center; padding: 2rem; color: var(--color-text-secondary); }

@media (max-width: 600px) {
  .communities-section {
    padding: 0 0.5rem;
  }
}
</style>
