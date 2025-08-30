<script setup>
import { ref } from 'vue';
import { db } from '@/firebase'; // Use alias for consistency
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import QRCode from 'qrcode';
import CountrySelector from './CountrySelector.vue';

const chapterName = ref('');
const country = ref('');
const isCreating = ref(false);

const generatedUrl = ref(null);
const generatedQrCode = ref(null);

async function createCommunity() {
  if (!chapterName.value || !country.value) {
    alert('Please enter a chapter name and select a country.');
    return;
  }

  isCreating.value = true;
  try {
    const fullCommunityName = `GDG ${chapterName.value}`;
    const slug = `${fullCommunityName.toLowerCase().replace(/\s+/g, '-')}-${country.value.toLowerCase().replace(/\s+/g, '-')}`;
    
    const docRef = await addDoc(collection(db, 'communities'), {
      name: fullCommunityName,
      country: country.value,
      slug: slug,
      createdAt: serverTimestamp(),
      qrCodeUrl: '',
      uploadUrl: '',
    });

    const uploadUrl = `${window.location.origin}/upload/${docRef.id}`;
    const qrCodeDataUrl = await QRCode.toDataURL(uploadUrl, { width: 300, margin: 2 });

    await updateDoc(doc(db, 'communities', docRef.id), {
      qrCodeUrl: qrCodeDataUrl,
      uploadUrl: uploadUrl,
    });
    
    generatedUrl.value = uploadUrl;
    generatedQrCode.value = qrCodeDataUrl;

    chapterName.value = '';
    country.value = '';

  } catch (error) {
    console.error('Error creating community:', error);
    alert('Failed to create community. Please try again.');
  } finally {
    isCreating.value = false;
  }
}

function handleCountrySelected(selectedCountry) {
  country.value = selectedCountry;
}

function createAnother() {
  generatedUrl.value = null;
  generatedQrCode.value = null;
}
</script>

<template>
  <div class="card">
    <div v-if="!generatedUrl" class="form-container">
      <div class="card-header">
        <h2>Create a Community</h2>
        <p>Generate a unique QR code and link for attendees to upload photos.</p>
      </div>
      <div class="form">
        <div class="input-with-prefix">
          <span>GDG</span>
          <input type="text" v-model="chapterName" placeholder="Chapter Name (e.g., Ado-Ekiti)" />
        </div>
        <CountrySelector @countrySelected="handleCountrySelected">
          {{ country || 'Select a Country' }}
        </CountrySelector>
        <button @click="createCommunity" :disabled="isCreating || !chapterName || !country">
          {{ isCreating ? 'Creating...' : 'Generate Upload Link' }}
        </button>
      </div>
    </div>

    <div v-else class="results-container">
      <div class="card-header">
        <h2>Your Link is Ready!</h2>
        <p>Display this QR code or share the link at your event.</p>
      </div>
      <div class="qr-code-wrapper">
        <img :src="generatedQrCode" alt="Generated QR Code" />
      </div>
      <div class="generated-link">
        <input type="text" :value="generatedUrl" readonly />
      </div>
      <button @click="createAnother">Create Another Community</button>
    </div>
  </div>
</template>

<style scoped>
/* Styles remain the same */
.card {
  background-color: var(--color-surface);
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  text-align: center;
}

.card-header {
  margin-bottom: 2rem;
}

.card-header h2 {
  margin-top: 0;
  margin-bottom: 0.5rem;
}

.card-header p {
  color: var(--color-text-secondary);
  margin: 0;
}

.form, .results-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
}

.input-with-prefix {
  display: flex;
  align-items: center;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background-color: var(--color-surface);
}

.input-with-prefix span {
  padding: 0 15px;
  color: var(--color-text-secondary);
  font-weight: 500;
}

.input-with-prefix input {
  border: none;
  background: none;
  flex-grow: 1;
}

.qr-code-wrapper {
  background: white;
  padding: 15px;
  border-radius: 8px;
  display: inline-block;
  margin: 1rem auto;
}

.generated-link input {
  width: 100%;
  text-align: center;
  background-color: var(--color-background);
  border-color: var(--color-border);
  color: var(--color-text-secondary);
}
</style>
