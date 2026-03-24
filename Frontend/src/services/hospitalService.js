export const getHospitalDashboard = async () => {
  await new Promise(resolve => setTimeout(resolve, 600));

  // In the future this will be: return fetch('/api/hospitals/dashboard').then(res => res.json())
  return {
    activeRequests: [
      { id: 1, group: 'O-', hosp: 'City General Hospital', info: '4 Units • Required ASAP', status: 'critical' },
      { id: 2, group: 'A+', hosp: 'St. Mary Medical', info: '2 Units • Within 24hrs', status: 'pending' },
      { id: 3, group: 'B-', hosp: 'Mercy Clinic', info: '1 Unit • Routine', status: 'matched' }
    ],
    matchedDonors: [
      { id: 1, name: 'John Doe', initials: 'JD', distance: '2.3', group: 'O-' },
      { id: 2, name: 'Anna Smith', initials: 'AS', distance: '0.8', group: 'A+' },
      { id: 3, name: 'Robert C.', initials: 'RC', distance: '4.1', group: 'O-' },
      { id: 4, name: 'Elena V.', initials: 'EV', distance: '5.5', group: 'B-' }
    ]
  };
};

export const createEmergencyRequest = async (payload) => {
  await new Promise(resolve => setTimeout(resolve, 600));
  return { success: true, message: "Request broadcasted successfully", data: payload };
};
