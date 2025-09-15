<script setup>
import { ref, onMounted, computed } from 'vue';
import { db } from '@/firebase';
import { doc, getDoc, collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { RouterLink } from 'vue-router';
import CommunityUpload from '@/components/CommunityUpload.vue'; 
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const props = defineProps({
  communityId: {
    type: String,
    required: true,
  },
});

const community = ref(null);
const photos = ref([]);
const isLoading = ref(true);
const isUploadModalOpen = ref(false); 
const isActionMenuOpen = ref(false);

const isLightboxOpen = ref(false);
const currentImageIndex = ref(0);

onMounted(async () => {
  const communityDocRef = doc(db, 'communities', props.communityId);
  const communityDocSnap = await getDoc(communityDocRef);

  if (communityDocSnap.exists()) {
    community.value = { id: communityDocSnap.id, ...communityDocSnap.data() };
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
      fetchedPhotos.push({ id: doc.id, ...doc.data() });
    });
    photos.value = fetchedPhotos;
    isLoading.value = false;
  });
});

function openLightbox(index) {
  currentImageIndex.value = index;
  isLightboxOpen.value = true;
}
function closeLightbox() { isLightboxOpen.value = false; }
function nextImage() { currentImageIndex.value = (currentImageIndex.value + 1) % photos.value.length; }
function prevImage() { currentImageIndex.value = (currentImageIndex.value - 1 + photos.value.length) % photos.value.length; }
const currentImage = computed(() => photos.value[currentImageIndex.value]);

function copyUploadLink() {
  navigator.clipboard.writeText(community.value.uploadUrl);
  alert('Upload link copied to clipboard!');
  isActionMenuOpen.value = false;
}

function downloadQRCode() {
  const link = document.createElement('a');
  link.href = community.value.qrCodeUrl;
  link.download = `${community.value.name}-qr-code.png`;
  link.click();
  isActionMenuOpen.value = false;
}
</script>

<template>
  <div class="community-view">
    <div v-if="community" class="header">
      <div class="header-nav">
        <RouterLink :to="`/country/${community.country}`" class="back-link">&larr; {{ t('allCountries') }}</RouterLink>
        <div class="header-actions">
          <div class="desktop-actions">
            <button @click="copyUploadLink" class="secondary-btn">{{ t('copyLink') }}</button>
            <button @click="downloadQRCode" class="secondary-btn">{{ t('downloadQR') }}</button>
          </div>
          <button @click="isUploadModalOpen = true" class="upload-button">{{ t('uploadPhoto') }}</button>
          <div class="mobile-actions">
            <button @click="isActionMenuOpen = !isActionMenuOpen" class="kebab-menu">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg>
            </button>
            <div v-if="isActionMenuOpen" class="action-menu">
              <a href="#" @click.prevent="copyUploadLink">{{ t('copyLink') }}</a>
              <a href="#" @click.prevent="downloadQRCode">{{ t('downloadQR') }}</a>
            </div>
          </div>
        </div>
      </div>
      <h1>{{ community.name }}, {{ community.country }}</h1>
      <p>{{ photos.length }} {{ t('photos') }}</p>
    </div>

    <div v-if="isLoading" class="loading-state">
      <p>{{ t('loadingPhotos') }}</p>
    </div>

    <div v-else class="photo-grid">
      <div 
        v-for="(photo, index) in photos" 
        :key="photo.id" 
        class="photo-item"
        @click="openLightbox(index)"
      >
        <img :src="photo.imageUrl" :alt="`Photo from ${community.name}`" class="gallery-image" loading="lazy"/>
      </div>
    </div>

    <div v-if="isLightboxOpen" class="lightbox-overlay" @click.self="closeLightbox">
      <button class="lightbox-close" @click="closeLightbox">&times;</button>
      <button class="lightbox-prev" @click.stop="prevImage">&lsaquo;</button>
      <div class="lightbox-content">
        <img :src="currentImage.imageUrl" :alt="`Photo from ${community.name}`" class="lightbox-image" loading="lazy"/>
      </div>
      <button class="lightbox-next" @click.stop="nextImage">&rsaquo;</button>
    </div>

    <div v-if="isUploadModalOpen" class="upload-modal-overlay">
      <div class="upload-modal-content">
        <button @click="isUploadModalOpen = false" class="close-modal-btn">&times;</button>
        <CommunityUpload :communityId="communityId" @close="isUploadModalOpen = false" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.header { margin-bottom: 2rem; }
.header-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}
.header-actions {
  display: flex;
  gap: 1rem;
}
.upload-button, .secondary-btn {
  font-size: 0.9em;
  padding: 8px 16px;
}
.secondary-btn {
  background-color: transparent;
  border: 1px solid var(--color-border);
  color: var(--color-text-primary);
}
.secondary-btn:hover {
  background-color: var(--color-surface);
}
.header h1 { font-size: 2.5em; font-weight: 700; margin: 0 0 0.5rem; }
.header p { font-size: 1.2em; color: var(--color-text-secondary); }
.back-link { color: var(--color-primary); text-decoration: none; font-weight: 500; }
.photo-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem; }
.photo-item { cursor: pointer; border-radius: 8px; overflow: hidden; background-color: var(--color-surface); aspect-ratio: 1 / 1; transition: transform 0.2s ease, box-shadow 0.2s ease; }
.photo-item:hover { transform: translateY(-5px); box-shadow: 0 8px 16px rgba(0,0,0,0.2); }
.gallery-image { width: 100%; height: 100%; object-fit: cover; display: block; }
.loading-state { text-align: center; padding: 4rem; color: var(--color-text-secondary); }

.upload-modal-overlay {
  position: fixed;
  top: 0; left: 0;
  width: 100%; height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  z-index: 1500;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1rem;
}
.upload-modal-content {
  position: relative;
  width: 100%;
  max-width: 550px;
}
.close-modal-btn {
  position: absolute;
  top: -10px;
  right: -10px;
  background: var(--color-background);
  color: white;
  border: 1px solid var(--color-border);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  font-size: 1.5em;
  line-height: 1;
  cursor: pointer;
}
.lightbox-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.85); z-index: 1000; display: flex; justify-content: center; align-items: center; }
.lightbox-content { position: relative; max-width: 90vw; max-height: 90vh; }
.lightbox-image { max-width: 100%; max-height: 100%; object-fit: contain; border-radius: 8px; }
.lightbox-close, .lightbox-prev, .lightbox-next { position: absolute; background: none; border: none; color: white; font-size: 3em; cursor: pointer; }
.lightbox-close { top: 20px; right: 30px; line-height: 1; }
.lightbox-prev, .lightbox-next { top: 50%; transform: translateY(-50%); }
.lightbox-prev { left: 20px; }
.lightbox-next { right: 20px; }

.mobile-actions {
  position: relative;
  display: none;
}

.kebab-menu {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-text-secondary);
  padding: 0;
}

.action-menu {
  position: absolute;
  top: 150%;
  right: 0;
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  z-index: 10;
}

.action-menu a {
  color: var(--color-text-secondary);
  text-decoration: none;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}

.action-menu a:hover {
  background-color: var(--color-background);
}

.desktop-actions {
  display: flex;
  gap: 1rem;
}

@media (max-width: 600px) {
  .desktop-actions {
    display: none;
  }
  .mobile-actions {
    display: block;
  }
}
</style>
