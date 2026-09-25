import Meeting from './meeting.repository.js';
import { ApiError } from '../../utils/ApiError.js';

const toRepositoryPayload = (body) => ({
  title: body.title?.trim() || 'Meeting',
  description: body.notes ?? body.description ?? null,
  date: body.date,
  time: body.time,
  location: body.location ?? null,
  organizerId: body.organizer,
  attendeeId: body.employee,
  status: body.status || 'Scheduled',
});

export const getMeetingsService = () => Meeting.findAll();

export const createMeetingService = (body) => Meeting.create(toRepositoryPayload(body));

export const updateMeetingService = async (id, body) => {
  const existing = await Meeting.findById(id);
  if (!existing) throw new ApiError(404, 'Meeting not found');
  return Meeting.update(id, toRepositoryPayload(body));
};

export const deleteMeetingService = async (id) => {
  const existing = await Meeting.findById(id);
  if (!existing) throw new ApiError(404, 'Meeting not found');
  await Meeting.delete(id);
  return { message: 'Meeting deleted' };
};
