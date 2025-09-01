<script setup>
import { onMounted, ref } from 'vue';
import { auth } from '@/firebase';
import { onAuthStateChanged, signInAnonymously } from "firebase/auth";
import { RouterLink, RouterView } from 'vue-router';

const isLoading = ref(true);
const authError = ref(null);

onMounted(() => {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      isLoading.value = false;
      authError.value = null;
    } else {
      signInAnonymously(auth).catch((error) => {
        console.error("Detailed anonymous sign-in error:", error);
        authError.value = `Authentication failed: ${error.message}. Please check your Firebase configuration.`;
        isLoading.value = false;
      });
    }
  });
});
</script>

<template>
  <div id="app-container">
    <header class="app-header">
      <RouterLink to="/" class="brand">
        <img src="/devfest-logo.png" alt="DevFest Logo" class="logo" />
        <span>DevFest Photos</span>
      </RouterLink>
      <nav class="main-nav">
        <RouterLink to="/" class="nav-link">Explore</RouterLink>
        <RouterLink to="/create" class="nav-link">Create</RouterLink>
      </nav>
    </header>

    <main>
      <div v-if="isLoading" class="status-container">
        <p>Connecting to the gallery...</p>
      </div>
      <div v-else-if="authError" class="status-container error">
        <p>{{ authError }}</p>
      </div>
      <RouterView v-else />
    </main>

    <footer class="app-footer">
      <p>
        With ❤️ by <a href="https://gdg.community.dev/gdg-ado-ekiti" target="_blank">GDG Ado-Ekiti</a> 🇳🇬 | <a href="https://sites.google.com/view/devfestphotogallery/home" target="_blank">Privacy</a>
      </p>
      <a href="https://github.com/stont/devfest-photo-gallery" target="_blank" class="open-source-link">
        open source
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
      </a>
    </footer>
  </div>
</template>

<style scoped>
.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  border-bottom: 1px solid var(--color-border);
  margin-bottom: 2rem;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  color: var(--color-text-primary);
  font-size: 1.2em;
  font-weight: 500;
}

.logo {
  height: 28px;
}

.main-nav {
  display: flex;
  gap: 1.5rem;
}

.nav-link {
  text-decoration: none;
  color: var(--color-text-secondary);
  font-weight: 500;
  transition: color 0.2s ease;
}

.nav-link:hover,
.nav-link.router-link-exact-active {
  color: var(--color-primary);
}

.status-container {
  text-align: center;
  padding: 40px;
  font-size: 1.2em;
  background-color: var(--color-surface);
  border-radius: 8px;
}

.status-container.error {
  color: #ff6b6b;
  border: 1px solid #ff6b6b;
  background-color: #2c2222;
}

.app-footer {
  text-align: center;
  margin-top: 4rem;
  padding: 20px;
  border-top: 1px solid var(--color-border);
  color: var(--color-text-secondary);
}

.app-footer p {
  margin: 0 0 1rem;
}

.app-footer a {
  color: var(--color-primary);
  text-decoration: none;
}

.app-footer a:hover {
  text-decoration: underline;
}

.open-source-link {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background-color: var(--color-surface);
  padding: 5px 10px;
  border-radius: 8px;
  color: var(--color-text-secondary);
  font-size: 0.9em;
}

.open-source-link svg {
  stroke: var(--color-text-secondary);
}
</style>
