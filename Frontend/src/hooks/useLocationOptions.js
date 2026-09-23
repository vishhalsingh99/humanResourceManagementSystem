import { useEffect, useState } from 'react';
import { getDistricts, getStates } from '../api/locationApi';

export function useLocationOptions(stateId) {
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);

  useEffect(() => {
    let active = true;

    getStates()
      .then((response) => {
        if (active) setStates(response.data);
      })
      .catch(() => {
        if (active) setStates([]);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    if (!stateId) {
      setDistricts([]);
      return () => {
        active = false;
      };
    }

    getDistricts(stateId)
      .then((response) => {
        if (active) setDistricts(response.data);
      })
      .catch(() => {
        if (active) setDistricts([]);
      });

    return () => {
      active = false;
    };
  }, [stateId]);

  return { states, districts };
}
