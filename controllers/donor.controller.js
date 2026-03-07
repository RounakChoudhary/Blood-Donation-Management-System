const donorService = require("../services/donor.service");

async function becomeVolunteer(req, res) {
  try {
    const { blood_group, age, bmi, last_donated_date } = req.body;

    const result = await donorService.becomeVolunteer({
      user_id: req.user.id,
      blood_group,
      age,
      bmi,
      last_donated_date,
    });

    if (!result.ok) {
      return res.status(result.status).json({ error: result.error });
    }

    return res.status(result.status).json({
      message: "Donor profile created successfully",
      donor: result.donor,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
}

async function getMyDonorProfile(req, res) {
  try {
    const result = await donorService.getMyDonorProfile(req.user.id);

    if (!result.ok) {
      return res.status(result.status).json({ error: result.error });
    }

    return res.status(result.status).json({ donor: result.donor });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
}

async function updateAvailability(req, res) {
  try {
    const { availability_status } = req.body;

    const result = await donorService.setAvailability(
      req.user.id,
      availability_status
    );

    if (!result.ok) {
      return res.status(result.status).json({ error: result.error });
    }

    return res.status(result.status).json({
      message: "Availability updated successfully",
      donor: result.donor,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
}

module.exports = {
  becomeVolunteer,
  getMyDonorProfile,
  updateAvailability,
};