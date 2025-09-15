<script setup>
import { ref } from 'vue';
import { db } from '@/firebase';
import { collection, addDoc, updateDoc, doc, serverTimestamp, query, where, getDocs, limit } from 'firebase/firestore';
import QRCode from 'qrcode';
import CountrySelector from '@/components/CountrySelector.vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const chapterName = ref('');
const country = ref('');
const isCreating = ref(false);
const errorMsg = ref('');

const generatedUrl = ref(null);
const generatedQrCode = ref(null);

async function generateLink() {
  if (!chapterName.value || !country.value) {
    errorMsg.value = 'Please complete both fields.';
    return;
  }
  isCreating.value = true;
  errorMsg.value = '';
  const fullCommunityName = chapterName.value.startsWith('GDG') ? chapterName.value.trim() : `GDG ${chapterName.value.trim()}`;

  try {
    const communitiesRef = collection(db, 'communities');
    const q = query(communitiesRef, where('name', '==', fullCommunityName), where('country', '==', country.value), limit(1));
    const querySnapshot = await getDocs(q);

    let communityDocId;

    if (!querySnapshot.empty) {
      communityDocId = querySnapshot.docs[0].id;
    } else {
      const slug = `${fullCommunityName.toLowerCase().replace(/\s+/g, '-')}-${country.value.toLowerCase().replace(/\s+/g, '-')}`;
      const docRef = await addDoc(communitiesRef, {
        name: fullCommunityName,
        country: country.value,
        slug: slug,
        createdAt: serverTimestamp(),
      });
      communityDocId = docRef.id;
    }

    const uploadUrl = `${window.location.origin}/upload/${communityDocId}`;
    const qrCodeDataUrl = await QRCode.toDataURL(uploadUrl, { width: 300, margin: 2 });

    await updateDoc(doc(db, 'communities', communityDocId), {
      qrCodeUrl: qrCodeDataUrl,
      uploadUrl: uploadUrl,
      lastGeneratedAt: serverTimestamp(),
    });
    
    generatedUrl.value = uploadUrl;
    generatedQrCode.value = qrCodeDataUrl;

  } catch (error) {
    console.error('Error generating link:', error);
    errorMsg.value = 'An error occurred. Please try again.';
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
  chapterName.value = '';
  country.value = '';
}
</script>

<template>
  <div class="card">
    <div v-if="!generatedUrl" class="form-container">
      <div class="card-header">
        <h2>{{ t('generateLink') }}</h2>
        <p>{{ t('generateLinkSubtitle') }}</p>
      </div>
      <div class="form">
        <div class="autocomplete-wrapper">
          <div class="input-with-prefix">
            <span>GDG</span>
            <input type="text" v-model="chapterName" @input="errorMsg = ''" :placeholder="t('chapterName')" />
          </div>
        </div>
        
        <CountrySelector @countrySelected="handleCountrySelected">
          {{ country || t('selectCountry') }}
        </CountrySelector>
        
        <p v-if="errorMsg" class="error-text">{{ errorMsg }}</p>

        <button @click="generateLink" :disabled="isCreating || !chapterName || !country">
          {{ isCreating ? t('generating') : t('generateUploadLink') }}
        </button>
      </div>
    </div>

    <div v-else class="results-container">
      <div class="card-header">
        <h2>{{ t('linkReady') }}</h2>
        <p>{{ t('linkReadySubtitle') }}</p>
      </div>
      <div class="qr-code-wrapper">
        <img :src="generatedQrCode" alt="Generated QR Code" />
      </div>
      <div class="generated-link">
        <input type="text" :value="generatedUrl" readonly />
      </div>
      <button @click="createAnother">{{ t('generateAnother') }}</button>
    </div>
  </div>
</template>

<style scoped>
.form {
  position: relative;
}
.autocomplete-wrapper {
  position: relative;
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
