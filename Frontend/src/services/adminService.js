export const getAdminDashboard = async () => {
  await new Promise(resolve => setTimeout(resolve, 600));

  // In the future this will be: return fetch('/api/admin/dashboard').then(res => res.json())
  return {
    metrics: {
      totalDonors: "1,284",
      requestsToday: 47,
      fulfillmentRate: "94.2%"
    },
    centralInventory: [
      { type: 'A+', count: 12, critical: false },
      { type: 'A-', count: 4, critical: false },
      { type: 'O-', count: 2, critical: true },
      { type: 'B+', count: 8, critical: false },
      { type: 'B-', count: 5, critical: false },
      { type: 'O+', count: 32, critical: false },
      { type: 'AB+', count: 18, critical: false },
      { type: 'AB-', count: 1, critical: true }
    ],
    recentActivity: [
      {
        id: 1,
        type: "match",
        title: "Match Successful",
        description: "John D. matched with City General (O-)",
        timeAgo: "2m ago"
      },
      {
        id: 2,
        type: "alert",
        title: "Critical Shortage",
        description: "O- blood stock dropped below 5 units.",
        timeAgo: "14m ago"
      }
    ]
  };
};
