import { masterPool } from '../config/databases.js';

class Location {
  static async getStates() {
    const [rows] = await masterPool.execute(
      'SELECT id, name FROM states ORDER BY name ASC'
    );
    return rows;
  }

  static async getDistrictsByStateId(stateId) {
    const [rows] = await masterPool.execute(
      'SELECT id, state_id, name FROM districts WHERE state_id = ? ORDER BY name ASC',
      [stateId]
    );
    return rows;
  }

  static async isValidDistrictForState(stateId, districtId) {
    const [rows] = await masterPool.execute(
      'SELECT id FROM districts WHERE id = ? AND state_id = ? LIMIT 1',
      [districtId, stateId]
    );
    return Boolean(rows[0]);
  }

  static async getStateDistrictNames(stateId, districtId) {
    if (!stateId || !districtId) {
      return { state: null, district: null };
    }

    const [rows] = await masterPool.execute(
      `SELECT states.name AS state, districts.name AS district
       FROM districts
       INNER JOIN states ON states.id = districts.state_id
       WHERE districts.id = ? AND districts.state_id = ?
       LIMIT 1`,
      [districtId, stateId]
    );

    return rows[0] || { state: null, district: null };
  }
}

export default Location;