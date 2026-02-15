# Appointment System Expansion & Navigation Fix

Implement district selection, patient forms, PDF downloads, and fix global navigation.

- [x] **Navigation Fix**
    - [x] Add "Close" button in `Chatbot.tsx` header for easy exit
- [x] **Data Model Expansion**
    - [x] Update `Hospital` model with `district` field
    - [x] Update `Appointment` model with `patientAge, patientGender, patientAddress, problem`
    - [x] Create massive seed data (7 districts x 5 hospitals x 5 doctors)
- [x] **Feature Implementation**
    - [x] Add District selection screen (Step 0) in `Appointments.tsx`
    - [x] Add "Patient Details Form" step (Step 3.5) in booking flow
    - [x] Implement PDF generation and download for booking confirmation
- [x] **Verification & Deployment**
    - [x] Test backend routes with new fields
    - [x] Local verification successful
- [ ] **Deployment**
    - [ ] Deploy to AWS (User requested to double check first)
