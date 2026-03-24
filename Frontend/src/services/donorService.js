export const getDonorDashboard = async () => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 600));

  // In the future this will be: return fetch('/api/donors/dashboard').then(res => res.json())
  return {
    daysRemaining: 74,
    isCooldown: true,
    profileCompletion: 80,
    totalDonations: 4,
    livesImpacted: 12,
    history: [
      {
        id: 1,
        date: "Oct 12, 2025",
        location: "City General Hospital",
        bloodGroup: "O-",
        status: "Fulfilled"
      },
      {
        id: 2,
        date: "Jul 04, 2025",
        location: "St. Mary Medical Center",
        bloodGroup: "O-",
        status: "Fulfilled"
      }
    ]
  };
};
