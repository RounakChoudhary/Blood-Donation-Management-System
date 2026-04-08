const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

export const login = async (email, password) => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || data.message || "Login failed");
  }

  // Store token and user info in localStorage
  if (data.token) {
    localStorage.setItem("token", data.token);
  }
  if (data.user) {
    localStorage.setItem("user", JSON.stringify(data.user));
  }

  return data; // { token, user: { id, email, role } }
};

export const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};

export const getAuthToken = () => {
  return localStorage.getItem("token");
};

export const getAuthUser = () => {
  const user = localStorage.getItem("user");
  try {
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
};

export const isLoggedIn = () => {
  return !!localStorage.getItem("token");
};

export const register = async ({ full_name, email, password, phone, lon, lat }) => {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ full_name, email, password, phone, lon, lat }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Registration failed");
  }

  return data; // { message, user }
};

export const verifyOtp = async (email, otp) => {
  const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, otp }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "OTP verification failed");
  }

  return data; // { message, user }
};

export const registerHospital = async ({ name, phone, email, address, lon, lat }) => {
  const response = await fetch(`${API_BASE_URL}/hospitals/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, phone, email, address, lon, lat }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Hospital registration failed");
  }

  return data; // { message, hospital }
};

export const loginHospital = async (email, password) => {
  const response = await fetch(`${API_BASE_URL}/hospitals/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Hospital login failed");
  }

  if (data.token) localStorage.setItem("token", data.token);
  // Unify the stored object shape so our App router understands 'role'
  if (data.hospital) {
    localStorage.setItem("user", JSON.stringify({ 
      id: data.hospital.id, 
      email: data.hospital.email, 
      role: 'hospital', 
      name: data.hospital.name 
    }));
  }

  return data;
};

export const registerBloodBank = async ({ name, license_number, address, lon, lat, contact_person, contact_phone, email }) => {
  const response = await fetch(`${API_BASE_URL}/blood-banks/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, license_number, address, lon, lat, contact_person, contact_phone, email }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Blood bank registration failed");
  }

  return data;
};

export const loginBloodBank = async (email, password) => {
  const response = await fetch(`${API_BASE_URL}/blood-banks/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Blood bank login failed");
  }

  if (data.token) localStorage.setItem("token", data.token);
  if (data.bloodBank) {
    localStorage.setItem("user", JSON.stringify({
      id: data.bloodBank.id,
      email: data.bloodBank.email,
      role: 'bloodbank',
      name: data.bloodBank.name
    }));
  }

  return data;
};
