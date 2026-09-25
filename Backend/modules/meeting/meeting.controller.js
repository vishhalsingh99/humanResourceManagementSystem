import { asyncHandler } from '../../utils/asyncHandler.js';
import {
  getMeetingsService,
  createMeetingService,
  updateMeetingService,
  deleteMeetingService,
} from './meeting.service.js';

export const getMeetings = asyncHandler(async (req, res) => {
  res.json(await getMeetingsService());
});

export const createMeeting = asyncHandler(async (req, res) => {
  res.status(201).json(await createMeetingService(req.body));
});

export const updateMeeting = asyncHandler(async (req, res) => {
  res.json(await updateMeetingService(req.params.id, req.body));
});

export const deleteMeeting = asyncHandler(async (req, res) => {
  res.json(await deleteMeetingService(req.params.id));
});
