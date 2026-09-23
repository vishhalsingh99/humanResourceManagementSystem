import Location from '../../repositories/location.repository.js';

export const getStatesService = () => Location.getStates();

export const getDistrictsService = (stateId) => Location.getDistrictsByStateId(stateId);
