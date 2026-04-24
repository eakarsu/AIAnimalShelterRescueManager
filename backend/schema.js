const pool = require('./db');

const createTables = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      name VARCHAR(255),
      role VARCHAR(50) DEFAULT 'staff',
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS animals (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255),
      species VARCHAR(100),
      breed VARCHAR(255),
      age_years NUMERIC,
      age_months INT,
      weight NUMERIC,
      color VARCHAR(100),
      sex VARCHAR(20),
      microchip_number VARCHAR(100) UNIQUE,
      intake_date DATE,
      intake_type VARCHAR(100),
      status VARCHAR(50) DEFAULT 'available',
      description TEXT,
      photo_url TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS kennels (
      id SERIAL PRIMARY KEY,
      kennel_number VARCHAR(50) UNIQUE,
      building VARCHAR(100),
      kennel_type VARCHAR(50),
      capacity INT DEFAULT 1,
      current_occupancy INT DEFAULT 0,
      status VARCHAR(50) DEFAULT 'available',
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS kennel_assignments (
      id SERIAL PRIMARY KEY,
      animal_id INT REFERENCES animals(id) ON DELETE CASCADE,
      kennel_id INT REFERENCES kennels(id) ON DELETE CASCADE,
      assigned_date DATE,
      released_date DATE,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS medical_records (
      id SERIAL PRIMARY KEY,
      animal_id INT REFERENCES animals(id) ON DELETE CASCADE,
      record_type VARCHAR(100),
      description TEXT,
      veterinarian VARCHAR(255),
      record_date DATE,
      next_due_date DATE,
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS behavioral_assessments (
      id SERIAL PRIMARY KEY,
      animal_id INT REFERENCES animals(id) ON DELETE CASCADE,
      assessor VARCHAR(255),
      assessment_date DATE,
      aggression_level INT,
      fear_level INT,
      sociability_level INT,
      energy_level INT,
      trainability_level INT,
      good_with_kids BOOLEAN,
      good_with_dogs BOOLEAN,
      good_with_cats BOOLEAN,
      bite_history BOOLEAN DEFAULT false,
      bite_details TEXT,
      notes TEXT,
      overall_rating VARCHAR(50),
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS adoption_applications (
      id SERIAL PRIMARY KEY,
      applicant_name VARCHAR(255),
      email VARCHAR(255),
      phone VARCHAR(50),
      address TEXT,
      housing_type VARCHAR(100),
      has_yard BOOLEAN,
      has_other_pets BOOLEAN,
      other_pets_details TEXT,
      has_children BOOLEAN,
      children_ages TEXT,
      experience TEXT,
      preferred_species VARCHAR(100),
      preferred_breed VARCHAR(255),
      preferred_age VARCHAR(50),
      preferred_size VARCHAR(50),
      reason TEXT,
      veterinarian_reference TEXT,
      status VARCHAR(50) DEFAULT 'pending',
      animal_id INT REFERENCES animals(id) ON DELETE SET NULL,
      application_date DATE DEFAULT CURRENT_DATE,
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS adoption_contracts (
      id SERIAL PRIMARY KEY,
      application_id INT REFERENCES adoption_applications(id) ON DELETE CASCADE,
      animal_id INT REFERENCES animals(id) ON DELETE CASCADE,
      adopter_name VARCHAR(255),
      adoption_date DATE,
      adoption_fee NUMERIC,
      spay_neuter_required BOOLEAN DEFAULT true,
      return_policy TEXT,
      special_conditions TEXT,
      status VARCHAR(50) DEFAULT 'active',
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS foster_homes (
      id SERIAL PRIMARY KEY,
      foster_name VARCHAR(255),
      email VARCHAR(255),
      phone VARCHAR(50),
      address TEXT,
      housing_type VARCHAR(100),
      has_yard BOOLEAN,
      max_animals INT,
      current_animals INT DEFAULT 0,
      can_foster_dogs BOOLEAN,
      can_foster_cats BOOLEAN,
      can_foster_medical BOOLEAN,
      can_foster_behavioral BOOLEAN,
      experience TEXT,
      status VARCHAR(50) DEFAULT 'active',
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS foster_placements (
      id SERIAL PRIMARY KEY,
      animal_id INT REFERENCES animals(id) ON DELETE CASCADE,
      foster_home_id INT REFERENCES foster_homes(id) ON DELETE CASCADE,
      start_date DATE,
      end_date DATE,
      status VARCHAR(50) DEFAULT 'active',
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS volunteers (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255),
      email VARCHAR(255),
      phone VARCHAR(50),
      address TEXT,
      emergency_contact VARCHAR(255),
      emergency_phone VARCHAR(50),
      skills TEXT,
      availability TEXT,
      status VARCHAR(50) DEFAULT 'active',
      start_date DATE,
      hours_completed NUMERIC DEFAULT 0,
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS volunteer_schedules (
      id SERIAL PRIMARY KEY,
      volunteer_id INT REFERENCES volunteers(id) ON DELETE CASCADE,
      scheduled_date DATE,
      start_time TIME,
      end_time TIME,
      task VARCHAR(255),
      area VARCHAR(100),
      status VARCHAR(50) DEFAULT 'scheduled',
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS donations (
      id SERIAL PRIMARY KEY,
      donor_name VARCHAR(255),
      donor_email VARCHAR(255),
      amount NUMERIC,
      donation_type VARCHAR(100),
      campaign VARCHAR(255),
      payment_method VARCHAR(100),
      donation_date DATE,
      receipt_number VARCHAR(100),
      is_recurring BOOLEAN DEFAULT false,
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS supply_inventory (
      id SERIAL PRIMARY KEY,
      item_name VARCHAR(255),
      category VARCHAR(100),
      quantity INT,
      unit VARCHAR(50),
      reorder_level INT,
      cost_per_unit NUMERIC,
      supplier VARCHAR(255),
      location VARCHAR(100),
      last_restocked DATE,
      expiry_date DATE,
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS lost_found (
      id SERIAL PRIMARY KEY,
      report_type VARCHAR(50),
      animal_type VARCHAR(100),
      breed VARCHAR(255),
      color VARCHAR(100),
      size VARCHAR(50),
      sex VARCHAR(20),
      microchip_number VARCHAR(100),
      location_found_lost VARCHAR(255),
      date_reported DATE,
      reporter_name VARCHAR(255),
      reporter_phone VARCHAR(50),
      reporter_email VARCHAR(255),
      description TEXT,
      photo_url TEXT,
      status VARCHAR(50) DEFAULT 'open',
      matched_animal_id INT REFERENCES animals(id) ON DELETE SET NULL,
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS stray_holds (
      id SERIAL PRIMARY KEY,
      animal_id INT REFERENCES animals(id) ON DELETE CASCADE,
      intake_date DATE,
      hold_start_date DATE,
      hold_end_date DATE,
      legal_hold_days INT DEFAULT 3,
      found_location VARCHAR(255),
      finder_name VARCHAR(255),
      finder_phone VARCHAR(50),
      is_claimed BOOLEAN DEFAULT false,
      claimed_by VARCHAR(255),
      claimed_date DATE,
      status VARCHAR(50) DEFAULT 'on_hold',
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS events (
      id SERIAL PRIMARY KEY,
      event_name VARCHAR(255),
      event_type VARCHAR(100),
      event_date DATE,
      start_time TIME,
      end_time TIME,
      location VARCHAR(255),
      description TEXT,
      max_participants INT,
      current_participants INT DEFAULT 0,
      organizer VARCHAR(255),
      status VARCHAR(50) DEFAULT 'planned',
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS medication_log (
      id SERIAL PRIMARY KEY,
      animal_id INT REFERENCES animals(id) ON DELETE CASCADE,
      medication_name VARCHAR(255),
      dosage VARCHAR(100),
      frequency VARCHAR(100),
      route VARCHAR(50),
      start_date DATE,
      end_date DATE,
      administered_by VARCHAR(255),
      administered_at TIMESTAMP,
      status VARCHAR(50) DEFAULT 'active',
      side_effects TEXT,
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS quarantine (
      id SERIAL PRIMARY KEY,
      animal_id INT REFERENCES animals(id) ON DELETE CASCADE,
      reason VARCHAR(255),
      start_date DATE,
      expected_end_date DATE,
      actual_end_date DATE,
      location VARCHAR(100),
      monitoring_notes TEXT,
      veterinarian VARCHAR(255),
      status VARCHAR(50) DEFAULT 'active',
      release_approved_by VARCHAR(255),
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `;

  await pool.query(query);
  console.log('All tables created successfully.');
};

module.exports = { createTables };
