const Navbar = {
  template: `
    <nav class="nav nav-pills nav-fill gap-2 p-1 small bg-black rounded-pill shadow-sm" style="--bs-nav-link-color: var(--bs-white); --bs-nav-pills-link-active-color: var(--bs-white); --bs-nav-pills-link-active-bg: var(--bs-white);">
      <router-link class="nav-link" :class="{ active: isActive('/') }" to="/">Home</router-link>
      <router-link v-if="!state.loggedIn" class="nav-link" :class="{ active: isActive('/login') }" to="/login">Login</router-link>
      <router-link v-if="!state.loggedIn" class="nav-link" :class="{ active: isActive('/signup') }" to="/signup">Signup</router-link>
      <router-link v-if="state.loggedIn && state.role === 'cust'" class="nav-link" :class="{ active: isActive('/dashboard-cust') }" to="/dashboard-cust">Dashboard</router-link>
      <router-link v-if="state.loggedIn && state.role === 'prof'" class="nav-link" :class="{ active: isActive('/dashboard-prof') }" to="/dashboard-prof">Dashboard</router-link>
      <router-link v-if="state.loggedIn && state.role === 'admin'" class="nav-link" :class="{ active: isActive('/dashboard-admin') }" to="/dashboard-admin">Dashboard</router-link>
      <router-link v-if="state.loggedIn && state.role === 'admin'" class="nav-link" :class="{ active: isActive('/create-service') }" to="/create-service">Create Service</router-link>
      <router-link v-if="state.loggedIn && state.role === 'admin'" class="nav-link" :class="{ active: isActive('/AdminStats') }" to="/AdminStats">Analytics</router-link>
      <router-link v-if="state.loggedIn && state.role === 'cust'" class="nav-link" :class="{ active: isActive('/CustStats') }" to="/CustStats">Analytics</router-link>
      <router-link v-if="state.loggedIn && state.role === 'prof'" class="nav-link" :class="{ active: isActive('/ProfStats') }" to="/ProfStats">Analytics</router-link>
      <router-link v-if="state.loggedIn" class="nav-link" :class="{ active: isActive('/profile') }" to="/profile">Profile</router-link>
      <span v-if="state.loggedIn" class="nav-link" @click="logout" style="cursor: pointer;">Logout</span>
    </nav>
  `,
  methods: {
    logout() {
      sessionStorage.clear();
      this.$store.commit("logout");
      this.$router.push("/");
    },
    isActive(route) {
      return this.$route.path === route;
    },
  },
  computed: {
    state() {
      return this.$store.state;
    },
  },
};

export default Navbar;
