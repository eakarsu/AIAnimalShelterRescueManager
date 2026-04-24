const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const pool = require('./db');
const { createTables } = require('./schema');
const bcrypt = require('bcryptjs');

const seed = async () => {
  try {
    console.log('Starting seed process...');

    // Truncate all tables
    await pool.query(`
      TRUNCATE TABLE quarantine, medication_log, events, stray_holds, lost_found,
        supply_inventory, donations, volunteer_schedules, volunteers,
        foster_placements, foster_homes, adoption_contracts, adoption_applications,
        behavioral_assessments, medical_records, kennel_assignments, kennels,
        animals, users
      CASCADE;
    `);
    console.log('All tables truncated.');

    // Create tables
    await createTables();

    // Seed Users
    const adminHash = await bcrypt.hash('admin123', 10);
    const staffHash = await bcrypt.hash('staff123', 10);
    await pool.query(`
      INSERT INTO users (email, password, name, role) VALUES
      ($1, $2, 'Admin User', 'admin'),
      ($3, $4, 'Staff Member', 'staff')
    `, [' admin@shelter.com'.trim(), adminHash, 'staff@shelter.com', staffHash]);
    console.log('Users seeded.');

    // Seed Animals (15+)
    await pool.query(`
      INSERT INTO animals (name, species, breed, age_years, age_months, weight, color, sex, microchip_number, intake_date, intake_type, status, description) VALUES
      ('Buddy', 'dog', 'Golden Retriever', 3, 6, 68.5, 'Golden', 'male', 'MC-2024-001', '2024-01-15', 'surrender', 'available', 'Friendly and energetic golden retriever who loves fetch and swimming.'),
      ('Luna', 'cat', 'Domestic Shorthair', 2, 0, 9.2, 'Black', 'female', 'MC-2024-002', '2024-01-20', 'stray', 'available', 'Sweet and playful black cat with bright green eyes.'),
      ('Max', 'dog', 'German Shepherd', 4, 3, 82.0, 'Black and Tan', 'male', 'MC-2024-003', '2024-02-01', 'surrender', 'available', 'Well-trained shepherd, good with older children.'),
      ('Whiskers', 'cat', 'Siamese', 1, 8, 7.5, 'Cream and Brown', 'male', 'MC-2024-004', '2024-02-10', 'stray', 'available', 'Vocal and affectionate Siamese mix.'),
      ('Bella', 'dog', 'Labrador Mix', 2, 0, 55.0, 'Chocolate', 'female', 'MC-2024-005', '2024-02-15', 'transfer', 'adopted', 'Gentle lab mix who loves belly rubs.'),
      ('Oliver', 'cat', 'Maine Coon', 3, 0, 14.0, 'Orange Tabby', 'male', 'MC-2024-006', '2024-02-20', 'surrender', 'available', 'Large fluffy cat, very social and gentle.'),
      ('Daisy', 'dog', 'Beagle', 5, 0, 28.0, 'Tricolor', 'female', 'MC-2024-007', '2024-03-01', 'stray', 'foster', 'Sweet beagle with a great nose, currently in foster care.'),
      ('Mittens', 'cat', 'Persian', 6, 0, 10.5, 'White', 'female', 'MC-2024-008', '2024-03-05', 'surrender', 'available', 'Calm and regal Persian who loves being brushed.'),
      ('Rocky', 'dog', 'Pit Bull Mix', 3, 0, 62.0, 'Brindle', 'male', 'MC-2024-009', '2024-03-10', 'stray', 'quarantine', 'Strong but gentle pit bull mix, great with people.'),
      ('Cleo', 'cat', 'Abyssinian', 1, 6, 8.0, 'Ruddy', 'female', 'MC-2024-010', '2024-03-15', 'transfer', 'available', 'Active and curious Abyssinian who loves climbing.'),
      ('Thumper', 'rabbit', 'Holland Lop', 1, 0, 4.0, 'Brown and White', 'male', 'MC-2024-011', '2024-03-20', 'surrender', 'available', 'Friendly lop-eared rabbit who enjoys being held.'),
      ('Tweety', 'bird', 'Cockatiel', 2, 0, 0.2, 'Gray and Yellow', 'male', 'MC-2024-012', '2024-03-25', 'surrender', 'available', 'Whistles tunes and loves head scratches.'),
      ('Shadow', 'dog', 'Border Collie', 1, 6, 42.0, 'Black and White', 'male', 'MC-2024-013', '2024-04-01', 'transfer', 'available', 'High-energy collie who needs an active family.'),
      ('Ginger', 'cat', 'Tabby', 4, 0, 11.0, 'Orange', 'female', 'MC-2024-014', '2024-04-05', 'stray', 'available', 'Laid-back tabby who gets along with everyone.'),
      ('Duke', 'dog', 'Rottweiler', 5, 6, 95.0, 'Black and Mahogany', 'male', 'MC-2024-015', '2024-04-10', 'surrender', 'available', 'Loyal and protective, well-socialized Rottweiler.'),
      ('Snowball', 'rabbit', 'Lionhead', 0, 8, 3.2, 'White', 'female', 'MC-2024-016', '2024-04-15', 'surrender', 'available', 'Adorable lionhead rabbit with a fluffy mane.'),
      ('Kiwi', 'bird', 'Budgerigar', 1, 0, 0.1, 'Green and Yellow', 'female', 'MC-2024-017', '2024-04-20', 'surrender', 'available', 'Chatty budgie who loves mirrors and bells.')
    `);
    console.log('Animals seeded.');

    // Seed Kennels (15+)
    await pool.query(`
      INSERT INTO kennels (kennel_number, building, kennel_type, capacity, current_occupancy, status, notes) VALUES
      ('A-101', 'Building A', 'indoor', 1, 1, 'occupied', 'Standard dog kennel'),
      ('A-102', 'Building A', 'indoor', 1, 1, 'occupied', 'Standard dog kennel'),
      ('A-103', 'Building A', 'indoor', 1, 0, 'available', 'Standard dog kennel'),
      ('A-104', 'Building A', 'indoor', 2, 0, 'available', 'Double dog kennel'),
      ('A-105', 'Building A', 'indoor', 1, 0, 'maintenance', 'Under repair'),
      ('B-201', 'Building B', 'indoor', 1, 1, 'occupied', 'Cat suite'),
      ('B-202', 'Building B', 'indoor', 1, 1, 'occupied', 'Cat suite'),
      ('B-203', 'Building B', 'indoor', 2, 1, 'occupied', 'Cat community room'),
      ('B-204', 'Building B', 'indoor', 1, 0, 'available', 'Cat suite'),
      ('B-205', 'Building B', 'indoor', 1, 1, 'occupied', 'Cat isolation room'),
      ('C-301', 'Building C', 'outdoor', 1, 1, 'occupied', 'Outdoor run with shelter'),
      ('C-302', 'Building C', 'outdoor', 1, 0, 'available', 'Outdoor run with shelter'),
      ('C-303', 'Building C', 'outdoor', 2, 0, 'available', 'Large outdoor pen'),
      ('D-401', 'Building D', 'indoor', 1, 1, 'occupied', 'Small animal enclosure'),
      ('D-402', 'Building D', 'indoor', 1, 1, 'occupied', 'Bird aviary'),
      ('D-403', 'Building D', 'indoor', 2, 0, 'available', 'Multi-species room'),
      ('Q-501', 'Quarantine', 'indoor', 1, 1, 'occupied', 'Quarantine kennel')
    `);
    console.log('Kennels seeded.');

    // Seed Kennel Assignments (15+)
    await pool.query(`
      INSERT INTO kennel_assignments (animal_id, kennel_id, assigned_date, released_date, notes) VALUES
      (1, 1, '2024-01-15', NULL, 'Buddy assigned to A-101'),
      (3, 2, '2024-02-01', NULL, 'Max assigned to A-102'),
      (2, 6, '2024-01-20', NULL, 'Luna assigned to B-201'),
      (4, 7, '2024-02-10', NULL, 'Whiskers assigned to B-202'),
      (6, 8, '2024-02-20', NULL, 'Oliver assigned to B-203'),
      (8, 10, '2024-03-05', NULL, 'Mittens in isolation for observation'),
      (13, 11, '2024-04-01', NULL, 'Shadow in outdoor run'),
      (11, 14, '2024-03-20', NULL, 'Thumper in small animal area'),
      (12, 15, '2024-03-25', NULL, 'Tweety in aviary'),
      (9, 17, '2024-03-10', NULL, 'Rocky in quarantine'),
      (5, 1, '2024-02-15', '2024-03-01', 'Bella was in A-101 before adoption'),
      (10, 6, '2024-03-15', '2024-03-20', 'Cleo temporarily in B-201'),
      (10, 8, '2024-03-20', NULL, 'Cleo moved to community room'),
      (14, 7, '2024-04-05', '2024-04-10', 'Ginger temp placement'),
      (14, 9, '2024-04-10', NULL, 'Ginger moved to B-204 area'),
      (15, 11, '2024-04-10', '2024-04-12', 'Duke briefly in outdoor run'),
      (15, 3, '2024-04-12', NULL, 'Duke moved to A-103')
    `);
    console.log('Kennel assignments seeded.');

    // Seed Medical Records (15+)
    await pool.query(`
      INSERT INTO medical_records (animal_id, record_type, description, veterinarian, record_date, next_due_date, notes) VALUES
      (1, 'vaccination', 'Rabies vaccination administered', 'Dr. Sarah Mitchell', '2024-01-16', '2025-01-16', 'Annual vaccine'),
      (1, 'vaccination', 'DHPP booster', 'Dr. Sarah Mitchell', '2024-01-16', '2025-01-16', 'Core vaccine'),
      (2, 'vaccination', 'FVRCP vaccination', 'Dr. James Chen', '2024-01-21', '2025-01-21', 'Core feline vaccine'),
      (2, 'spay_neuter', 'Spay surgery completed', 'Dr. James Chen', '2024-02-01', NULL, 'Uneventful surgery'),
      (3, 'examination', 'Annual wellness exam', 'Dr. Sarah Mitchell', '2024-02-02', '2025-02-02', 'Healthy, slight tartar buildup'),
      (4, 'vaccination', 'Rabies and FVRCP', 'Dr. James Chen', '2024-02-11', '2025-02-11', 'Both vaccines given'),
      (5, 'spay_neuter', 'Spay completed pre-adoption', 'Dr. Sarah Mitchell', '2024-02-20', NULL, 'Healed well'),
      (6, 'dental', 'Dental cleaning performed', 'Dr. James Chen', '2024-03-01', '2025-03-01', 'Minor plaque removed'),
      (7, 'examination', 'Health check, heartworm test', 'Dr. Sarah Mitchell', '2024-03-02', '2024-09-02', 'Heartworm negative'),
      (8, 'dermatology', 'Skin irritation treatment', 'Dr. Lisa Park', '2024-03-06', '2024-03-20', 'Prescribed medicated shampoo'),
      (9, 'injury', 'Minor laceration on left front paw', 'Dr. Sarah Mitchell', '2024-03-11', '2024-03-18', 'Cleaned and bandaged, antibiotics prescribed'),
      (10, 'vaccination', 'FVRCP and rabies', 'Dr. James Chen', '2024-03-16', '2025-03-16', 'All core vaccines'),
      (11, 'examination', 'General health exam for rabbit', 'Dr. Lisa Park', '2024-03-21', '2024-09-21', 'Teeth and nails trimmed'),
      (12, 'examination', 'Avian wellness check', 'Dr. Lisa Park', '2024-03-26', '2024-09-26', 'Feathers and weight healthy'),
      (13, 'vaccination', 'Full vaccine series started', 'Dr. Sarah Mitchell', '2024-04-02', '2024-05-02', 'DHPP first dose'),
      (15, 'vaccination', 'Rabies and DHPP', 'Dr. Sarah Mitchell', '2024-04-11', '2025-04-11', 'Up to date on vaccines')
    `);
    console.log('Medical records seeded.');

    // Seed Behavioral Assessments (15+)
    await pool.query(`
      INSERT INTO behavioral_assessments (animal_id, assessor, assessment_date, aggression_level, fear_level, sociability_level, energy_level, trainability_level, good_with_kids, good_with_dogs, good_with_cats, bite_history, bite_details, notes, overall_rating) VALUES
      (1, 'Karen Thompson', '2024-01-17', 1, 1, 5, 4, 5, true, true, true, false, NULL, 'Excellent temperament, very friendly', 'excellent'),
      (2, 'Karen Thompson', '2024-01-22', 1, 2, 4, 3, 3, true, false, true, false, NULL, 'Shy at first but warms up quickly', 'good'),
      (3, 'Mark Davis', '2024-02-03', 2, 1, 4, 4, 5, true, true, false, false, NULL, 'Well-trained, may chase cats', 'good'),
      (4, 'Karen Thompson', '2024-02-12', 1, 3, 3, 3, 3, true, false, true, false, NULL, 'Timid with new people, loves other cats', 'good'),
      (5, 'Mark Davis', '2024-02-16', 1, 1, 5, 3, 4, true, true, true, false, NULL, 'Perfect family dog', 'excellent'),
      (6, 'Karen Thompson', '2024-02-21', 1, 1, 5, 2, 3, true, false, true, false, NULL, 'Gentle giant, loves laps', 'excellent'),
      (7, 'Mark Davis', '2024-03-02', 1, 2, 4, 3, 3, true, true, false, false, NULL, 'Typical beagle, nose-driven', 'good'),
      (8, 'Karen Thompson', '2024-03-06', 1, 2, 3, 1, 2, true, false, false, false, NULL, 'Prefers quiet homes', 'fair'),
      (9, 'Mark Davis', '2024-03-12', 2, 2, 4, 4, 4, false, true, false, true, 'Nipped previous owner when startled, no skin break', 'Needs experienced handler, very food motivated', 'fair'),
      (10, 'Karen Thompson', '2024-03-17', 1, 1, 5, 5, 4, true, false, true, false, NULL, 'Very active and playful', 'excellent'),
      (11, 'Mark Davis', '2024-03-22', 1, 2, 3, 2, 2, true, false, false, false, NULL, 'Gentle rabbit, good for handling', 'good'),
      (12, 'Karen Thompson', '2024-03-27', 1, 3, 3, 3, 3, true, false, false, false, NULL, 'Nervous around loud noises', 'fair'),
      (13, 'Mark Davis', '2024-04-03', 1, 1, 5, 5, 5, true, true, true, false, NULL, 'Incredibly smart and eager to please', 'excellent'),
      (14, 'Karen Thompson', '2024-04-06', 1, 1, 4, 2, 3, true, true, true, false, NULL, 'Easy-going, great apartment cat', 'excellent'),
      (15, 'Mark Davis', '2024-04-12', 2, 1, 3, 3, 4, false, true, false, false, NULL, 'Needs experienced owner, loyal once bonded', 'good'),
      (16, 'Karen Thompson', '2024-04-16', 1, 2, 3, 2, 2, true, false, false, false, NULL, 'Shy rabbit, needs gentle handling', 'good')
    `);
    console.log('Behavioral assessments seeded.');

    // Seed Adoption Applications (15+)
    await pool.query(`
      INSERT INTO adoption_applications (applicant_name, email, phone, address, housing_type, has_yard, has_other_pets, other_pets_details, has_children, children_ages, experience, preferred_species, preferred_breed, preferred_age, preferred_size, reason, veterinarian_reference, status, animal_id, application_date, notes) VALUES
      ('Jennifer Adams', 'jadams@email.com', '555-0101', '123 Oak St, Springfield, IL', 'house', true, false, NULL, true, '8, 12', 'Had dogs growing up', 'dog', 'Golden Retriever', 'adult', 'large', 'Looking for a family companion', 'Dr. Patel, Springfield Vet', 'approved', 1, '2024-02-01', 'Great candidate'),
      ('Michael Torres', 'mtorres@email.com', '555-0102', '456 Elm Ave, Portland, OR', 'apartment', false, true, '1 adult cat', false, NULL, '5 years cat ownership', 'cat', 'Any', 'young', 'medium', 'Want a companion for my cat', 'Riverside Animal Hospital', 'pending', 2, '2024-02-15', NULL),
      ('Sarah Kim', 'skim@email.com', '555-0103', '789 Pine Rd, Austin, TX', 'house', true, false, NULL, false, NULL, 'Dog trainer for 10 years', 'dog', 'German Shepherd', 'adult', 'large', 'Experienced with working breeds', 'Austin Pet Clinic', 'approved', 3, '2024-02-20', 'Professional trainer'),
      ('David Chen', 'dchen@email.com', '555-0104', '321 Maple Dr, Seattle, WA', 'condo', false, false, NULL, false, NULL, 'First time pet owner', 'cat', 'Siamese', 'young', 'small', 'Work from home, want company', NULL, 'pending', 4, '2024-03-01', 'Needs first-time owner guidance'),
      ('Emily Rodriguez', 'erodriguez@email.com', '555-0105', '654 Cedar Ln, Denver, CO', 'house', true, true, '2 dogs, 1 cat', true, '5, 7', 'Lifelong animal lover', 'dog', 'Labrador', 'young', 'large', 'Kids want a puppy', 'Mountain View Vet', 'approved', 5, '2024-02-25', 'Adopted Bella on 3/1'),
      ('Robert Johnson', 'rjohnson@email.com', '555-0106', '987 Birch St, Nashville, TN', 'house', true, false, NULL, false, NULL, '15 years dog experience', 'dog', 'Any', 'adult', 'any', 'Recently lost my dog, ready for another', 'Nashville Animal Care', 'pending', NULL, '2024-03-10', NULL),
      ('Lisa Wang', 'lwang@email.com', '555-0107', '147 Spruce Way, Boston, MA', 'apartment', false, false, NULL, false, NULL, '3 years cat ownership', 'cat', 'Maine Coon', 'adult', 'large', 'Love big fluffy cats', 'Boston Pet Hospital', 'pending', 6, '2024-03-15', NULL),
      ('James Miller', 'jmiller@email.com', '555-0108', '258 Willow Ct, Chicago, IL', 'house', true, true, '1 senior dog', true, '10', 'Multiple pets over 20 years', 'dog', 'Beagle', 'adult', 'medium', 'Want a hiking buddy', 'Windy City Vet', 'approved', 7, '2024-03-20', 'Experienced owner'),
      ('Amanda Foster', 'afoster@email.com', '555-0109', '369 Ash Blvd, Miami, FL', 'condo', false, true, '1 indoor cat', false, NULL, '5 years cat ownership', 'cat', 'Persian', 'any', 'medium', 'Want a quiet lap cat', 'Miami Paws Clinic', 'pending', 8, '2024-03-25', NULL),
      ('Chris Martinez', 'cmartinez@email.com', '555-0110', '741 Redwood Ave, San Diego, CA', 'house', true, false, NULL, true, '3', 'Had rabbits before', 'rabbit', 'Any', 'young', 'small', 'Kids want a pet rabbit', 'SD Animal Hospital', 'approved', 11, '2024-04-01', 'Good rabbit experience'),
      ('Nicole Brown', 'nbrown@email.com', '555-0111', '852 Sequoia Pl, Phoenix, AZ', 'apartment', false, false, NULL, false, NULL, 'Bird owner for 8 years', 'bird', 'Cockatiel', 'young', 'small', 'Experienced with cockatiels', 'Desert Vet Clinic', 'pending', 12, '2024-04-05', NULL),
      ('Tom Wilson', 'twilson@email.com', '555-0112', '963 Magnolia St, Raleigh, NC', 'house', true, true, '1 dog', true, '6, 9', 'Dog owner for 10 years', 'dog', 'Border Collie', 'young', 'medium', 'Active family wants active dog', 'Triangle Vet', 'pending', 13, '2024-04-08', NULL),
      ('Rachel Green', 'rgreen@email.com', '555-0113', '174 Jasmine Dr, San Jose, CA', 'apartment', false, true, '2 cats', false, NULL, 'Cat rescue volunteer', 'cat', 'Tabby', 'adult', 'medium', 'Experienced foster turned adopter', 'Bay Area Pet Care', 'approved', 14, '2024-04-10', 'Volunteer reference checked'),
      ('Kevin Lee', 'klee@email.com', '555-0114', '285 Orchid Way, Portland, OR', 'house', true, false, NULL, false, NULL, '20 years large breed experience', 'dog', 'Rottweiler', 'adult', 'large', 'Experienced with guarding breeds', 'Portland Pet Hospital', 'pending', 15, '2024-04-15', NULL),
      ('Samantha White', 'swhite@email.com', '555-0115', '396 Dahlia Ct, Minneapolis, MN', 'house', true, false, NULL, true, '4, 7', 'Family had dogs and cats', 'dog', 'Any', 'young', 'medium', 'Kids are ready for a dog', 'Twin Cities Vet', 'denied', NULL, '2024-04-20', 'Housing situation unstable'),
      ('Brian Taylor', 'btaylor@email.com', '555-0116', '407 Lily Rd, Tampa, FL', 'condo', false, false, NULL, false, NULL, 'Had rabbits for 5 years', 'rabbit', 'Lionhead', 'young', 'small', 'Want a small fluffy companion', 'Tampa Bay Vet', 'pending', 16, '2024-04-22', NULL)
    `);
    console.log('Adoption applications seeded.');

    // Seed Adoption Contracts (15+)
    await pool.query(`
      INSERT INTO adoption_contracts (application_id, animal_id, adopter_name, adoption_date, adoption_fee, spay_neuter_required, return_policy, special_conditions, status) VALUES
      (5, 5, 'Emily Rodriguez', '2024-03-01', 250.00, true, '30-day return policy with full refund', 'Must complete follow-up visit within 2 weeks', 'active'),
      (1, 1, 'Jennifer Adams', '2024-03-15', 300.00, false, '30-day return policy with full refund', 'Already neutered. Needs continued heartworm prevention', 'active'),
      (3, 3, 'Sarah Kim', '2024-03-20', 275.00, false, '30-day return policy with full refund', 'Already neutered. Professional trainer adopter', 'active'),
      (8, 7, 'James Miller', '2024-04-01', 200.00, true, '30-day return policy with full refund', 'Must complete spay within 30 days', 'active'),
      (10, 11, 'Chris Martinez', '2024-04-10', 75.00, true, '30-day return policy with full refund', 'Rabbit must be kept indoors', 'active'),
      (13, 14, 'Rachel Green', '2024-04-15', 150.00, false, '30-day return policy with full refund', 'Already spayed. Indoor only cat', 'active'),
      (1, 1, 'Jennifer Adams', '2023-06-15', 275.00, false, '30-day return policy', 'Previous adoption - returned due to moving', 'returned'),
      (3, 3, 'Sarah Kim', '2023-09-01', 250.00, true, '30-day return policy', 'Trial adoption period', 'active'),
      (5, 5, 'Emily Rodriguez', '2023-12-01', 200.00, true, '30-day return policy', 'Holiday adoption special rate', 'active'),
      (8, 7, 'James Miller', '2024-01-15', 225.00, true, '14-day return policy', 'Senior animal discount applied', 'active'),
      (10, 11, 'Chris Martinez', '2024-02-14', 50.00, false, '30-day return policy', 'Valentines adoption event', 'active'),
      (13, 14, 'Rachel Green', '2024-03-01', 175.00, false, '30-day return policy', 'Volunteer discount applied', 'active'),
      (1, 2, 'Jennifer Adams', '2024-03-10', 150.00, true, '30-day return policy', 'Second adoption for this household', 'active'),
      (3, 4, 'Sarah Kim', '2024-03-25', 125.00, true, '30-day return policy', 'Cat adoption fee', 'active'),
      (5, 6, 'Emily Rodriguez', '2024-04-01', 175.00, false, '30-day return policy', 'Already neutered male', 'active'),
      (8, 8, 'James Miller', '2024-04-15', 150.00, false, '30-day return policy', 'Already spayed female', 'active')
    `);
    console.log('Adoption contracts seeded.');

    // Seed Foster Homes (15+)
    await pool.query(`
      INSERT INTO foster_homes (foster_name, email, phone, address, housing_type, has_yard, max_animals, current_animals, can_foster_dogs, can_foster_cats, can_foster_medical, can_foster_behavioral, experience, status, notes) VALUES
      ('Maria Garcia', 'mgarcia@email.com', '555-0201', '100 Foster Ln, Springfield, IL', 'house', true, 3, 1, true, true, false, false, 'Fostered 20+ animals over 5 years', 'active', 'Excellent foster parent'),
      ('Daniel Park', 'dpark@email.com', '555-0202', '200 Haven St, Portland, OR', 'house', true, 2, 0, true, false, true, false, 'Vet tech by profession', 'active', 'Can handle medical fosters'),
      ('Susan Taylor', 'staylor@email.com', '555-0203', '300 Care Ave, Austin, TX', 'apartment', false, 2, 1, false, true, false, false, '10 years cat fostering', 'active', 'Cat specialist'),
      ('Mike Johnson', 'mjohnson@email.com', '555-0204', '400 Kind Blvd, Seattle, WA', 'house', true, 4, 2, true, true, false, true, 'Former animal behaviorist', 'active', 'Can handle behavioral cases'),
      ('Patricia Lee', 'plee@email.com', '555-0205', '500 Gentle Rd, Denver, CO', 'house', true, 2, 0, true, true, true, false, 'Nurse, good with medical cases', 'active', NULL),
      ('Carlos Ruiz', 'cruiz@email.com', '555-0206', '600 Hope Dr, Nashville, TN', 'house', true, 3, 1, true, false, false, false, 'Dog foster specialist', 'active', 'Prefers large breeds'),
      ('Amy Chen', 'achen@email.com', '555-0207', '700 Rescue Way, Boston, MA', 'condo', false, 1, 0, false, true, false, false, 'New foster parent', 'active', 'Completed orientation'),
      ('John Smith', 'jsmith@email.com', '555-0208', '800 Shelter Ct, Chicago, IL', 'house', true, 5, 3, true, true, true, true, 'Runs small rescue operation', 'active', 'Very experienced'),
      ('Linda Brown', 'lbrown@email.com', '555-0209', '900 Paw Pl, Miami, FL', 'house', true, 2, 1, true, true, false, false, '3 years fostering', 'active', NULL),
      ('Steve Wilson', 'swilson@email.com', '555-0210', '1000 Tail Ln, San Diego, CA', 'house', true, 3, 0, true, false, false, true, 'Dog trainer', 'inactive', 'On temporary break'),
      ('Nancy White', 'nwhite@email.com', '555-0211', '1100 Whisker Ave, Phoenix, AZ', 'apartment', false, 2, 1, false, true, true, false, 'Vet assistant', 'active', 'Good with sick kittens'),
      ('Greg Martinez', 'gmartinez@email.com', '555-0212', '1200 Bark Blvd, Raleigh, NC', 'house', true, 2, 0, true, true, false, false, '5 years experience', 'active', NULL),
      ('Helen Kim', 'hkim@email.com', '555-0213', '1300 Meow St, San Jose, CA', 'house', true, 4, 2, true, true, false, false, 'Family fosters together', 'active', 'Great with socializing'),
      ('Paul Anderson', 'panderson@email.com', '555-0214', '1400 Fur Rd, Portland, OR', 'house', true, 3, 1, true, false, true, false, 'Experienced with senior dogs', 'active', 'Specializes in senior fosters'),
      ('Diane Thomas', 'dthomas@email.com', '555-0215', '1500 Feather Ct, Minneapolis, MN', 'house', true, 2, 0, false, false, false, false, 'Small animal specialist', 'active', 'Rabbits and birds'),
      ('Roger Clark', 'rclark@email.com', '555-0216', '1600 Hoof Way, Tampa, FL', 'house', true, 4, 1, true, true, true, true, 'Retired vet', 'active', 'Can handle any case')
    `);
    console.log('Foster homes seeded.');

    // Seed Foster Placements (15+)
    await pool.query(`
      INSERT INTO foster_placements (animal_id, foster_home_id, start_date, end_date, status, notes) VALUES
      (7, 1, '2024-03-05', NULL, 'active', 'Daisy fostered while recovering from kennel cough'),
      (2, 3, '2024-02-01', '2024-02-15', 'completed', 'Luna socialization foster'),
      (9, 4, '2024-03-15', NULL, 'active', 'Rocky behavioral assessment foster'),
      (5, 1, '2024-02-16', '2024-03-01', 'completed', 'Bella pre-adoption foster'),
      (4, 3, '2024-03-01', '2024-03-10', 'completed', 'Whiskers medical recovery'),
      (8, 11, '2024-03-10', NULL, 'active', 'Mittens needs quiet environment'),
      (6, 8, '2024-03-01', '2024-03-15', 'completed', 'Oliver socialization period'),
      (10, 13, '2024-03-20', NULL, 'active', 'Cleo energy management'),
      (11, 15, '2024-04-01', '2024-04-10', 'completed', 'Thumper pre-adoption foster'),
      (12, 15, '2024-04-05', '2024-04-15', 'completed', 'Kiwi adjustment period'),
      (13, 4, '2024-04-05', NULL, 'active', 'Shadow needs experienced handler'),
      (15, 6, '2024-04-12', NULL, 'active', 'Duke needs yard and exercise'),
      (16, 15, '2024-04-20', NULL, 'active', 'Snowball foster care'),
      (17, 15, '2024-04-22', NULL, 'active', 'Kiwi bird foster'),
      (14, 9, '2024-04-08', NULL, 'active', 'Ginger foster for socialization'),
      (3, 2, '2024-02-05', '2024-02-15', 'completed', 'Max medical foster post-surgery')
    `);
    console.log('Foster placements seeded.');

    // Seed Volunteers (15+)
    await pool.query(`
      INSERT INTO volunteers (name, email, phone, address, emergency_contact, emergency_phone, skills, availability, status, start_date, hours_completed, notes) VALUES
      ('Alex Rivera', 'arivera@email.com', '555-0301', '100 Vol St, Springfield, IL', 'Maria Rivera', '555-0350', 'Dog walking, basic training', 'Weekends', 'active', '2023-01-15', 240, 'Reliable weekend volunteer'),
      ('Beth Cooper', 'bcooper@email.com', '555-0302', '200 Help Ave, Portland, OR', 'Tom Cooper', '555-0351', 'Cat socialization, photography', 'Mon/Wed/Fri mornings', 'active', '2023-03-01', 180, 'Great with camera'),
      ('Charlie Dixon', 'cdixon@email.com', '555-0303', '300 Give Rd, Austin, TX', 'Jane Dixon', '555-0352', 'Kennel cleaning, dog walking', 'Tue/Thu evenings', 'active', '2023-06-15', 120, NULL),
      ('Diana Evans', 'devans@email.com', '555-0304', '400 Serve Blvd, Seattle, WA', 'Mark Evans', '555-0353', 'Administrative, data entry', 'Weekday mornings', 'active', '2023-02-01', 300, 'Office volunteer'),
      ('Eric Foster', 'efoster@email.com', '555-0305', '500 Care Ln, Denver, CO', 'Sue Foster', '555-0354', 'Event planning, fundraising', 'Flexible', 'active', '2023-04-01', 150, 'Event coordinator'),
      ('Fiona Grant', 'fgrant@email.com', '555-0306', '600 Aid Way, Nashville, TN', 'Bob Grant', '555-0355', 'Veterinary assistant, medical care', 'Weekends', 'active', '2023-05-15', 200, 'Vet student'),
      ('George Hayes', 'ghayes@email.com', '555-0307', '700 Kind Dr, Boston, MA', 'Lisa Hayes', '555-0356', 'Dog training, behavior assessment', 'Sat mornings', 'active', '2023-07-01', 90, 'Professional trainer'),
      ('Hannah Irwin', 'hirwin@email.com', '555-0308', '800 Warm Ct, Chicago, IL', 'Dan Irwin', '555-0357', 'Social media, marketing', 'Remote/flexible', 'active', '2023-08-01', 160, 'Manages shelter Instagram'),
      ('Ian James', 'ijames@email.com', '555-0309', '900 Heart Pl, Miami, FL', 'Carol James', '555-0358', 'Maintenance, repairs', 'Weekday afternoons', 'active', '2023-09-01', 110, 'Handy with repairs'),
      ('Julia King', 'jking@email.com', '555-0310', '1000 Love Ave, San Diego, CA', 'Rob King', '555-0359', 'Dog walking, cat socialization', 'Weekends', 'active', '2023-10-01', 80, NULL),
      ('Kyle Lewis', 'klewis@email.com', '555-0311', '1100 Hope Blvd, Phoenix, AZ', 'Ann Lewis', '555-0360', 'Transport, supply runs', 'Flexible', 'active', '2023-11-01', 60, 'Has large vehicle'),
      ('Laura Moore', 'lmoore@email.com', '555-0312', '1200 Faith St, Raleigh, NC', 'Tim Moore', '555-0361', 'Adoption counseling', 'Thu/Fri/Sat', 'active', '2023-12-01', 45, 'Former adoption counselor'),
      ('Matt Nelson', 'mnelson@email.com', '555-0313', '1300 Joy Rd, San Jose, CA', 'Pam Nelson', '555-0362', 'Kennel cleaning, laundry', 'Sun mornings', 'inactive', '2024-01-01', 20, 'On school break'),
      ('Nina Ortiz', 'nortiz@email.com', '555-0314', '1400 Peace Way, Portland, OR', 'Carlos Ortiz', '555-0363', 'Community outreach, education', 'Weekday evenings', 'active', '2024-01-15', 35, NULL),
      ('Oscar Perez', 'operez@email.com', '555-0315', '1500 Grace Ln, Minneapolis, MN', 'Rosa Perez', '555-0364', 'Dog walking, yard maintenance', 'Weekends', 'active', '2024-02-01', 25, 'New volunteer'),
      ('Quinn Ross', 'qross@email.com', '555-0316', '1600 Mercy Dr, Tampa, FL', 'Dave Ross', '555-0365', 'Photography, website updates', 'Remote/flexible', 'active', '2024-02-15', 15, 'Web developer')
    `);
    console.log('Volunteers seeded.');

    // Seed Volunteer Schedules (15+)
    await pool.query(`
      INSERT INTO volunteer_schedules (volunteer_id, scheduled_date, start_time, end_time, task, area, status, notes) VALUES
      (1, '2024-04-27', '09:00', '12:00', 'Dog walking', 'Outdoor yards', 'scheduled', 'Morning walk shift'),
      (1, '2024-04-28', '09:00', '12:00', 'Dog walking', 'Outdoor yards', 'scheduled', 'Sunday walk shift'),
      (2, '2024-04-29', '08:00', '11:00', 'Cat socialization', 'Cat wing', 'scheduled', 'Morning cat care'),
      (3, '2024-04-29', '17:00', '20:00', 'Kennel cleaning', 'Dog wing', 'scheduled', 'Evening cleaning'),
      (4, '2024-04-28', '09:00', '13:00', 'Data entry', 'Front office', 'scheduled', 'Update records'),
      (5, '2024-05-01', '10:00', '16:00', 'Event planning', 'Conference room', 'scheduled', 'Spring adoption event prep'),
      (6, '2024-04-27', '08:00', '14:00', 'Medical assistance', 'Vet clinic', 'scheduled', 'Assist with vaccinations'),
      (7, '2024-04-27', '10:00', '12:00', 'Behavior assessment', 'Training room', 'scheduled', 'New intake assessments'),
      (8, '2024-04-28', '10:00', '14:00', 'Social media content', 'Throughout shelter', 'scheduled', 'Photo shoot for adoption posts'),
      (9, '2024-04-29', '13:00', '17:00', 'Facility maintenance', 'All buildings', 'scheduled', 'Fix broken kennel latches'),
      (10, '2024-04-27', '13:00', '16:00', 'Dog walking', 'Outdoor yards', 'scheduled', 'Afternoon walk shift'),
      (11, '2024-04-30', '09:00', '11:00', 'Supply pickup', 'Off-site', 'scheduled', 'Pick up donated supplies'),
      (12, '2024-04-27', '11:00', '15:00', 'Adoption counseling', 'Adoption center', 'scheduled', 'Meet and greet appointments'),
      (14, '2024-04-29', '18:00', '20:00', 'Community outreach', 'Off-site', 'scheduled', 'School presentation prep'),
      (15, '2024-04-27', '08:00', '12:00', 'Dog walking & yard work', 'Outdoor areas', 'scheduled', 'New volunteer orientation'),
      (16, '2024-05-01', '09:00', '13:00', 'Photography', 'Throughout shelter', 'scheduled', 'Update website photos')
    `);
    console.log('Volunteer schedules seeded.');

    // Seed Donations (15+)
    await pool.query(`
      INSERT INTO donations (donor_name, donor_email, amount, donation_type, campaign, payment_method, donation_date, receipt_number, is_recurring, notes) VALUES
      ('William Harris', 'wharris@email.com', 500.00, 'monetary', 'General Fund', 'credit_card', '2024-01-10', 'REC-2024-001', true, 'Monthly recurring donation'),
      ('Corporate PetCo', 'giving@petco.com', 5000.00, 'monetary', 'Building Renovation', 'bank_transfer', '2024-01-15', 'REC-2024-002', false, 'Corporate sponsorship'),
      ('Margaret Clark', 'mclark@email.com', 100.00, 'monetary', 'Medical Fund', 'credit_card', '2024-02-01', 'REC-2024-003', true, 'Monthly medical fund donation'),
      ('John Baker', 'jbaker@email.com', 0.00, 'supplies', 'Supply Drive', 'N/A', '2024-02-14', 'REC-2024-004', false, '50 lbs dog food, 30 lbs cat food'),
      ('Springfield Lions Club', 'lions@springfield.org', 2500.00, 'monetary', 'Spay/Neuter Program', 'check', '2024-02-20', 'REC-2024-005', false, 'Annual contribution'),
      ('Anonymous', NULL, 1000.00, 'monetary', 'General Fund', 'cash', '2024-03-01', 'REC-2024-006', false, 'Anonymous cash donation'),
      ('Sarah Mitchell', 'smitchell@email.com', 250.00, 'monetary', 'Emergency Medical', 'credit_card', '2024-03-05', 'REC-2024-007', false, 'For Rockys treatment'),
      ('Pet Supply Plus', 'donate@petsupplyplus.com', 0.00, 'supplies', 'Supply Drive', 'N/A', '2024-03-10', 'REC-2024-008', false, '100 toys, 50 beds, leashes'),
      ('Robert Thompson', 'rthompson@email.com', 750.00, 'monetary', 'Building Renovation', 'bank_transfer', '2024-03-15', 'REC-2024-009', false, 'Memorial donation'),
      ('Emily Watson', 'ewatson@email.com', 50.00, 'monetary', 'General Fund', 'credit_card', '2024-03-20', 'REC-2024-010', true, 'Monthly donation'),
      ('Springfield School District', 'giving@springfieldschools.org', 0.00, 'supplies', 'Education Program', 'N/A', '2024-03-25', 'REC-2024-011', false, 'Art supplies for kids program'),
      ('Tech Corp Matching', 'matching@techcorp.com', 3000.00, 'monetary', 'General Fund', 'bank_transfer', '2024-04-01', 'REC-2024-012', false, 'Employee matching program'),
      ('Local Brewery', 'events@localbrewery.com', 1500.00, 'monetary', 'Event Sponsorship', 'check', '2024-04-05', 'REC-2024-013', false, 'Yappy Hour event sponsor'),
      ('Dorothy Adams', 'dadams@email.com', 10000.00, 'monetary', 'Endowment', 'bank_transfer', '2024-04-10', 'REC-2024-014', false, 'Legacy gift'),
      ('Veterinary Partners', 'donate@vetpartners.com', 0.00, 'services', 'Medical Fund', 'N/A', '2024-04-15', 'REC-2024-015', true, 'Pro bono vet services monthly'),
      ('Community Fundraiser', 'events@shelter.com', 4200.00, 'monetary', 'Spring Gala', 'mixed', '2024-04-20', 'REC-2024-016', false, 'Annual spring gala proceeds')
    `);
    console.log('Donations seeded.');

    // Seed Supply Inventory (15+)
    await pool.query(`
      INSERT INTO supply_inventory (item_name, category, quantity, unit, reorder_level, cost_per_unit, supplier, location, last_restocked, expiry_date, notes) VALUES
      ('Premium Dog Food (Adult)', 'food', 50, 'bags', 15, 45.99, 'PetCo Distribution', 'Storage Room A', '2024-04-01', '2025-04-01', '30lb bags'),
      ('Premium Cat Food (Adult)', 'food', 35, 'bags', 10, 32.99, 'PetCo Distribution', 'Storage Room A', '2024-04-01', '2025-04-01', '15lb bags'),
      ('Puppy Food', 'food', 20, 'bags', 8, 38.99, 'PetCo Distribution', 'Storage Room A', '2024-03-15', '2025-03-15', '20lb bags'),
      ('Kitten Food', 'food', 15, 'bags', 5, 28.99, 'PetCo Distribution', 'Storage Room A', '2024-03-15', '2025-03-15', '10lb bags'),
      ('Dog Leashes (6ft)', 'equipment', 40, 'pieces', 15, 8.99, 'Wholesale Pet Supplies', 'Equipment Room', '2024-03-01', NULL, 'Standard nylon leashes'),
      ('Cat Litter (Clumping)', 'supplies', 60, 'bags', 20, 12.99, 'PetCo Distribution', 'Storage Room B', '2024-04-01', NULL, '25lb bags'),
      ('Flea/Tick Prevention (Dogs)', 'medical', 30, 'doses', 10, 15.00, 'Vet Supply Co', 'Vet Clinic', '2024-03-15', '2025-06-01', 'Topical treatment'),
      ('Flea/Tick Prevention (Cats)', 'medical', 25, 'doses', 10, 12.00, 'Vet Supply Co', 'Vet Clinic', '2024-03-15', '2025-06-01', 'Topical treatment'),
      ('Vaccination Syringes', 'medical', 200, 'pieces', 50, 0.35, 'Medical Supplies Inc', 'Vet Clinic', '2024-04-01', '2026-04-01', 'Sterile disposable'),
      ('Dog Beds (Large)', 'bedding', 8, 'pieces', 5, 35.00, 'Wholesale Pet Supplies', 'Storage Room C', '2024-02-15', NULL, 'Washable covers'),
      ('Cat Beds', 'bedding', 12, 'pieces', 5, 20.00, 'Wholesale Pet Supplies', 'Storage Room C', '2024-02-15', NULL, 'Soft fleece material'),
      ('Cleaning Disinfectant', 'cleaning', 20, 'gallons', 8, 18.50, 'Janitorial Supply Co', 'Maintenance Closet', '2024-03-20', '2025-03-20', 'Animal-safe formula'),
      ('Paper Towels', 'cleaning', 48, 'rolls', 12, 2.50, 'Janitorial Supply Co', 'Maintenance Closet', '2024-04-01', NULL, 'Industrial size rolls'),
      ('Microchip Kits', 'medical', 45, 'pieces', 15, 8.00, 'ID Tech Pets', 'Vet Clinic', '2024-03-01', '2026-03-01', 'ISO standard chips'),
      ('Rabbit Hay (Timothy)', 'food', 10, 'bales', 3, 22.00, 'Farm Supply Co', 'Storage Room A', '2024-04-01', '2024-10-01', 'Premium timothy hay'),
      ('Bird Seed Mix', 'food', 8, 'bags', 3, 15.99, 'PetCo Distribution', 'Storage Room A', '2024-04-01', '2025-01-01', '10lb bags'),
      ('Disposable Gloves', 'medical', 5, 'boxes', 3, 12.00, 'Medical Supplies Inc', 'Vet Clinic', '2024-04-01', '2026-04-01', 'Box of 100, nitrile')
    `);
    console.log('Supply inventory seeded.');

    // Seed Lost and Found (15+)
    await pool.query(`
      INSERT INTO lost_found (report_type, animal_type, breed, color, size, sex, microchip_number, location_found_lost, date_reported, reporter_name, reporter_phone, reporter_email, description, photo_url, status, matched_animal_id, notes) VALUES
      ('found', 'dog', 'Labrador Mix', 'Black', 'large', 'male', NULL, '5th and Main St, Springfield', '2024-03-01', 'Tom Wheeler', '555-0401', 'twheeler@email.com', 'Found wandering near park, friendly, no collar', NULL, 'open', NULL, 'Brought to shelter'),
      ('lost', 'cat', 'Tabby', 'Orange', 'medium', 'male', 'MC-LOST-001', 'Elm Street neighborhood', '2024-03-05', 'Lisa Park', '555-0402', 'lpark@email.com', 'Indoor cat escaped, very timid, has collar with bell', NULL, 'open', NULL, 'Last seen near grocery store'),
      ('found', 'dog', 'Chihuahua', 'Tan', 'small', 'female', NULL, 'Shopping mall parking lot', '2024-03-08', 'Mike Johnson', '555-0403', 'mjohnson@email.com', 'Small dog found hiding under car, shaking', NULL, 'reunited', NULL, 'Owner found via social media'),
      ('lost', 'dog', 'Husky', 'White and Gray', 'large', 'male', 'MC-LOST-002', 'Riverside Park area', '2024-03-10', 'Sarah Kim', '555-0404', 'skim2@email.com', 'Husky escaped from yard during storm, blue eyes', NULL, 'open', NULL, 'Offering reward'),
      ('found', 'cat', 'Domestic Shorthair', 'Black and White', 'medium', 'female', NULL, 'Behind restaurant on Oak Ave', '2024-03-12', 'Carlos Ruiz', '555-0405', 'cruiz2@email.com', 'Friendly tuxedo cat, appears well-fed', NULL, 'open', NULL, 'Being held at shelter'),
      ('lost', 'dog', 'Beagle', 'Tricolor', 'medium', 'female', 'MC-LOST-003', 'Downtown area near post office', '2024-03-15', 'Amy Chen', '555-0406', 'achen2@email.com', 'Beagle slipped leash during walk', NULL, 'reunited', NULL, 'Found 2 days later'),
      ('found', 'rabbit', 'Unknown', 'White', 'small', 'unknown', NULL, 'Suburban neighborhood backyard', '2024-03-18', 'Nancy White', '555-0407', 'nwhite2@email.com', 'Domestic rabbit found in garden', NULL, 'open', NULL, 'Appears to be pet rabbit'),
      ('lost', 'cat', 'Persian', 'White', 'medium', 'female', 'MC-LOST-004', 'Apartment complex on Pine St', '2024-03-20', 'Helen Kim', '555-0408', 'hkim2@email.com', 'Indoor Persian cat, may be scared', NULL, 'open', NULL, 'Left window open'),
      ('found', 'dog', 'Mixed Breed', 'Brown', 'medium', 'male', NULL, 'Highway rest stop', '2024-03-22', 'Greg Martinez', '555-0409', 'gmart@email.com', 'Dog found tied to bench at rest stop', NULL, 'open', NULL, 'Possible abandonment'),
      ('lost', 'bird', 'Cockatiel', 'Gray and Yellow', 'small', 'male', NULL, 'Maple Street area', '2024-03-25', 'Beth Cooper', '555-0410', 'bcooper2@email.com', 'Cockatiel flew out open window, answers to Sunny', NULL, 'open', NULL, 'Can whistle Star Wars theme'),
      ('found', 'cat', 'Siamese', 'Cream and Brown', 'medium', 'male', 'MC-2024-004', 'Near elementary school', '2024-03-28', 'Julia King', '555-0411', 'jking2@email.com', 'Siamese cat found near school playground', NULL, 'matched', 4, 'Microchip matched to shelter animal'),
      ('lost', 'dog', 'Poodle', 'White', 'small', 'female', 'MC-LOST-005', 'Dog park on Cedar Lane', '2024-04-01', 'Diana Evans', '555-0412', 'devans2@email.com', 'Toy poodle ran off at dog park', NULL, 'open', NULL, 'Wearing pink harness'),
      ('found', 'dog', 'Shepherd Mix', 'Black and Brown', 'large', 'female', NULL, 'Industrial area near warehouse', '2024-04-05', 'Oscar Perez', '555-0413', 'operez2@email.com', 'Scared dog found near warehouses, thin', NULL, 'open', NULL, 'Appears neglected'),
      ('lost', 'cat', 'Maine Coon', 'Brown Tabby', 'large', 'male', 'MC-LOST-006', 'Suburb near lake', '2024-04-08', 'Robert Thompson', '555-0414', 'rthompson2@email.com', 'Large fluffy cat missing from yard', NULL, 'open', NULL, 'Very distinctive size'),
      ('found', 'dog', 'Terrier Mix', 'White and Brown', 'small', 'male', NULL, 'Park playground area', '2024-04-10', 'Fiona Grant', '555-0415', 'fgrant2@email.com', 'Small terrier found playing with kids', NULL, 'reunited', NULL, 'Owner came to shelter same day'),
      ('lost', 'rabbit', 'Holland Lop', 'Brown', 'small', 'male', NULL, 'Backyard enclosure', '2024-04-12', 'Chris Martinez', '555-0416', 'cmart2@email.com', 'Rabbit escaped from outdoor hutch', NULL, 'open', NULL, 'Gate was left open')
    `);
    console.log('Lost and found seeded.');

    // Seed Stray Holds (15+)
    await pool.query(`
      INSERT INTO stray_holds (animal_id, intake_date, hold_start_date, hold_end_date, legal_hold_days, found_location, finder_name, finder_phone, is_claimed, claimed_by, claimed_date, status, notes) VALUES
      (2, '2024-01-20', '2024-01-20', '2024-01-23', 3, 'Oak Street park', 'Tom Wheeler', '555-0401', false, NULL, NULL, 'expired', 'No owner claim, moved to available'),
      (4, '2024-02-10', '2024-02-10', '2024-02-13', 3, 'Behind grocery store', 'Lisa Park', '555-0402', false, NULL, NULL, 'expired', 'Hold expired, now available'),
      (7, '2024-03-01', '2024-03-01', '2024-03-04', 3, 'Highway shoulder', 'Mike Johnson', '555-0403', false, NULL, NULL, 'expired', 'No microchip, no owner found'),
      (9, '2024-03-10', '2024-03-10', '2024-03-13', 3, 'Abandoned lot', 'Sarah Kim', '555-0404', false, NULL, NULL, 'expired', 'Signs of neglect'),
      (14, '2024-04-05', '2024-04-05', '2024-04-08', 3, 'Restaurant dumpster area', 'Carlos Ruiz', '555-0405', false, NULL, NULL, 'expired', 'Friendly stray cat'),
      (1, '2024-01-15', '2024-01-15', '2024-01-18', 3, 'Riverside park', 'Amy Chen', '555-0406', false, NULL, NULL, 'expired', 'Owner surrender after hold'),
      (3, '2024-02-01', '2024-02-01', '2024-02-04', 3, 'Suburb neighborhood', 'Nancy White', '555-0407', false, NULL, NULL, 'expired', 'Owner surrender confirmed'),
      (5, '2024-02-15', '2024-02-15', '2024-02-18', 3, 'Transfer from county shelter', 'Shelter Staff', '555-0001', false, NULL, NULL, 'expired', 'Transfer hold'),
      (6, '2024-02-20', '2024-02-20', '2024-02-23', 3, 'Apartment complex', 'Helen Kim', '555-0408', false, NULL, NULL, 'expired', 'Surrendered by landlord'),
      (8, '2024-03-05', '2024-03-05', '2024-03-08', 3, 'Veterinary office drop-off', 'Greg Martinez', '555-0409', false, NULL, NULL, 'expired', 'Left at vet office'),
      (10, '2024-03-15', '2024-03-15', '2024-03-18', 3, 'Transfer from partner rescue', 'Julia King', '555-0410', false, NULL, NULL, 'expired', 'Transfer hold complete'),
      (11, '2024-03-20', '2024-03-20', '2024-03-23', 3, 'Front door of shelter', 'Diana Evans', '555-0411', false, NULL, NULL, 'expired', 'Left in box at door'),
      (12, '2024-03-25', '2024-03-25', '2024-03-28', 3, 'Owner surrender', 'Oscar Perez', '555-0412', false, NULL, NULL, 'expired', 'Owner moving overseas'),
      (13, '2024-04-01', '2024-04-01', '2024-04-04', 3, 'Transfer from rescue', 'Fiona Grant', '555-0413', false, NULL, NULL, 'expired', 'Rescue at capacity'),
      (15, '2024-04-10', '2024-04-10', '2024-04-13', 3, 'Owner surrender', 'Beth Cooper', '555-0414', false, NULL, NULL, 'expired', 'Owner health issues'),
      (16, '2024-04-15', '2024-04-15', '2024-04-18', 3, 'Found in park', 'Tom Wheeler', '555-0401', false, NULL, NULL, 'on_hold', 'Currently on hold')
    `);
    console.log('Stray holds seeded.');

    // Seed Events (15+)
    await pool.query(`
      INSERT INTO events (event_name, event_type, event_date, start_time, end_time, location, description, max_participants, current_participants, organizer, status, notes) VALUES
      ('Spring Adoption Fair', 'adoption', '2024-05-15', '10:00', '16:00', 'Main Shelter Hall', 'Annual spring adoption event with reduced fees', 200, 45, 'Eric Foster', 'planned', 'Need extra volunteers'),
      ('Yappy Hour', 'fundraiser', '2024-05-20', '17:00', '20:00', 'Local Brewery Patio', 'Dog-friendly happy hour fundraiser', 100, 30, 'Local Brewery', 'planned', 'Brewery sponsoring event'),
      ('Pet First Aid Workshop', 'education', '2024-05-10', '09:00', '12:00', 'Training Room', 'Learn basic pet first aid and CPR', 30, 25, 'Dr. Sarah Mitchell', 'planned', 'Certificates provided'),
      ('Dog Walk-a-thon', 'fundraiser', '2024-06-01', '08:00', '12:00', 'Riverside Park', '5K walk with shelter dogs', 150, 0, 'Alex Rivera', 'planned', 'Registration opens May 1'),
      ('Cat Cafe Pop-up', 'adoption', '2024-05-25', '11:00', '15:00', 'Downtown Coffee House', 'Meet adoptable cats over coffee', 50, 15, 'Beth Cooper', 'planned', 'Coffee house donating proceeds'),
      ('Volunteer Appreciation Dinner', 'appreciation', '2024-06-15', '18:00', '21:00', 'Community Center', 'Annual dinner thanking our volunteers', 80, 40, 'Diana Evans', 'planned', 'Catering ordered'),
      ('Kids and Critters Camp', 'education', '2024-07-01', '09:00', '15:00', 'Shelter Grounds', 'Week-long summer camp for kids ages 8-14', 25, 20, 'Nina Ortiz', 'planned', 'Daily animal interactions'),
      ('Senior Pet Adoption Day', 'adoption', '2024-05-30', '10:00', '14:00', 'Main Shelter Hall', 'Special event for senior pets with waived fees', 100, 0, 'Laura Moore', 'planned', 'Ages 7+ animals'),
      ('Microchip Clinic', 'community_service', '2024-05-18', '09:00', '13:00', 'Vet Clinic', 'Low-cost microchipping for community pets', 60, 35, 'Dr. James Chen', 'planned', '$15 per chip'),
      ('Paws in the Park', 'community', '2024-06-10', '10:00', '14:00', 'City Park Pavilion', 'Community gathering with pet demos and info', 300, 0, 'Eric Foster', 'planned', 'Vendors welcome'),
      ('Foster Orientation', 'training', '2024-05-12', '13:00', '16:00', 'Training Room', 'New foster parent orientation session', 20, 12, 'Maria Garcia', 'planned', 'Monthly session'),
      ('Photography Day', 'marketing', '2024-05-08', '10:00', '14:00', 'Throughout Shelter', 'Professional photos for adoption listings', 50, 17, 'Quinn Ross', 'planned', 'Professional photographer volunteering'),
      ('Spay/Neuter Clinic', 'community_service', '2024-05-22', '08:00', '16:00', 'Vet Clinic', 'Low-cost spay/neuter for community', 30, 28, 'Dr. Lisa Park', 'planned', '$50 dogs, $35 cats'),
      ('Annual Gala', 'fundraiser', '2024-09-20', '18:00', '22:00', 'Grand Hotel Ballroom', 'Black-tie fundraising gala', 250, 0, 'Eric Foster', 'planned', 'Tickets $100 per person'),
      ('Holiday Pet Photos', 'fundraiser', '2024-12-14', '10:00', '16:00', 'Main Shelter Hall', 'Santa photos with pets, $20 donation', 100, 0, 'Hannah Irwin', 'planned', 'Professional photographer booked'),
      ('Training Workshop: Leash Manners', 'education', '2024-05-05', '10:00', '12:00', 'Training Yard', 'Learn to walk your dog politely on leash', 15, 10, 'George Hayes', 'planned', 'Bring your own dog welcome')
    `);
    console.log('Events seeded.');

    // Seed Medication Log (15+)
    await pool.query(`
      INSERT INTO medication_log (animal_id, medication_name, dosage, frequency, route, start_date, end_date, administered_by, administered_at, status, side_effects, notes) VALUES
      (1, 'Heartgard Plus', '68-136 lbs', 'monthly', 'oral', '2024-01-16', '2025-01-16', 'Dr. Sarah Mitchell', '2024-04-16 09:00:00', 'active', NULL, 'Heartworm prevention'),
      (1, 'NexGard', '60-121 lbs', 'monthly', 'oral', '2024-01-16', '2025-01-16', 'Dr. Sarah Mitchell', '2024-04-16 09:00:00', 'active', NULL, 'Flea and tick prevention'),
      (2, 'Revolution Plus', '5.6-11 lbs', 'monthly', 'topical', '2024-01-21', '2025-01-21', 'Dr. James Chen', '2024-04-21 10:00:00', 'active', NULL, 'Parasite prevention'),
      (3, 'Carprofen', '75mg', 'twice daily', 'oral', '2024-02-02', '2024-02-16', 'Dr. Sarah Mitchell', '2024-02-02 08:00:00', 'completed', NULL, 'Post-exam joint inflammation'),
      (5, 'Cephalexin', '500mg', 'twice daily', 'oral', '2024-02-20', '2024-03-06', 'Dr. Sarah Mitchell', '2024-02-20 09:00:00', 'completed', NULL, 'Post-spay antibiotic'),
      (7, 'Doxycycline', '100mg', 'twice daily', 'oral', '2024-03-02', '2024-03-16', 'Dr. Sarah Mitchell', '2024-03-02 08:00:00', 'completed', 'Mild nausea', 'Kennel cough treatment'),
      (8, 'Chlorhexidine Shampoo', 'As directed', 'twice weekly', 'topical', '2024-03-06', '2024-04-06', 'Staff', '2024-04-03 14:00:00', 'active', NULL, 'Medicated baths for skin'),
      (9, 'Amoxicillin', '250mg', 'twice daily', 'oral', '2024-03-11', '2024-03-25', 'Dr. Sarah Mitchell', '2024-03-11 09:00:00', 'completed', NULL, 'Laceration infection prevention'),
      (9, 'Tramadol', '50mg', 'twice daily', 'oral', '2024-03-11', '2024-03-18', 'Dr. Sarah Mitchell', '2024-03-11 09:00:00', 'completed', 'Mild sedation', 'Pain management for injury'),
      (11, 'Ivermectin', '0.2mg/kg', 'once', 'oral', '2024-03-21', '2024-03-21', 'Dr. Lisa Park', '2024-03-21 10:00:00', 'completed', NULL, 'Deworming'),
      (13, 'Frontline Plus', '23-44 lbs', 'monthly', 'topical', '2024-04-02', '2025-04-02', 'Dr. Sarah Mitchell', '2024-04-02 09:00:00', 'active', NULL, 'Flea/tick prevention'),
      (14, 'Dewormer (Pyrantel)', '5ml', 'once', 'oral', '2024-04-06', '2024-04-06', 'Dr. James Chen', '2024-04-06 11:00:00', 'completed', NULL, 'Routine deworming'),
      (15, 'Rimadyl', '100mg', 'daily', 'oral', '2024-04-11', '2024-04-25', 'Dr. Sarah Mitchell', '2024-04-11 08:00:00', 'active', NULL, 'Joint support'),
      (6, 'Metronidazole', '250mg', 'twice daily', 'oral', '2024-03-01', '2024-03-08', 'Dr. James Chen', '2024-03-01 09:00:00', 'completed', NULL, 'GI upset treatment'),
      (10, 'Revolution Plus', '5.6-11 lbs', 'monthly', 'topical', '2024-03-16', '2025-03-16', 'Dr. James Chen', '2024-04-16 10:00:00', 'active', NULL, 'Parasite prevention'),
      (4, 'L-Lysine', '500mg', 'daily', 'oral', '2024-02-11', '2024-05-11', 'Staff', '2024-04-20 08:00:00', 'active', NULL, 'Upper respiratory support')
    `);
    console.log('Medication log seeded.');

    // Seed Quarantine (15+)
    await pool.query(`
      INSERT INTO quarantine (animal_id, reason, start_date, expected_end_date, actual_end_date, location, monitoring_notes, veterinarian, status, release_approved_by, notes) VALUES
      (9, 'Bite history evaluation', '2024-03-10', '2024-03-24', NULL, 'Q-501', 'Day 1: Calm, eating well. Day 3: No aggression signs. Day 7: Responding to training.', 'Dr. Sarah Mitchell', 'active', NULL, '14-day bite quarantine hold'),
      (2, 'New intake health screening', '2024-01-20', '2024-01-27', '2024-01-27', 'Q-501', 'No signs of illness, cleared for general population', 'Dr. James Chen', 'released', 'Dr. James Chen', 'Standard intake quarantine'),
      (4, 'Upper respiratory symptoms', '2024-02-10', '2024-02-24', '2024-02-22', 'Q-501', 'Sneezing resolved by day 10, appetite normal', 'Dr. James Chen', 'released', 'Dr. James Chen', 'URI cleared early'),
      (7, 'Kennel cough', '2024-03-01', '2024-03-15', '2024-03-14', 'Q-501', 'Cough subsiding, completed antibiotic course', 'Dr. Sarah Mitchell', 'released', 'Dr. Sarah Mitchell', 'Released to foster'),
      (1, 'New intake screening', '2024-01-15', '2024-01-22', '2024-01-22', 'Q-501', 'Healthy, all tests negative', 'Dr. Sarah Mitchell', 'released', 'Dr. Sarah Mitchell', 'Cleared quickly'),
      (3, 'New intake screening', '2024-02-01', '2024-02-08', '2024-02-08', 'Q-501', 'Healthy on arrival', 'Dr. Sarah Mitchell', 'released', 'Dr. Sarah Mitchell', 'Standard screening'),
      (5, 'Transfer quarantine', '2024-02-15', '2024-02-22', '2024-02-22', 'Q-501', 'No illness detected', 'Dr. Sarah Mitchell', 'released', 'Dr. Sarah Mitchell', 'Transfer protocol'),
      (6, 'GI illness', '2024-02-20', '2024-03-06', '2024-03-04', 'Q-501', 'Vomiting and diarrhea resolved with treatment', 'Dr. James Chen', 'released', 'Dr. James Chen', 'Metronidazole course completed'),
      (8, 'Skin condition evaluation', '2024-03-05', '2024-03-19', '2024-03-18', 'Q-501', 'Not contagious, dermatitis only', 'Dr. Lisa Park', 'released', 'Dr. Lisa Park', 'Cleared for population'),
      (10, 'New intake screening', '2024-03-15', '2024-03-22', '2024-03-22', 'Q-501', 'All clear', 'Dr. James Chen', 'released', 'Dr. James Chen', 'Standard quarantine'),
      (11, 'New intake screening', '2024-03-20', '2024-03-27', '2024-03-27', 'Q-501', 'Rabbit healthy, teeth checked', 'Dr. Lisa Park', 'released', 'Dr. Lisa Park', 'Small animal protocol'),
      (12, 'Avian intake screening', '2024-03-25', '2024-04-01', '2024-04-01', 'Q-501', 'No signs of PBFD or psittacosis', 'Dr. Lisa Park', 'released', 'Dr. Lisa Park', 'Bird quarantine protocol'),
      (13, 'New intake screening', '2024-04-01', '2024-04-08', '2024-04-08', 'Q-501', 'Energetic and healthy', 'Dr. Sarah Mitchell', 'released', 'Dr. Sarah Mitchell', 'Standard screening'),
      (14, 'Stray intake screening', '2024-04-05', '2024-04-12', '2024-04-12', 'Q-501', 'FIV/FeLV negative, healthy', 'Dr. James Chen', 'released', 'Dr. James Chen', 'Stray cat protocol'),
      (15, 'New intake screening', '2024-04-10', '2024-04-17', '2024-04-17', 'Q-501', 'Large breed, joint check done', 'Dr. Sarah Mitchell', 'released', 'Dr. Sarah Mitchell', 'Standard screening'),
      (16, 'New intake screening', '2024-04-15', '2024-04-22', NULL, 'Q-501', 'Day 3: Eating well, no symptoms', 'Dr. Lisa Park', 'active', NULL, 'Currently in quarantine')
    `);
    console.log('Quarantine records seeded.');

    console.log('Seeding complete!');
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    await pool.end();
    process.exit(1);
  }
};

seed();
