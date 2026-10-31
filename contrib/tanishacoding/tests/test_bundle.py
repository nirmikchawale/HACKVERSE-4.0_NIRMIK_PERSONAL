import json, unittest
from pathlib import Path

DATA=Path(__file__).resolve().parents[1]/'data'
def load(name):return json.loads((DATA/name).read_text(encoding='utf-8'))
class BundleTests(unittest.TestCase):
 def test_states(self):
  d=load('india_states_uts.json')
  self.assertEqual(len(d['states']),28);self.assertEqual(len(d['union_territories']),8)
  self.assertEqual(len(set(d['states']+d['union_territories'])),36)
 def test_soil_quality_guard(self):
  d=load('jalna_historical_agronomy.json')
  self.assertFalse(d['quality_audit']['verified_current_farm_soil'])
  a=d['district_soil_categories_historical']
  self.assertAlmostEqual(sum(x['area_1000_ha'] for x in a),636.77,places=2)
  self.assertAlmostEqual(sum(x['table_percent'] for x in a),100.0,places=2)
  self.assertNotEqual(d['quality_audit']['sum_of_listed_soil_areas_1000_ha'],d['quality_audit']['district_geographical_area_1000_ha_as_reported_in_document'])
 def test_contract(self):
  d=load('p0_data_contract.json')
  self.assertEqual(len(d['routes']),6)
  self.assertFalse(d['location']['other_indian_locations_supported_by_engine'])
  self.assertEqual(next(x for x in d['routes'] if x['path']=='/api/forecast')['states'],['retrieved_live','cached_recent','stale_cache','unavailable'])
 def test_catalog(self):
  d=load('source_catalog.json')
  ids=[x['id'] for x in d['sources']]
  self.assertEqual(len(set(ids)),len(ids))
  self.assertIn('isric_soilgrids',ids)
  self.assertIn('NOT_IMPORTED',next(x['status'] for x in d['sources'] if x['id']=='isric_soilgrids'))
if __name__=='__main__':unittest.main()
