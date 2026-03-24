export const getProfileSettings = async () => {
  await new Promise(resolve => setTimeout(resolve, 600));

  // In the future this will be: return fetch('/api/user/profile').then(res => res.json())
  return {
    firstName: "John",
    lastName: "Doe",
    bloodGroup: "O-",
    phoneNumber: "+1 (555) 123-4567",
    location: "New York, NY",
    donorLevel: "Gold",
    isEligible: true,
    notifications: {
      emergencyAlerts: true,
      emailUpdates: false
    }
  };
};

export const updateProfile = async (payload) => {
  await new Promise(resolve => setTimeout(resolve, 600));
  return { success: true, message: "Profile updated successfully", data: payload };
};
