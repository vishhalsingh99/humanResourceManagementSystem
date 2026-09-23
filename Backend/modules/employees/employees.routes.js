import { Router } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import multer from 'multer';
import {
  uploadResume,
  getEmployees,
  getMyProfile,
  changePassword,
  createEmployee,
  updateEmployee,
  updateEmployeeStatus,
  deleteEmployee,
} from './employees.controller.js';
import { authMiddleware, authorizeRoles } from '../../middlewares/authe.js';
import { requirePermission } from '../../middlewares/requirePermission.js';
import { validate } from '../../middlewares/validate.js';
import { assignEmployeeRole } from '../roles/roles.controller.js';
import {
  createEmployeeSchema,
  updateEmployeeSchema,
  updateEmployeeStatusSchema,
  changePasswordSchema,
} from './employees.schema.js';

const router = Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const resumeDirectory = path.join(__dirname, '..', '..', 'uploads', 'resumes');
fs.mkdirSync(resumeDirectory, { recursive: true });

const resumeUpload = multer({
  storage: multer.diskStorage({
    destination: resumeDirectory,
    filename: (req, file, callback) => {
      const extension = path.extname(file.originalname).toLowerCase();
      callback(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`);
    },
  }),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, callback) => {
    callback(null, /\.(pdf|doc|docx)$/i.test(file.originalname));
  },
});

// Employee routes
router.use(authMiddleware);
router.get('/me', authorizeRoles('employee'), getMyProfile);
router.put('/change-password', authorizeRoles('employee'), validate(changePasswordSchema), changePassword);

router.get('/', requirePermission('employee.view'), getEmployees);
router.put('/:id/role', requirePermission('settings.edit'), assignEmployeeRole);
router.post('/resume-upload', requirePermission('documents.upload'), (req, res, next) => {
  resumeUpload.single('resume')(req, res, (error) => {
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    next();
  });
}, uploadResume);
router.post('/', requirePermission('employee.create'), validate(createEmployeeSchema), createEmployee);
router.put('/:id', requirePermission('employee.edit'), validate(updateEmployeeSchema), updateEmployee);
router.patch('/:id/status', requirePermission('employee.edit'), validate(updateEmployeeStatusSchema), updateEmployeeStatus);
router.delete('/:id', requirePermission('employee.delete'), deleteEmployee);

export default router;
