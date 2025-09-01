<script setup>
import { ref, computed, watch } from 'vue';
import { db } from '@/firebase';
import { collection, addDoc, updateDoc, doc, serverTimestamp, query, where, getDocs, limit } from 'firebase/firestore';
import QRCode from 'qrcode';
import Fuse from 'fuse.js';
import allCommunities from '@/communities.json';
import CountrySelector from './CountrySelector.vue';

// --- Component State ---
const chapterName = ref('');
const country = ref('');
const suggestions = ref([]);
const isCreating = ref(false);
const errorMsg = ref('');

// --- Results State ---
const generatedUrl = ref(null);
const generatedQrCode = ref(null);

// --- Fuse.js Search ---
const fuse = new Fuse(allCommunities, {
  keys: ['url'], // Search by the community name in the URL
  threshold: 0.3,
  includeScore: true,
});

watch(chapterName, (newName) => {
  if (newName.length > 2) {
    suggestions.value = fuse.search(newName)
      .slice(0, 5) // Show top 5 matches
      .map(result => result.item);
  } else {
    suggestions.value = [];
  }
});

function selectSuggestion(suggestion) {
  chapterName.value = suggestion.url.split('/')[4].replace(/-/g, ' ');
  country.value = suggestion.country;
  suggestions.value = []; // Hide suggestions
}

// --- Main Function ---
async function generateLink() {
  if (!chapterName.value || !country.value) {
    errorMsg.value = 'Please complete both fields.';
    return;
  }
  isCreating.value = true;
  errorMsg.value = '';
  const fullCommunityName = chapterName.value.startsWith('GDG') ? chapterName.value.trim() : `GDG ${chapterName.value.trim()}`;

  try {
    // 1. Check if this community already exists in Firestore
    const communitiesRef = collection(db, 'communities');
    const q = query(communitiesRef, where('name', '==', fullCommunityName), where('country', '==', country.value), limit(1));
    const querySnapshot = await getDocs(q);

    let communityDocId;

    if (!querySnapshot.empty) {
      // 2a. If it exists, get its ID
      communityDocId = querySnapshot.docs[0].id;
    } else {
      // 2b. If it's new, create it and get the new ID
      const slug = `${fullCommunityName.toLowerCase().replace(/\s+/g, '-')}-${country.value.toLowerCase().replace(/\s+/g, '-')}`;
      const docRef = await addDoc(communitiesRef, {
        name: fullCommunityName,
        country: country.value,
        slug: slug,
        createdAt: serverTimestamp(),
      });
      communityDocId = docRef.id;
    }

    // 3. Generate links and update the document (whether old or new)
    const uploadUrl = `${window.location.origin}/upload/${communityDocId}`;
    const qrCodeDataUrl = await QRCode.toDataURL(uploadUrl, { width: 300, margin: 2 });

    await updateDoc(doc(db, 'communities', communityDocId), {
      qrCodeUrl: qrCodeDataUrl,
      uploadUrl: uploadUrl,
      lastGeneratedAt: serverTimestamp(),
    });

    // 4. Show results
    generatedUrl.value = uploadUrl;
    generatedQrCode.value = qrCodeDataUrl;

  } catch (error) {
    console.error('Error generating link:', error);
    errorMsg.value = 'An error occurred. Please try again.';
  } finally {
    isCreating.value = false;
  }
}

// --- Helper Functions ---
function handleCountrySelected(selectedCountry) {
  country.value = selectedCountry;
}
function createAnother() {
  generatedUrl.value = null;
  generatedQrCode.value = null;
  chapterName.value = '';
  country.value = '';
}
</script>

<template>
  <div class="card">
    <div v-if="!generatedUrl" class="form-container">
      <div class="card-header">
        <h2>Generate Community Link</h2>
        <p>Select your community, or create a new one to get an upload link.</p>
      </div>
      <div class="form">
        <div class="autocomplete-wrapper">
          <div class="input-with-prefix">
            <span>GDG</span>
            <input type="text" v-model="chapterName" @input="errorMsg = ''" placeholder="Chapter Name..." />
          </div>
          <ul v-if="suggestions.length > 0" class="suggestions-list">
            <li v-for="suggestion in suggestions" :key="suggestion.url" @click="selectSuggestion(suggestion)">
              {{ suggestion.url.split('/')[4].replace(/-/g, ' ') }} ({{ suggestion.country }})
            </li>
          </ul>
        </div>
        
        <CountrySelector @countrySelected="handleCountrySelected">
          {{ country || 'Select a Country' }}
        </CountrySelector>
        
        <p v-if="errorMsg" class="error-text">{{ errorMsg }}</p>

        <button @click="generateLink" :disabled="isCreating || !chapterName || !country">
          {{ isCreating ? 'Generating...' : 'Generate Upload Link' }}
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
      <button @click="createAnother">Generate for Another Community</button>
    </div>
  </div>
</template>

<style scoped>
/* [Previous styles remain the same, with these additions] */
.form {
  position: relative;
}
.autocomplete-wrapper {
  position: relative;
}
.suggestions-list {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-top: none;
  border-radius: 0 0 8px 8px;
  list-style: none;
  padding: 0;
  margin: 0;
  z-index: 10;
  max-height: 200px;
  overflow-y: auto;
}
.suggestions-list li {
  padding: 12px 15px;
  cursor: pointer;
  text-align: left;
  text-transform: capitalize;
}
.suggestions-list li:hover {
  background-color: var(--color-background);
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
  padding: 12px 15px;
  color: var(--color-text-primary);
  font-size: 1em;
}
.error-text {
  color: #ff6b6b;
  font-size: 0.9em;
  margin-top: -0.5rem;
  margin-bottom: 0.5rem;
}
.card { background-color: var(--color-surface); border-radius: 12px; padding: 2rem; box-shadow: 0 4px 12px rgba(0,0,0,0.1); text-align: center; }
.card-header { margin-bottom: 2rem; }
.card-header h2 { margin-top: 0; margin-bottom: 0.5rem; }
.card-header p { color: var(--color-text-secondary); margin: 0; }
.form, .results-container { display: flex; flex-direction: column; gap: 1rem; width: 100%; max-width: 400px; margin: 0 auto; }
.qr-code-wrapper { background: white; padding: 15px; border-radius: 8px; display: inline-block; margin: 1rem auto; }
.generated-link input { width: 100%; text-align: center; background-color: var(--color-background); border-color: var(--color-border); color: var(--color-text-secondary); }
</style>
