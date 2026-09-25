import { Router } from 'express';
import { getMeetings, createMeeting, updateMeeting, deleteMeeting } from './meeting.controller.js';
import { requirePermission } from '../../middlewares/requirePermission.js';
import { validate } from '../../middlewares/validate.js';
import { meetingSchema } from './meeting.schema.js';

const router = Router();

router.get('/', requirePermission('meeting.view'), getMeetings);
router.post('/', requirePermission('meeting.create'), validate(meetingSchema), createMeeting);
router.put('/:id', requirePermission('meeting.edit'), validate(meetingSchema), updateMeeting);
router.delete('/:id', requirePermission('meeting.delete'), deleteMeeting);

export default router;
