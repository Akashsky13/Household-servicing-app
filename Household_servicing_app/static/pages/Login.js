import router from "../utils/router.js";

const Login = {
  template: `
    <div class="d-flex justify-content-center align-items-center vh-100">
      <div class="card shadow p-4 border rounded-3 ">
        <h3 class="card-title text-center mb-4">Login</h3>
        <div class="form-group mb-3">
          <input v-model="email" type="email" class="form-control" placeholder="Email" required/>
        </div>
        <div class="form-group mb-4">
          <input v-model="password" type="password" class="form-control" placeholder="Password" required/>
        </div>
        <div v-if="errorMessage" class="alert alert-danger" role="alert">
          {{ errorMessage }}
        </div>
        <button class="btn btn-primary w-100" @click="submitInfo" :disabled="loading || !email || !password">
          <span v-if="loading" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
          {{ loading ? 'Logging in...' : 'Submit' }}
        </button>
      </div>
    </div>
  `,
  data() {
    return {
      email: "",
      password: "",
      errorMessage: null,  // To show error messages in the UI
      loading: false,      // Loading state for login request
    };
  },
  methods: {
    async submitInfo() {
      // Clear previous error message
      this.errorMessage = null;

      // Basic validation (additional to 'required' HTML attribute)
      if (!this.email || !this.password) {
        this.errorMessage = "Email and password are required.";
        return;
      }

      this.loading = true; // Set loading state

      try {
        const url = window.location.origin;
        const res = await fetch(url + "/user-login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email: this.email, password: this.password }),
        });

        if (res.ok) {
          const data = await res.json();

          // Store token and user information in sessionStorage
          sessionStorage.setItem("token", data.token);
          sessionStorage.setItem("role", data.role);
          sessionStorage.setItem("email", data.email);
          sessionStorage.setItem("id", data.id);

          // Set login and role in Vuex store
          this.$store.commit("setRole", data.role);
          this.$store.commit("setLogin", true);

          // Redirect based on user role
          switch (data.role) {
            case "cust":
              this.$router.push("/dashboard-cust");
              break;
            case "prof":
              this.$router.push("/dashboard-prof");
              break;
            case "admin":
              this.$router.push("/dashboard-admin");
              break;
            default:
              this.errorMessage = "Unknown role. Please contact support.";
          }
        } else {
          // Improved error message handling
          const errorMessage = await res.json();
          this.errorMessage = errorMessage.message || "Login failed. Please try again.";
        }
      } catch (error) {
        console.error("Error during login:", error);
        this.errorMessage = "An error occurred. Please check your network connection.";
      } finally {
        this.loading = false; // Reset loading state after request
      }
    },
  },
};

export default Login;
