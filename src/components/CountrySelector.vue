<script setup>
import { ref, computed } from 'vue';
import countries from '@/countries.json'; // Use the new path alias

const emit = defineEmits(['countrySelected']);
const searchQuery = ref('');
const isOpen = ref(false);

const filteredCountries = computed(() => {
  if (!searchQuery.value) {
    return countries;
  }
  return countries.filter(country =>
    country.name.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

function selectCountry(country) {
  emit('countrySelected', country.name);
  isOpen.value = false;
  searchQuery.value = '';
}
</script>

<template>
  <div class="country-selector">
    <button @click="isOpen = !isOpen" class="dropdown-button">
      <slot></slot>
    </button>
    <div v-if="isOpen" class="dropdown-menu">
      <input type="text" v-model="searchQuery" placeholder="Search for a country..." class="search-input"/>
      <ul class="country-list">
        <li v-for="country in filteredCountries" :key="country.code" @click="selectCountry(country)">
          {{ country.name }}
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.country-selector {
  position: relative;
}

.dropdown-button {
  width: 100%;
  text-align: left;
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  color: var(--color-text-primary);
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  margin-top: 5px;
  z-index: 10;
  max-height: 200px;
  overflow-y: auto;
}

.search-input {
  width: 100%;
  border-bottom: 1px solid var(--color-border);
}

.country-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.country-list li {
  padding: 10px 15px;
  cursor: pointer;
}

.country-list li:hover {
  background-color: var(--color-background);
}
</style>
