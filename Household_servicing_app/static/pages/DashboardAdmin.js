const DashboardAdmin = {
  template: ` 
    <div class="container mt-4">
        <button class="btn btn-primary" @click="exportClosedRequests">
          Export Closed Requests to CSV
        </button>

        <!-- Inactive Professionals Section -->
        <h3 class="mt-5">Professionals</h3>
        <div class="search-container">
      <input
        type="text"
        v-model="searchEmailProf"
        placeholder="Search by Email"
        @input="searchProfessionals"
        class="search-input"
      />
      <input
        type="text"
        v-model="searchLocationProf"
        placeholder="Search by Location"
        @input="searchProfessionals"
        class="search-input"
      />
    
        <input
          type="checkbox"
          v-model="blockedProf"
          @change="searchProfessionals"
          class="search-checkbox"
        />
        Blocked
    
    </div>
        <div v-if="inactiveProf.length === 0">
            <p>No inactive professionals found.</p>
        </div>
        <div v-else class="table-responsive">
            <table class="table table-bordered table-striped">
                <thead class="thead-dark">
                    <tr>
                        <th>Email</th>
                        <th>Mobile</th>
                        <th>Location</th>
                        <th>Service Type</th>
                        <th>Experience</th>
                        <th>Documents</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="user in inactiveProf" :key="user.id">
                        <td>{{ user.email }}</td>
                        <td>{{ user.mobile || 'N/A' }}</td>
                        <td>{{ user.location || 'N/A' }}</td>
                        <td>{{ user.service_type || 'N/A' }}</td>
                        <td>{{ user.experience_years || 'N/A' }} years</td>
                        <td>
                            <a v-if="user.documents" :href="user.documents" target="_blank">View Documents</a>
                            <span v-else>No documents</span>
                        </td>
                        <td>
                            <button v-if="!user.active" class="btn btn-success btn-sm" @click="activate(user.id)">Activate</button>
                            <button v-if="!user.blocked && user.active" class="btn btn-danger btn-sm" @click="blockUser(user.id)">Block</button>
                            <button v-else-if="user.blocked && user.active" class="btn btn-warning btn-sm" @click="unblockUser(user.id)">Unblock</button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- Active Customers Section -->
        <h3 class="mt-5">Customers</h3>
        <div class="search-container">
            <input type="text" v-model="searchEmailCust" placeholder="Search by Email" @input="searchCustomers" class="search-input" />
            <input type="text" v-model="searchNameCust" placeholder="Search by Name" @input="searchCustomers" class="search-input" />
            <input type="text" v-model="searchLocationCust" placeholder="Search by Location" @input="searchCustomers" class="search-input" />
            <input type="checkbox" v-model="blockedCust" @change="searchCustomers" class="search-checkbox" /> Blocked
        </div>
        <div v-if="activeCustomers.length === 0">
            <p>No active customers found.</p>
        </div>
        <div v-else class="table-responsive">
            <table class="table table-bordered table-striped">
                <thead class="thead-dark">
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Mobile</th>
                        <th>Location</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="customer in activeCustomers" :key="customer.id">
                        <td>{{ customer.full_name }}</td>
                        <td>{{ customer.email }}</td>
                        <td>{{ customer.mobile || 'N/A' }}</td>
                        <td>{{ customer.location || 'N/A' }}</td>
                        <td>
                            <button v-if="!customer.blocked" class="btn btn-danger btn-sm" @click="blockCustomer(customer.id)">Block</button>
                            <button v-else class="btn btn-success btn-sm" @click="unblockCustomer(customer.id)">Unblock</button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
  `,
  data() {
    return {
      inactiveProf: [],
      activeCustomers: [],
      searchEmailProf: "",
      searchLocationProf: "",
      blockedProf: false,
      searchEmailCust: "",
      searchNameCust: "",
      searchLocationCust: "",
      blockedCust: false,
    };
  },
  methods: {
    async exportClosedRequests() {
      const res = await fetch(window.location.origin + "/start-export", {
        headers: {
          AuthenticationToken: sessionStorage.getItem("token"),
        },
      });

      if (res.ok) {
        const data = await res.json();
        const downloadLink = window.location.origin + "/download-file/closed_requests.csv";
        const a = document.createElement("a");
        a.href = downloadLink;
        a.click();
        alert("Export completed successfully!");
      } else {
        alert("Failed to export closed requests.");
      }
    },
    async fetchInactiveProfessionals() {
      const professionalsRes = await fetch(
        window.location.origin + "/inactive_professional",
        {
          headers: {
            AuthenticationToken: sessionStorage.getItem("token"),
          },
        }
      );
      this.inactiveProf = await professionalsRes.json();
    },
    async fetchActiveCustomers() {
      const customersRes = await fetch(
        window.location.origin + "/active_customers",
        {
          headers: {
            AuthenticationToken: sessionStorage.getItem("token"),
          },
        }
      );
      this.activeCustomers = await customersRes.json();
    },
    async searchProfessionals() {
      const res = await fetch(
        window.location.origin +
          "/search_professionals?email=" +
          this.searchEmailProf +
          "&location=" +
          this.searchLocationProf +
          "&blocked=" +
          this.blockedProf,
        {
          headers: {
            AuthenticationToken: sessionStorage.getItem("token"),
          },
        }
      );
      this.inactiveProf = await res.json();
    },
    async searchCustomers() {
      const res = await fetch(
        window.location.origin +
          "/search_customers?email=" +
          this.searchEmailCust +
          "&name=" +
          this.searchNameCust +
          "&location=" +
          this.searchLocationCust +
          "&blocked=" +
          this.blockedCust,
        {
          headers: {
            AuthenticationToken: sessionStorage.getItem("token"),
          },
        }
      );
      this.activeCustomers = await res.json();
    },
    async blockUser(id) {
      const res = await fetch(window.location.origin + "/block-user/" + id, {
        method: "POST",
        headers: {
          AuthenticationToken: sessionStorage.getItem("token"),
        },
      });

      if (res.ok) {
        alert("User blocked");
        this.inactiveProf = this.inactiveProf.map((user) =>
          user.id === id ? { ...user, blocked: true } : user
        );
      }
    },
    async unblockUser(id) {
      const res = await fetch(window.location.origin + "/unblock-user/" + id, {
        method: "POST",
        headers: {
          AuthenticationToken: sessionStorage.getItem("token"),
        },
      });

      if (res.ok) {
        alert("User unblocked");
        this.inactiveProf = this.inactiveProf.map((user) =>
          user.id === id ? { ...user, blocked: false } : user
        );
      }
    },
    async blockCustomer(id) {
      const res = await fetch(window.location.origin + "/block-user/" + id, {
        method: "POST",
        headers: {
          AuthenticationToken: sessionStorage.getItem("token"),
        },
      });

      if (res.ok) {
        alert("Customer blocked");
        this.activeCustomers = this.activeCustomers.map((customer) =>
          customer.id === id ? { ...customer, blocked: true } : customer
        );
      }
    },
    async unblockCustomer(id) {
      const res = await fetch(window.location.origin + "/unblock-user/" + id, {
        method: "POST",
        headers: {
          AuthenticationToken: sessionStorage.getItem("token"),
        },
      });

      if (res.ok) {
        alert("Customer unblocked");
        this.activeCustomers = this.activeCustomers.map((customer) =>
          customer.id === id ? { ...customer, blocked: false } : customer
        );
      }
    },
    async activate(id) {
      const res = await fetch(window.location.origin + "/activate-prof/" + id, {
        method: "POST",
        headers: {
          AuthenticationToken: sessionStorage.getItem("token"),
        },
      });

      if (res.ok) {
        alert("Professional activated");
        this.inactiveProf = this.inactiveProf.filter((user) => user.id !== id);
      } else {
        const errorData = await res.json();
        alert("Error activating professional: " + errorData.message);
      }
    },
  },
  async created() {
    const professionalsRes = await fetch(
      window.location.origin + "/inactive_professional",
      {
        headers: {
          AuthenticationToken: sessionStorage.getItem("token"),
        },
      }
    );
    this.inactiveProf = await professionalsRes.json();
    console.log("Inactive Professionals:", this.inactiveProf);

    const customersRes = await fetch(
      window.location.origin + "/active_customers",
      {
        headers: {
          AuthenticationToken: sessionStorage.getItem("token"),
        },
      }
    );
    this.activeCustomers = await customersRes.json();
    console.log("Active Customers:", this.activeCustomers);
  },
};

export default DashboardAdmin;
