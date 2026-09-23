import { asyncHandler } from '../../utils/asyncHandler.js';
import {
  getDesignationsService,
  createDesignationService,
  updateDesignationService,
  deleteDesignationService,
} from './designations.service.js';

export const getDesignations = asyncHandler(async (req, res) => {
  res.json(await getDesignationsService());
});

export const createDesignation = asyncHandler(async (req, res) => {
  res.status(201).json(await createDesignationService(req.body));
});

export const updateDesignation = asyncHandler(async (req, res) => {
  res.json(await updateDesignationService(req.params.id, req.body));
});

export const deleteDesignation = asyncHandler(async (req, res) => {
  res.json(await deleteDesignationService(req.params.id));
});
