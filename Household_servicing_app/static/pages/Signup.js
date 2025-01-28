const Signup = {
  template: `
    <div class="d-flex justify-content-center align-items-center vh-100">
      <div class="card shadow p-4">
        <h3 class="card-title text-center mb-4">Sign Up</h3>

        <div class="form-group mb-3">
          <input v-model="fullName" type="text" class="form-control" placeholder="Full Name" required/>
        </div>
        <div class="form-group mb-3">
          <input v-model="email" type="email" class="form-control" placeholder="Email" required/>
        </div>
        <div class="form-group mb-4">
          <input v-model="password" type="password" class="form-control" placeholder="Password" required/>
        </div>
        <div class="form-group mb-4">
          <select v-model="role" class="form-control" @change="fetchServices">
  <option value="" disabled>Select Role</option>
  <option value="cust">Customer</option>
  <option value="prof">Professional</option>
</select>

        </div>

        <!-- Additional fields for professionals -->
        <div v-if="role === 'prof'">
          <div class="form-group mb-3">
            <input v-model="serviceType" type="text" class="form-control" placeholder="Service Type" list="serviceList" @input="setServiceId"/>
            <datalist id="serviceList">
              <option v-for="service in services" :key="service.id" :value="service.name"></option>
            </datalist>
          </div>
          <div class="form-group mb-3">
            <input v-model="experienceYears" type="number" class="form-control" placeholder="Experience in Years"/>
          </div>
          <div class="form-group mb-3">
            <input v-model="location" type="text" class="form-control" placeholder="Location"/>
          </div>
          <div class="form-group mb-3">
            <input v-model="pincode" type="text" class="form-control" placeholder="Pincode"/>
          </div>
          <div class="form-group mb-3">
            <input v-model="mobile" type="text" class="form-control" placeholder="Mobile"/>
          </div>
          <!-- File Upload Input for ZIP -->
          <div class="form-group mb-3">
            <label>Upload Documents (ZIP)</label>
            <input ref="file" type="file" @change="handleFileUpload" class="form-control" accept=".zip"/>
          </div>
        </div>

        <!-- Additional fields for customers -->
        <div v-if="role === 'cust'">
          <div class="form-group mb-3">
            <input v-model="location" type="text" class="form-control" placeholder="Location"/>
          </div>
          <div class="form-group mb-3">
            <input v-model="pincode" type="text" class="form-control" placeholder="Pincode"/>
          </div>
          <div class="form-group mb-3">
            <input v-model="mobile" type="text" class="form-control" placeholder="Mobile"/>
          </div>
        </div>

        <button class="btn btn-primary w-100" @click="submitInfo">Submit</button>
      </div>
    </div>
  `,
  data() {
    return {
      fullName: "",
      email: "",
      password: "",
      role: "",
      serviceType: "",
      experienceYears: "",
      location: "",
      pincode: "",
      mobile: "",
      file: null,
      services: [], // New property to hold the services
    };
  },
  methods: {
    async fetchServices() {
      if (this.role === "prof") {
        const origin = window.location.origin;
        const url = `${origin}/services`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          this.services = data;
        } else {
          console.error("Failed to fetch services");
          alert("Unable to fetch services. Please try again later.");
        }
      } else {
        this.services = []; // Clear services for non-professionals
      }
    },
    
    handleFileUpload(event) {
      this.file = event.target.files[0]; // Get the selected file (ZIP)
    },
    async submitInfo() {
      // Validation for required fields
      if (!this.fullName || !this.email || !this.password || !this.role) {
        alert("Please fill out all required fields.");
        return;
      }
    
      // Validate serviceType for professionals
      if (this.role === "prof") {
        const isServiceValid = this.services.some(service => service.name === this.serviceType);
        if (!isServiceValid) {
          alert("Please select a valid service type.");
          return;
        }
      }
    
      const formData = new FormData();
      formData.append("full_name", this.fullName);
      formData.append("email", this.email);
      formData.append("password", this.password);
      formData.append("role", this.role);
    
      if (this.role === "prof") {
        formData.append("service_type", this.serviceType);
        formData.append("experience_years", this.experienceYears);
        formData.append("location", this.location);
        formData.append("pincode", this.pincode);
        formData.append("mobile", this.mobile);
        if (this.file) {
          formData.append("documents", this.file); // Append the ZIP file
        }
      }
    
      if (this.role === "cust") {
        formData.append("location", this.location);
        formData.append("pincode", this.pincode);
        formData.append("mobile", this.mobile);
      }
    
      const origin = window.location.origin;
      const url = `${origin}/register`;
      const res = await fetch(url, {
        method: "POST",
        body: formData,
        credentials: "same-origin",
      });
    
      if (res.ok) {
        const data = await res.json();
        console.log(data);
        this.$router.push("/login");
      } else {
        const errorData = await res.json();
        console.error("Sign up failed:", errorData);
        alert("Sign up failed. Please try again.");
      }
    },
    
    setServiceId() {
      const selectedService = this.services.find(service => service.name === this.serviceType);
      if (selectedService) {
        this.serviceId = selectedService.id; // Store the selected service ID if needed
      }
    }
  },
};

export default Signup;
