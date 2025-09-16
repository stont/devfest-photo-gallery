<script setup>
import { ref, onMounted, watch, nextTick } from 'vue';
import { db, storage } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

const { t } = useI18n();
const props = defineProps(['communityId']);
const emit = defineEmits(['close']);
const router = useRouter();

const community = ref(null);
const selectedFile = ref(null);
const imagePreviewUrl = ref(null);
const uploadProgress = ref(0);
const isUploading = ref(false);
const uploadComplete = ref(false);
const uploadedImageUrl = ref(null);
const isCameraOpen = ref(false);
const videoEl = ref(null);
let mediaStream = null;
const facingMode = ref('environment');
const fileInput = ref(null);

onMounted(async () => {
  const docRef = doc(db, 'communities', props.communityId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    community.value = docSnap.data();
  } else {
    console.error("No such community!");
  }
});

watch(selectedFile, (newFile) => {
  if (newFile) {
    const reader = new FileReader();
    reader.onload = (e) => imagePreviewUrl.value = e.target.result;
    reader.readAsDataURL(newFile);
  } else {
    imagePreviewUrl.value = null;
  }
});

function handleFileChange(event) {
  selectedFile.value = event.target.files[0];
}

function openGallery() {
  fileInput.value.click();
}

async function openCamera() {
  if (mediaStream) {
    mediaStream.getTracks().forEach(track => track.stop());
  }

  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({ 
      video: { facingMode: facingMode.value }, 
      audio: false 
    });
    isCameraOpen.value = true;
    
    await nextTick();

    if (videoEl.value) {
      videoEl.value.srcObject = mediaStream;
    }
  } catch (error) {
    console.error("Error accessing camera: ", error);
    alert("Could not access camera. Please ensure permissions are granted and you are using a secure (HTTPS) connection.");
    isCameraOpen.value = false;
  }
}

function closeCamera() {
  if (mediaStream) {
    mediaStream.getTracks().forEach(track => track.stop());
  }
  isCameraOpen.value = false;
}

function switchCamera() {
  facingMode.value = facingMode.value === 'environment' ? 'user' : 'environment';
  openCamera();
}

function takeSnapshot() {
  const canvas = document.createElement('canvas');
  canvas.width = videoEl.value.videoWidth;
  canvas.height = videoEl.value.videoHeight;
  const context = canvas.getContext('2d');
  context.drawImage(videoEl.value, 0, 0, canvas.width, canvas.height);
  
  canvas.toBlob((blob) => {
    selectedFile.value = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
    closeCamera();
  }, 'image/jpeg');
}

async function addWatermark(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        canvas.width = img.width;
        canvas.height = img.height;

        ctx.drawImage(img, 0, 0);

        const watermarkText = `📍 ${community.value.name}, ${community.value.country} 2025`;
        const fontSize = Math.max(24, Math.min(img.width / 25, 40));
        const padding = fontSize * 0.5;
        const barHeight = fontSize + padding * 2;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, canvas.height - barHeight, canvas.width, barHeight);

        ctx.font = `${fontSize}px sans-serif`;
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        ctx.fillText(watermarkText, canvas.width / 2, canvas.height - barHeight / 2);

        canvas.toBlob((blob) => {
          resolve(blob);
        }, 'image/jpeg', 0.9);
      };
      img.onerror = reject;
      img.src = event.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function uploadFile() {
  if (!selectedFile.value) return;
  
  isUploading.value = true;

  const watermarkedBlob = await addWatermark(selectedFile.value);
  const fileToUpload = watermarkedBlob;
  const fileName = `${Date.now()}_${selectedFile.value.name.replace(/\s+/g, '-')}`;

  const fileRef = storageRef(storage, `photos/${props.communityId}/${fileName}`);
  const uploadTask = uploadBytesResumable(fileRef, fileToUpload);

  uploadTask.on('state_changed',
    (snapshot) => {
      uploadProgress.value = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
    },
    (error) => {
      console.error('Upload failed:', error);
      isUploading.value = false;
    },
    async () => {
      const url = await getDownloadURL(uploadTask.snapshot.ref);
      await addDoc(collection(db, "photos"), {
        imageUrl: url,
        communityId: props.communityId,
        createdAt: serverTimestamp()
      });
      uploadedImageUrl.value = url;
      uploadComplete.value = true;
      isUploading.value = false;
      selectedFile.value = null;
    }
  );
}

function resetUploader() {
  selectedFile.value = null;
  uploadComplete.value = false;
  uploadProgress.value = 0;
  uploadedImageUrl.value = null;
}

function viewGallery() {
  emit('close');
  router.push(`/community/${props.communityId}`);
}
</script>

<template>
  <div class="card">
    <div v-if="community">
      <div v-if="imagePreviewUrl">
        <div class="card-header"><h2>{{ t('uploadTitle', { communityName: community.name }) }}</h2></div>
        <img :src="imagePreviewUrl" class="image-preview" alt="Selected photo preview"/>
        <div class="action-buttons">
          <button @click="uploadFile" :disabled="isUploading">
            {{ isUploading ? `${t('generating')} (${Math.round(uploadProgress)}%)...` : t('uploadPhoto') }}
          </button>
          <button @click="resetUploader" class="secondary" :disabled="isUploading">{{ t('cancel') }}</button>
        </div>
      </div>
      
      <div v-else-if="uploadComplete">
        <div class="card-header">
          <h2>{{ t('uploadComplete') }}</h2>
          <p>{{ t('uploadCompleteSubtitle', { communityName: community.name }) }}</p>
        </div>
        <img :src="uploadedImageUrl" class="image-preview" alt="Uploaded photo"/>
        <div class="action-buttons">
          <button @click="resetUploader">{{ t('uploadAnother') }}</button>
          <button @click="viewGallery" class="secondary">{{ t('viewGallery') }}</button>
        </div>
      </div>

      <div v-else>
        <div class="card-header">
          <h2>{{ t('uploadTitle', { communityName: community.name }) }}</h2>
          <p>{{ t('uploadSubtitle') }}</p>
        </div>
        <div class="action-buttons">
          <button @click="openCamera">{{ t('takePhoto') }}</button>
          <button @click="openGallery" class="secondary">{{ t('chooseFromGallery') }}</button>
        </div>
      </div>
    </div>
    <div v-else class="loading-state"><p>{{ t('loadingCommunities') }}</p></div>
    <input type="file" @change="handleFileChange" accept="image/*" ref="fileInput" hidden/>
  </div>

  <div v-if="isCameraOpen" class="camera-overlay">
    <video ref="videoEl" autoplay playsinline class="camera-feed"></video>
    <div class="camera-controls">
      <button @click="switchCamera" class="control-btn switch-btn" :title="t('switchCamera')"></button>
      <button @click="takeSnapshot" class="capture-btn"></button>
      <button @click="closeCamera" class="control-btn close-btn">{{ t('cancel') }}</button>
    </div>
  </div>
</template>

<style scoped>
.card {
  background-color: var(--color-surface);
  border-radius: 12px;
  padding: 2.5rem;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  text-align: center;
  max-width: 500px;
  margin: 2rem auto;
}
.card-header { margin-bottom: 2rem; }
.card-header h2 { margin-top: 0; margin-bottom: 0.5rem; font-size: 1.8em; }
.card-header p { color: var(--color-text-secondary); margin: 0; }
.action-buttons { display: flex; flex-direction: column; gap: 1rem; }
button.secondary, .button.secondary { background-color: transparent; border: 1px solid var(--color-border); color: var(--color-text-primary); text-decoration: none; padding: 12px 20px; border-radius: 8px; font-size: 1em; }
button.secondary:hover, .button.secondary:hover { background-color: var(--color-background); }
.image-preview { max-width: 100%; border-radius: 8px; margin-bottom: 1.5rem; }
.loading-state { color: var(--color-text-secondary); }

.camera-overlay {
  position: fixed;
  top: 0; left: 0;
  width: 100%; height: 100%;
  background-color: #000;
  z-index: 2000;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}
.camera-feed {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.camera-controls {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  padding: 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(to top, rgba(0,0,0,0.7), transparent);
  box-sizing: border-box;
}
.capture-btn {
  width: 70px;
  height: 70px;
  border-radius: 50%;
  background-color: #fff;
  border: 4px solid #000;
  box-shadow: 0 0 10px rgba(0,0,0,0.5);
  padding: 0;
}
.control-btn {
  background: none;
  border: none;
  color: #fff;
  font-size: 1em;
  font-weight: 500;
  width: 80px;
  text-align: center;
}
.switch-btn {
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 19H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5"/><path d="M13 5H20a2 2 0 0 1 2 2V17a2 2 0 0 1-2 2h-5"/><path d="M17 12l-2-2-2 2"/><path d="M7 12l2 2 2-2"/></svg>');
  background-repeat: no-repeat;
  background-position: center;
  height: 40px;
}
</style>
