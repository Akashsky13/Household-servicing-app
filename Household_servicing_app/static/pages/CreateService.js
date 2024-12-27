const CreateService = {
  template: `
        <div class="container mt-4">
            <h1 class="text-center">Services Management</h1>

            <h2 class="mt-5 text-center">Existing Services</h2>
            <div v-if="services.length === 0" class="text-center mb-3">No services found.</div>

            <div class="table-responsive">
                <table class="table table-bordered">
                    <thead class="thead-dark">
                        <tr>
                            <th>Service Name</th>
                            <th>Price ($)</th>
                            <th>Time Required (hours)</th>
                            <th>Description</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="srv in services" :key="srv.id">
                            <td>{{ srv.name }}</td>
                            <td>{{ srv.price }}</td>
                            <td>{{ srv.time_required }}</td>
                            <td>{{ srv.description }}</td>
                            <td>
                                <button class="btn btn-warning btn-sm me-2" @click="openUpdateServiceModal(srv)">Update</button>
                                <button class="btn btn-danger btn-sm" @click="deleteService(srv.id)">Delete</button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Add New Service Button -->
            <div class="text-end mt-3">
                <button class="btn btn-success" @click="showCreateModal = true">
                    Add New Service
                </button>
            </div>

            <!-- Create Service Modal -->
            <div v-if="showCreateModal" class="modal">
                <div class="modal-content">
                    <span class="close" @click="closeCreateServiceModal">&times;</span>
                    <h2>Create New Service</h2>
                    <form @submit.prevent="createService">
                        <div class="mb-3">
                            <label for="service-name" class="form-label">Service Name</label>
                            <input type="text" id="service-name" v-model="service.name" class="form-control" required>
                        </div>
                        <div class="mb-3">
                            <label for="service-price" class="form-label">Price ($)</label>
                            <input type="number" id="service-price" v-model="service.price" class="form-control" required>
                        </div>
                        <div class="mb-3">
                            <label for="time-required" class="form-label">Time Required (in hours)</label>
                            <input type="number" id="time-required" v-model="service.time_required" class="form-control" required>
                        </div>
                        <div class="mb-3">
                            <label for="service-description" class="form-label">Description</label>
                            <textarea id="service-description" v-model="service.description" class="form-control" required></textarea>
                        </div>
                        <button type="submit" class="btn btn-primary">Create Service</button>
                        <div v-if="responseMessage" class="mt-3" :class="{'text-success': success, 'text-danger': !success}">
                            {{ responseMessage }}
                        </div>
                    </form>
                </div>
            </div>

            <!-- Update Service Modal -->
            <div v-if="showUpdateModal" class="modal">
                <div class="modal-content">
                    <span class="close" @click="closeUpdateServiceModal">&times;</span>
                    <h2>Update Service</h2>
                    <form @submit.prevent="updateService">
                        <div class="mb-3">
                            <label for="update-service-name" class="form-label">Service Name</label>
                            <input type="text" id="update-service-name" v-model="selectedService.name" class="form-control" required>
                        </div>
                        <div class="mb-3">
                            <label for="update-service-price" class="form-label">Price ($)</label>
                            <input type="number" id="update-service-price" v-model="selectedService.price" class="form-control" required>
                        </div>
                        <div class="mb-3">
                            <label for="update-time-required" class="form-label">Time Required (in hours)</label>
                            <input type="number" id="update-time-required" v-model="selectedService.time_required" class="form-control" required>
                        </div>
                        <div class="mb-3">
                            <label for="update-service-description" class="form-label">Description</label>
                            <textarea id="update-service-description" v-model="selectedService.description" class="form-control" required></textarea>
                        </div>
                        <button type="submit" class="btn btn-primary">Update Service</button>
                    </form>
                </div>
            </div>
        </div>
    `,
  data() {
    return {
      service: {
        name: "",
        price: null,
        time_required: null,
        description: "",
      },
      responseMessage: "",
      success: false,
      services: [],
      showCreateModal: false, // Controls visibility of the create modal
      showUpdateModal: false,
      selectedService: null,
    };
  },
  methods: {
    async createService() {
      try {
        const res = await fetch(window.location.origin + "/add-service", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            AuthenticationToken: sessionStorage.getItem("token"),
          },
          body: JSON.stringify(this.service),
        });

        if (res.ok) {
          this.success = true;
          this.responseMessage = "Service created successfully!";
          this.resetForm();
          await this.listServices(); 
          this.closeCreateServiceModal(); // Close the modal after successful creation
        } else {
          this.success = false;
          const errorResponse = await res.json();
          this.responseMessage =
            errorResponse.message || "Error creating service.";
        }
      } catch (error) {
        this.success = false;
        this.responseMessage = "Network error. Please try again later.";
      }
    },
    resetForm() {
      this.service = {
        name: "",
        price: null,
        time_required: null,
        description: "",
      };
    },
    async listServices() {
      try {
        const res = await fetch(window.location.origin + "/services", {
          headers: {
            AuthenticationToken: sessionStorage.getItem("token"),
          },
        });

        if (res.ok) {
          this.services = await res.json();
        } else {
          console.error("Error fetching services");
        }
      } catch (error) {
        console.error("Network error while fetching services", error);
      }
    },
    openUpdateServiceModal(service) {
      this.selectedService = { ...service }; 
      this.showUpdateModal = true; 
    },
    async updateService() {
      try {
        const res = await fetch(
          window.location.origin + `/update-service/${this.selectedService.id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              AuthenticationToken: sessionStorage.getItem("token"),
            },
            body: JSON.stringify(this.selectedService),
          }
        );

        if (res.ok) {
          this.success = true;
          this.responseMessage = "Service updated successfully!";
          await this.listServices(); 
          this.closeUpdateServiceModal(); 
        } else {
          this.success = false;
          const errorResponse = await res.json();
          this.responseMessage =
            errorResponse.message || "Error updating service.";
        }
      } catch (error) {
        this.success = false;
        this.responseMessage = "Network error. Please try again later.";
      }
    },
    async deleteService(serviceId) {
      if (confirm("Are you sure you want to delete this service?")) {
        try {
          const res = await fetch(
            window.location.origin + `/delete-service/${serviceId}`,
            {
              method: "DELETE",
              headers: {
                AuthenticationToken: sessionStorage.getItem("token"),
              },
            }
          );

          if (res.ok) {
            this.success = true;
            this.responseMessage = "Service deleted successfully!";
            await this.listServices(); 
          } else {
            this.success = false;
            const errorResponse = await res.json();
            this.responseMessage =
              errorResponse.message || "Error deleting service.";
          }
        } catch (error) {
          this.success = false;
          this.responseMessage = "Network error. Please try again later.";
        }
      }
    },
    closeCreateServiceModal() {
      this.showCreateModal = false; // Hide the create modal
      this.resetForm(); // Reset the form for the next time it's opened
    },
    closeUpdateServiceModal() {
      this.showUpdateModal = false; 
      this.selectedService = null; 
    },
  },
  created() {
    this.listServices(); 
  },
};

export default CreateService;
