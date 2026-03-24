export const getBloodBankDashboard = async () => {
  await new Promise(resolve => setTimeout(resolve, 600));

  // In the future this will be: return fetch('/api/bloodbanks/dashboard').then(res => res.json())
  return {
    inventory: [
      { id: 1, type: 'O-', count: 2, critical: true, nearestExpiry: 'Oct 24, 2026' },
      { id: 2, type: 'A+', count: 12, critical: false, nearestExpiry: 'Nov 15, 2026' },
      { id: 3, type: 'B+', count: 8, critical: false, nearestExpiry: 'Nov 02, 2026' }
    ],
    nearbyBanks: [
      { 
        id: 1, 
        name: 'Sunrise Blood Center', 
        distance: '4.2 km away', 
        stock: [{ group: 'O-', count: 4, critical: true }, { group: 'A+', count: 18, critical: false }] 
      },
      { 
        id: 2, 
        name: 'Hope Foundation Bank', 
        distance: '7.6 km away', 
        stock: [{ group: 'O-', count: 1, critical: true }, { group: 'B-', count: 3, critical: false }] 
      }
    ]
  };
};

export const updateStock = async (payload) => {
  await new Promise(resolve => setTimeout(resolve, 600));
  return { success: true, message: "Stock updated securely", data: payload };
};
