import axios from 'axios';

export const getStates = () => axios.get('/api/states');

export const getDistricts = (stateId) =>
  axios.get('/api/districts/', { params: { state_id: stateId } });
