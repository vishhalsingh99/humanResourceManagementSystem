import { Router } from 'express';
import { getMeetings, createMeeting, updateMeeting, deleteMeeting } from './meeting.controller.js';
import { requirePermission } from '../../middlewares/requirePermission.js';

const router = Router();

router.get('/', requirePermission('meeting.view'), getMeetings);
router.post('/', requirePermission('meeting.create'), createMeeting);
router.put('/:id', requirePermission('meeting.edit'), updateMeeting);
router.delete('/:id', requirePermission('meeting.delete'), deleteMeeting);

export default router;
