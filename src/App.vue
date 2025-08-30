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
        <!-- Use the new, user-provided logo -->
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
        With ❤ by <a href="https://gdg.community.dev/gdg-ado-ekiti" target="_blank">GDG Ado-Ekiti</a> 🇳🇬 | <a href="https://sites.google.com/view/devfestavatarcreatorprivacy/home" target="_blank">Privacy</a>
      </p>
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
  height: 28px; /* Maintain a consistent height */
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

.app-footer a {
  color: var(--color-primary);
  text-decoration: none;
}

.app-footer a:hover {
  text-decoration: underline;
}
</style>
