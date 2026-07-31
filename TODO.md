# TODO: Add All Patients with All Records (Encrypted, apart Patient ID)

## Backend
- [x] Add `getAllRecords` controller method in `reportsController.js`
- [x] Add route `GET /api/reports/all-records` in `reports.js`

## Frontend
- [x] Add tab toggle between "Patients View" and "Records View" in `ReportsPage.js`
- [x] Fetch and render flat records table (record_id, patient_id, record_type, ciphertext, algorithm, created_at)
- [x] Add CSV/JSON download for records view
