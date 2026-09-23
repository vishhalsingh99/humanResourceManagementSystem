// Placeholder handlers -- no meeting service/repository exists yet.
export const getMeetings = (req, res) => {
  res.json({ message: 'Meetings endpoint' });
};

export const createMeeting = (req, res) => {
  res.json({ message: 'Create meeting' });
};

export const updateMeeting = (req, res) => {
  res.json({ message: 'Update meeting' });
};

export const deleteMeeting = (req, res) => {
  res.json({ message: 'Delete meeting' });
};
