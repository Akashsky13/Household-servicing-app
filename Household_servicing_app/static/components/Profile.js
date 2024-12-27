const Profile = {
  template: `
    <div class="profile-container">
      <h2>Email: {{ email }}</h2>
      <h2>Role: {{ displayRole }}</h2>
      <div v-if="isAdmin">
        <p>You have admin privileges. </p>
      </div>
      <form v-if="!isAdmin" @submit.prevent="updateProfile" class="profile-form">
        <div class="form-group">
          <label for="fullName">Full Name:</label>
          <input type="text" id="fullName" v-model="fullName" required class="form-control">
        </div>
        <div class="form-group">
          <label for="mobile">Mobile:</label>
          <input type="text" id="mobile" v-model="mobile" required class="form-control">
        </div>
        <div class="form-group">
          <label for="location">Location:</label>
          <input type="text" id="location" v-model="location" required class="form-control">
        </div>
        <div class="form-group">
          <label for="pincode">Pincode:</label>
          <input type="text" id="pincode" v-model="pincode" required class="form-control">
        </div>
        <button type="submit" :disabled="loading" class="btn-submit">Update Profile</button>
        <div v-if="loading" class="loading-indicator">Updating...</div>
      </form>
    </div>
  `,
  data() {
    return {
      email: sessionStorage.getItem("email"),
      role: sessionStorage.getItem("role"),
      id: sessionStorage.getItem("id"),
      fullName: "",
      mobile: "",
      location: "",
      pincode: "",
      loading: false,
    };
  },
  computed: {
    // Computed property to display the role as "Customer," "Professional," or "Admin"
    displayRole() {
      return this.role === "cust"
        ? "Customer"
        : this.role === "prof"
        ? "Professional"
        : this.role === "admin"
        ? "Admin"
        : "Unknown Role";
    },
    isAdmin() {
      // Computed property to determine if the user is an admin
      return this.role === "admin";
    },
  },
  methods: {
    async loadUserData() {
      try {
        const response = await fetch(
          `${window.location.origin}/api/user/${this.id}`
        );
        if (response.ok) {
          const userData = await response.json();
          this.setUserData(userData);
        } else {
          console.error("Failed to load user data");
        }
      } catch (error) {
        console.error("Error loading user data:", error);
      }
    },
    setUserData(userData) {
      this.fullName = userData.full_name;
      this.mobile = userData.mobile;
      this.location = userData.location;
      this.pincode = userData.pincode;
    },
    async updateProfile() {
      if (!this.validateInput()) return;

      console.log({
        full_name: this.fullName,
        mobile: this.mobile,
        location: this.location,
        pincode: this.pincode,
      });

      this.loading = true;
      try {
        const response = await fetch(`${window.location.origin}/api/user/update`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authentication-Token": sessionStorage.getItem("token"), // Use the correct token header
          },

          body: JSON.stringify({
            full_name: this.fullName,
            mobile: this.mobile,
            location: this.location,
            pincode: this.pincode,
          }),
        });

        if (response.status === 401) {
          alert("Session expired. Please log in again.");
          window.location.href = "/#/login";
        } else if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log("Profile updated successfully:", data.message);
        alert("Profile updated successfully!");
        this.loadUserData();
      } catch (error) {
        console.error("Error updating profile:", error);
        alert("Failed to update profile. Please try again.");
      } finally {
        this.loading = false;
      }
    },
    validateInput() {
      const mobilePattern = /^[0-9]{10}$/;
      if (!mobilePattern.test(this.mobile)) {
        alert("Mobile number must be 10 digits.");
        return false;
      }
      return true;
    },
  },
  created() {
    this.loadUserData();
  },
};

export default Profile;
