import Home from "../components/Home.js";
import Login from "../pages/Login.js";
import Signup from "../pages/Signup.js";
import Logout from "../pages/Logout.js";
import DashboardCust from "../pages/DashboardCust.js";
import DashboardProf from "../pages/DashboardProf.js";
import DashboardAdmin from "../pages/DashboardAdmin.js";
import CreateService from "../pages/CreateService.js";
import Profile from "../components/Profile.js";
import AdminStats from "../pages/AdminStats.js";
import CustStats from "../pages/CustStats.js";
import ProfStats from "../pages/ProfStats.js";

const routes = [
  { path: "/", component: Home },
  { path: "/login", component: Login },
  { path: "/signup", component: Signup },
  {
    path: "/AdminStats",
    component: AdminStats,
    meta: { requiresLogin: true, role: "admin" },
  },
  {
    path: "/CustStats",
    component: CustStats,
    meta: { requiresLogin: true, role: "cust" },
  },
  {
    path: "/ProfStats",
    component: ProfStats,
    meta: { requiresLogin: true, role: "prof" },
  },
  { path: "/logout", component: Logout },
  {
    path: "/dashboard-cust",
    component: DashboardCust,
    meta: { requiresLogin: true, role: "cust" },
  },
  {
    path: "/dashboard-prof",
    component: DashboardProf,
    meta: { requiresLogin: true, role: "prof" },
  },
  {
    path: "/dashboard-admin",
    component: DashboardAdmin,
    meta: { requiresLogin: true, role: "admin" },
  },
  {
    path: "/create-service",
    component: CreateService,
    meta: { requiresLogin: true, role: "admin" },
  },
  { path: "/profile", component: Profile, meta: { loggedIn: true } },
];

const router = new VueRouter({
  routes,
});

// frontend router protection
router.beforeEach((to, from, next) => {
  const token = sessionStorage.getItem("token");
  const role = sessionStorage.getItem("role");

  // Check if the token exists
  const isLoggedIn = token && token !== "undefined"; // Add your logic to validate token if needed
  const requiresLogin = to.matched.some((record) => record.meta.requiresLogin);

  if (requiresLogin && !isLoggedIn) {
    next({ path: "/login" });
  } else if (to.meta.role && to.meta.role !== role) {
    next({ path: "/" });
  } else {
    next();
  }
});

export default router;
