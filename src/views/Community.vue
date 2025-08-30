<script setup>
import { ref, onMounted, computed } from 'vue';
import { db } from '@/firebase';
import { doc, getDoc, collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { RouterLink } from 'vue-router';

const props = defineProps({
  communityId: {
    type: String,
    required: true,
  },
});

const community = ref(null);
const photos = ref([]);
const isLoading = ref(true);

const isLightboxOpen = ref(false);
const currentImageIndex = ref(0);

onMounted(async () => {
  const communityDocRef = doc(db, 'communities', props.communityId);
  const communityDocSnap = await getDoc(communityDocRef);

  if (communityDocSnap.exists()) {
    community.value = communityDocSnap.data();
  } else {
    console.error("Community not found!");
    isLoading.value = false;
    return;
  }

  const photosQuery = query(
    collection(db, 'photos'),
    where('communityId', '==', props.communityId),
    orderBy('createdAt', 'desc')
  );

  onSnapshot(photosQuery, (snapshot) => {
    const fetchedPhotos = [];
    snapshot.forEach((doc) => {
      // No longer need the 'loaded' property
      fetchedPhotos.push({ id: doc.id, ...doc.data() });
    });
    photos.value = fetchedPhotos;
    isLoading.value = false;
  });
});

// --- Lightbox Methods ---
function openLightbox(index) {
  currentImageIndex.value = index;
  isLightboxOpen.value = true;
}

function closeLightbox() {
  isLightboxOpen.value = false;
}

function nextImage() {
  currentImageIndex.value = (currentImageIndex.value + 1) % photos.value.length;
}

function prevImage() {
  currentImageIndex.value = (currentImageIndex.value - 1 + photos.value.length) % photos.value.length;
}

const currentImage = computed(() => {
  return photos.value[currentImageIndex.value];
});
</script>

<template>
  <div class="community-view">
    <div v-if="community" class="header">
      <RouterLink :to="`/country/${community.country}`" class="back-link">&larr; All Communities</RouterLink>
      <h1>{{ community.name }}, {{ community.country }}</h1>
      <p>{{ photos.length }} photos</p>
    </div>

    <div v-if="isLoading" class="loading-state">
      <p>Loading photos...</p>
    </div>

    <div v-else class="photo-grid">
      <div 
        v-for="(photo, index) in photos" 
        :key="photo.id" 
        class="photo-item"
        @click="openLightbox(index)"
      >
        <!-- Directly bind the imageUrl to the src attribute -->
        <img 
          :src="photo.imageUrl" 
          :alt="`Photo from ${community.name}`" 
          class="gallery-image"
        />
      </div>
    </div>

    <!-- Lightbox Modal -->
    <div v-if="isLightboxOpen" class="lightbox-overlay" @click.self="closeLightbox">
      <button class="lightbox-close" @click="closeLightbox">&times;</button>
      <button class="lightbox-prev" @click.stop="prevImage">&lsaquo;</button>
      <div class="lightbox-content">
        <img :src="currentImage.imageUrl" :alt="`Photo from ${community.name}`" class="lightbox-image"/>
      </div>
      <button class="lightbox-next" @click.stop="nextImage">&rsaquo;</button>
    </div>
  </div>
</template>

<style scoped>
.header { margin-bottom: 2rem; }
.header h1 { font-size: 2.5em; font-weight: 700; margin: 1rem 0 0.5rem; }
.header p { font-size: 1.2em; color: var(--color-text-secondary); }
.back-link { color: var(--color-primary); text-decoration: none; font-weight: 500; }

.photo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}
.photo-item {
  cursor: pointer;
  border-radius: 8px;
  overflow: hidden;
  background-color: var(--color-surface);
  aspect-ratio: 1 / 1;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.photo-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 16px rgba(0,0,0,0.2);
}
.gallery-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.loading-state {
  text-align: center;
  padding: 4rem;
  color: var(--color-text-secondary);
}

/* Lightbox styles remain the same */
.lightbox-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.85); z-index: 1000; display: flex; justify-content: center; align-items: center; }
.lightbox-content { position: relative; max-width: 90vw; max-height: 90vh; }
.lightbox-image { max-width: 100%; max-height: 100%; object-fit: contain; border-radius: 8px; }
.lightbox-close, .lightbox-prev, .lightbox-next { position: absolute; background: none; border: none; color: white; font-size: 3em; cursor: pointer; }
.lightbox-close { top: 20px; right: 30px; line-height: 1; }
.lightbox-prev, .lightbox-next { top: 50%; transform: translateY(-50%); }
.lightbox-prev { left: 20px; }
.lightbox-next { right: 20px; }
</style>
