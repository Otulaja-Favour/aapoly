<script setup>
import ConfigNotice from '@/components/ConfigNotice.vue'
import Logo from '@/components/Logo.vue'
</script>

<template>
  <div class="page">
    <header class="nav">
      <div class="wrap nav-inner">
        <div class="brand">
          <Logo />
        </div>
        <nav class="nav-links">
          <RouterLink class="nav-link" to="/student">Student portal</RouterLink>
        </nav>
      </div>
    </header>

    <main class="wrap main">
      <ConfigNotice />

      <section class="hero">
        <span class="badge brand">Group project assignment</span>
        <h1>Split the class into teams and hand out projects — in one click.</h1>
        <p class="muted hero-sub">
          Upload every student by full name and matric number, let the system shuffle them into
          random groups, and assign each group a project. Students then check their team and
          assignment from the portal.
        </p>
      </section>

      <section class="paths">
        <RouterLink class="path card" to="/student">
          <span class="path-icon alt">ST</span>
          <h3>I'm a student</h3>
          <p class="muted">
            Enter your matric number to see your group, your teammates, and the project your group
            was given.
          </p>
          <span class="path-cta">Check my group →</span>
        </RouterLink>
      </section>
    </main>

    <footer class="footer">
      <div class="wrap muted">AAPoly · class project assignments</div>
    </footer>
  </div>
</template>

<style scoped>
.page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.wrap {
  width: 100%;
  max-width: 1080px;
  margin: 0 auto;
  padding: 0 24px;
}

.nav {
  border-bottom: 1px solid var(--border);
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(8px);
  position: sticky;
  top: 0;
  z-index: 10;
}

.nav-inner {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 18px;
}

.nav-link {
  font-size: 14.5px;
  font-weight: 500;
  color: var(--muted);
}
.nav-link:hover {
  color: var(--text);
}

.main {
  flex: 1;
  padding-top: 48px;
  padding-bottom: 64px;
  display: flex;
  flex-direction: column;
  gap: 36px;
}

.hero {
  max-width: 720px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.hero h1 {
  font-size: clamp(30px, 5vw, 46px);
  font-weight: 700;
}

.hero-sub {
  font-size: 16.5px;
}

.paths {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
}

.path {
  padding: 26px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
}
.path:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow);
  border-color: var(--border-strong);
}

.path-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: var(--brand-soft);
  color: var(--brand-strong);
  display: grid;
  place-items: center;
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: 14px;
}
.path-icon.alt {
  background: var(--success-soft);
  color: var(--success);
}

.path h3 {
  font-size: 20px;
}

.path p {
  font-size: 14.5px;
  margin: 0;
}

.path-cta {
  margin-top: 4px;
  font-weight: 600;
  color: var(--brand);
  font-size: 14.5px;
}

.footer {
  border-top: 1px solid var(--border);
  padding: 22px 0;
  font-size: 13.5px;
}
</style>
