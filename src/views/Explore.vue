<script setup>
import { ref, onMounted, computed } from 'vue';
import { db } from '@/firebase';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import { RouterLink } from 'vue-router';
import Fuse from 'fuse.js';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const countries = ref([]);
const isLoading = ref(true);
const searchQuery = ref('');

let fuse;
const fuseOptions = {
  keys: ['name'],
  threshold: 0.3,
};

onMounted(async () => {
  const communitiesQuery = query(collection(db, 'communities'));
  const photosQuery = query(collection(db, 'photos'), orderBy('createdAt', 'desc'));

  const [communitySnapshot, photoSnapshot] = await Promise.all([
    getDocs(communitiesQuery),
    getDocs(photosQuery)
  ]);

  const communities = {};
  communitySnapshot.forEach(doc => {
    communities[doc.id] = doc.data();
  });

  const photos = [];
  photoSnapshot.forEach(doc => {
    photos.push({ id: doc.id, ...doc.data() });
  });

  const countriesMap = {};
  photos.forEach(photo => {
    const community = communities[photo.communityId];
    if (community) {
      const countryName = community.country;
      if (!countriesMap[countryName]) {
        countriesMap[countryName] = {
          name: countryName,
          photoCount: 0,
          coverImage: photo.imageUrl
        };
      }
      countriesMap[countryName].photoCount++;
    }
  });

  countries.value = Object.values(countriesMap);
  fuse = new Fuse(countries.value, fuseOptions);
  isLoading.value = false;
});

const filteredCountries = computed(() => {
  if (!searchQuery.value) {
    return countries.value;
  }
  return fuse.search(searchQuery.value).map(result => result.item);
});
</script>

<template>
  <div class="explore-view">
    <div class="hero-section">
      <h1>{{ t('galleryTitle') }}</h1>
      <p>{{ t('gallerySubtitle') }}</p>
    </div>

    <div v-if="isLoading" class="loading-state">
      <p>{{ t('loadingGalleries') }}</p>
    </div>
    
    <div v-else class="countries-section">
      <div class="section-header">
        <h2>{{ t('countries') }}</h2>
        <input 
          type="text" 
          v-model="searchQuery" 
          :placeholder="t('searchCountry')"
          class="search-input"
        />
      </div>
      <div class="countries-grid">
        <RouterLink 
          v-for="country in filteredCountries" 
          :key="country.name" 
          :to="`/country/${country.name}`"
          class="country-card"
        >
          <img :src="country.coverImage" class="cover-image" alt="" loading="lazy"/>
          <div class="card-overlay">
            <h3>{{ country.name }}</h3>
            <span>{{ country.photoCount }} {{ t('photos') }}</span>
          </div>
        </RouterLink>
      </div>
       <div v-if="filteredCountries.length === 0" class="empty-state">
        <p>{{ t('noCountries') }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.hero-section { text-align: center; margin-bottom: 3rem; }
.hero-section h1 { font-size: 2.5em; font-weight: 700; margin-bottom: 0.5rem; }
.hero-section p { font-size: 1.2em; color: var(--color-text-secondary); }
.countries-section { background-color: var(--color-surface); border-radius: 12px; padding: 2rem; }
.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem; }
.section-header h2 { margin: 0; }
.search-input { width: 100%; max-width: 300px; padding: 10px 15px; border-radius: 8px; border: 1px solid var(--color-border); background-color: var(--color-background); color: var(--color-text-primary); font-size: 0.9em; }
.countries-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 1.5rem; }
.country-card { position: relative; border-radius: 12px; overflow: hidden; aspect-ratio: 4 / 3; color: white; text-decoration: none; display: block; background-color: var(--color-surface); transition: transform 0.2s ease, box-shadow 0.2s ease; }
.country-card:hover { transform: translateY(-5px); box-shadow: 0 10px 20px rgba(0,0,0,0.25); }
.cover-image { width: 100%; height: 100%; object-fit: cover; }
.card-overlay { position: absolute; bottom: 0; left: 0; width: 100%; padding: 1.5rem 1rem 1rem; background: linear-gradient(to top, rgba(0,0,0,0.8), transparent); }
.card-overlay h3 { margin: 0 0 0.25rem; }
.card-overlay span { font-size: 0.9em; opacity: 0.8; }
.loading-state { text-align: center; padding: 4rem; color: var(--color-text-secondary); }
.empty-state { text-align: center; padding: 2rem; color: var(--color-text-secondary); }

@media (max-width: 600px) {
  .hero-section h1 {
    font-size: 2em;
  }
  .countries-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }
  .countries-section {
    padding: 1.5rem;
  }
}
</style>
