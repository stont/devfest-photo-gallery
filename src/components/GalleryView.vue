<script setup>
import { ref, watch } from 'vue';
import { db } from '@/firebase'; // Use alias for consistency
import { collection, query, orderBy, onSnapshot, where } from 'firebase/firestore';

const props = defineProps({
  communities: {
    type: Array,
    required: true,
  },
});

const communitiesWithPhotos = ref([]);

watch(() => props.communities, (newCommunities) => {
  const communityPhotoPromises = newCommunities.map(community => {
    return new Promise(resolve => {
      const photosCollection = collection(db, 'photos');
      const photoQuery = query(
        photosCollection,
        where('communityId', '==', community.id),
        orderBy('createdAt', 'desc')
      );

      onSnapshot(photoQuery, (photoSnapshot) => {
        const photos = [];
        photoSnapshot.forEach((doc) => {
          photos.push({ id: doc.id, ...doc.data(), loaded: false });
        });
        resolve({ ...community, photos });
      });
    });
  });

  Promise.all(communityPhotoPromises).then(results => {
    communitiesWithPhotos.value = results;
  });
}, { immediate: true });

function handleVisibilityChange(isVisible, photo) {
  if (isVisible && !photo.loaded) {
    photo.loaded = true;
  }
}
</script>

<template>
  <div class="gallery-view">
    <div v-if="communities.length === 0" class="empty-state">
      <p>No matching communities found.</p>
    </div>
    <div v-for="community in communitiesWithPhotos" :key="community.id" class="community-gallery">
      <h3 class="community-name">{{ community.name }} - <span class="country">{{ community.country }}</span></h3>
      <div v-if="community.photos.length > 0" class="photo-grid">
        <div 
          v-for="photo in community.photos" 
          :key="photo.id" 
          class="photo-item"
          v-observe-visibility="(isVisible) => handleVisibilityChange(isVisible, photo)"
        >
          <img 
            :src="photo.loaded ? photo.imageUrl : ''" 
            :alt="`Photo from ${community.name}`" 
            class="lazy-image"
            :class="{ 'is-loaded': photo.loaded }"
          />
        </div>
      </div>
      <div v-else class="empty-state">
        <p>No photos have been uploaded to this community yet.</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Styles remain the same */
.community-gallery {
  margin-bottom: 3rem;
}

.community-name {
  font-weight: 500;
  color: var(--color-text-primary);
  margin-bottom: 1.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--color-border);
}

.country {
  color: var(--color-text-secondary);
  font-weight: 400;
}

.photo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}

.photo-item {
  border-radius: 8px;
  overflow: hidden;
  background-color: var(--color-background);
  aspect-ratio: 1 / 1;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.photo-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 16px rgba(0,0,0,0.2);
}

.lazy-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  opacity: 0;
  transition: opacity 0.5s ease;
}

.lazy-image.is-loaded {
  opacity: 1;
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: var(--color-text-secondary);
}
</style>
