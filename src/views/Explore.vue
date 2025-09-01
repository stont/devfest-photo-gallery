<script setup>
import { ref, onMounted } from 'vue';
import { db } from '@/firebase';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import { RouterLink } from 'vue-router';

const countries = ref([]);
const isLoading = ref(true);

onMounted(async () => {
  // 1. Fetch all communities and photos in parallel
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

  // 2. Process data to group by country
  const countriesMap = {};

  photos.forEach(photo => {
    const community = communities[photo.communityId];
    if (community) {
      const countryName = community.country;
      if (!countriesMap[countryName]) {
        countriesMap[countryName] = {
          name: countryName,
          photoCount: 0,
          coverImage: photo.imageUrl // The first photo we see is the latest one
        };
      }
      countriesMap[countryName].photoCount++;
    }
  });

  // 3. Convert map to array and update state
  countries.value = Object.values(countriesMap);
  isLoading.value = false;
});
</script>

<template>
  <div class="explore-view">
    <div class="hero-section">
      <h1>GDG DevFest Photo Gallery</h1>
      <p>Explore photos from DevFest events around the globe.</p>
    </div>

    <div v-if="isLoading" class="loading-state">
      <p>Loading galleries...</p>
    </div>
    
    <div v-else class="countries-section">
      <h2>Countries</h2>
      <div class="countries-grid">
        <RouterLink 
          v-for="country in countries" 
          :key="country.name" 
          :to="`/country/${country.name}`"
          class="country-card"
        >
          <img :src="country.coverImage" class="cover-image" alt=""/>
          <div class="card-overlay">
            <h3>{{ country.name }}</h3>
            <span>{{ country.photoCount }} photos</span>
          </div>
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
.hero-section {
  text-align: center;
  margin-bottom: 3rem;
}
.hero-section h1 {
  font-size: 2.5em;
  font-weight: 700;
  margin-bottom: 0.5rem;
}
.hero-section p {
  font-size: 1.2em;
  color: var(--color-text-secondary);
}

.countries-section h2 {
  font-size: 1.8em;
  margin-bottom: 1.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--color-border);
}

.countries-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1.5rem;
}

.country-card {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  aspect-ratio: 4 / 3;
  color: white;
  text-decoration: none;
  display: block;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.country-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0,0,0,0.25);
}

.cover-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.card-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  padding: 1.5rem 1rem 1rem;
  background: linear-gradient(to top, rgba(0,0,0,0.8), transparent);
}

.card-overlay h3 {
  margin: 0 0 0.25rem;
}

.card-overlay span {
  font-size: 0.9em;
  opacity: 0.8;
}

.loading-state {
  text-align: center;
  padding: 4rem;
  color: var(--color-text-secondary);
}
</style>
