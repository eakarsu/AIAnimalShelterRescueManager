const express = require('express');
const router = express.Router();

// Helper: deterministic synthesizer
function seedRand(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

// ============================================================
// VIZ 1: Kennel Occupancy Grid
// GET /api/custom-views/kennel-occupancy
// Returns a grid of kennels by building/row with occupancy state
// ============================================================
router.get('/kennel-occupancy', (req, res) => {
  try {
    const rand = seedRand(42);
    const buildings = ['Main Hall', 'East Wing', 'Cattery', 'Iso Block'];
    const rows = ['A', 'B', 'C', 'D'];
    const cols = 8;
    const statuses = ['occupied', 'available', 'cleaning', 'maintenance'];
    const speciesPool = ['dog', 'cat', 'dog', 'dog', 'rabbit'];
    const namesPool = [
      'Bella', 'Max', 'Luna', 'Charlie', 'Cooper', 'Lucy', 'Daisy', 'Milo',
      'Rocky', 'Bailey', 'Sadie', 'Buddy', 'Molly', 'Toby', 'Stella', 'Zoe',
      'Oliver', 'Whiskers', 'Mittens', 'Shadow', 'Pepper', 'Ginger', 'Hazel', 'Finn',
    ];

    const grid = [];
    let totalKennels = 0;
    let occupiedCount = 0;
    let availableCount = 0;
    let cleaningCount = 0;
    let maintenanceCount = 0;

    buildings.forEach((building, bIdx) => {
      const buildingRows = rows.map((row) => {
        const cells = [];
        for (let c = 1; c <= cols; c++) {
          totalKennels++;
          const r = rand();
          let status;
          if (r < 0.62) status = 'occupied';
          else if (r < 0.84) status = 'available';
          else if (r < 0.94) status = 'cleaning';
          else status = 'maintenance';

          if (status === 'occupied') occupiedCount++;
          else if (status === 'available') availableCount++;
          else if (status === 'cleaning') cleaningCount++;
          else maintenanceCount++;

          const isOcc = status === 'occupied';
          cells.push({
            kennel_number: `${row}${String(c).padStart(2, '0')}`,
            building,
            row,
            col: c,
            status,
            capacity: 1 + (Math.floor(rand() * 3)),
            animal: isOcc ? {
              name: namesPool[Math.floor(rand() * namesPool.length)],
              species: speciesPool[Math.floor(rand() * speciesPool.length)],
              days_in_kennel: Math.floor(rand() * 45) + 1,
            } : null,
          });
        }
        return { row, cells };
      });
      grid.push({ building, building_idx: bIdx, rows: buildingRows });
    });

    res.json({
      generated_at: new Date().toISOString(),
      summary: {
        total: totalKennels,
        occupied: occupiedCount,
        available: availableCount,
        cleaning: cleaningCount,
        maintenance: maintenanceCount,
        occupancy_rate: Math.round((occupiedCount / totalKennels) * 1000) / 10,
      },
      grid,
    });
  } catch (e) {
    console.error('kennel-occupancy error', e);
    res.status(500).json({ error: 'Failed to generate kennel occupancy' });
  }
});

// ============================================================
// VIZ 2: Intake Timeline
// GET /api/custom-views/intake-timeline?days=30
// Returns daily intake counts by species over a window
// ============================================================
router.get('/intake-timeline', (req, res) => {
  try {
    const days = Math.min(parseInt(req.query.days) || 30, 90);
    const rand = seedRand(91);
    const today = new Date();
    const series = [];
    const intakeTypes = ['stray', 'owner_surrender', 'transfer', 'return'];

    let totalDogs = 0;
    let totalCats = 0;
    let totalOther = 0;
    let totalIntakes = 0;

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const weekday = d.getDay();
      const weekendBoost = (weekday === 0 || weekday === 6) ? 1.4 : 1.0;
      const dogs = Math.max(0, Math.round((4 + rand() * 6) * weekendBoost));
      const cats = Math.max(0, Math.round((3 + rand() * 5) * weekendBoost));
      const other = Math.max(0, Math.round(rand() * 2));
      totalDogs += dogs;
      totalCats += cats;
      totalOther += other;
      totalIntakes += dogs + cats + other;

      // intake type breakdown
      const types = {};
      intakeTypes.forEach((t) => { types[t] = Math.floor(rand() * 4); });

      series.push({
        date: d.toISOString().slice(0, 10),
        weekday: ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][weekday],
        dogs,
        cats,
        other,
        total: dogs + cats + other,
        types,
      });
    }

    const maxTotal = Math.max(...series.map(s => s.total));

    res.json({
      generated_at: new Date().toISOString(),
      window_days: days,
      summary: {
        total_intakes: totalIntakes,
        total_dogs: totalDogs,
        total_cats: totalCats,
        total_other: totalOther,
        avg_per_day: Math.round((totalIntakes / days) * 10) / 10,
        peak_day: series.reduce((a, b) => b.total > a.total ? b : a, series[0]).date,
        max_total: maxTotal,
      },
      series,
    });
  } catch (e) {
    console.error('intake-timeline error', e);
    res.status(500).json({ error: 'Failed to generate intake timeline' });
  }
});

// ============================================================
// NON-VIZ 1: Adoption Contract PDF (returns PDF stream)
// POST /api/custom-views/adoption-contract
// body: { adopter_name, animal_name, species, breed, adoption_date, fee }
// Returns: application/pdf
// ============================================================
router.post('/adoption-contract', (req, res) => {
  try {
    const {
      adopter_name = 'Jane Doe',
      adopter_email = 'jane@example.com',
      adopter_phone = '555-0100',
      adopter_address = '123 Main St, Springfield',
      animal_name = 'Bella',
      animal_id = 'A-1042',
      species = 'Dog',
      breed = 'Mixed',
      age = '3 years',
      sex = 'Female',
      adoption_date = new Date().toISOString().slice(0, 10),
      fee = 175,
      microchip = 'MC-9817224',
      vaccinations = 'DHPP, Rabies, Bordetella',
      spay_neuter = 'Spayed',
    } = req.body || {};

    // Build a minimal valid PDF (PDF 1.4) with one page of text.
    // Escape parens for PDF text strings.
    const esc = (s) => String(s).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');

    const lines = [
      'ANIMAL SHELTER & RESCUE - ADOPTION CONTRACT',
      '',
      `Contract Date: ${esc(adoption_date)}`,
      `Contract ID: AC-${Date.now().toString(36).toUpperCase()}`,
      '',
      'ADOPTER INFORMATION',
      `Name: ${esc(adopter_name)}`,
      `Email: ${esc(adopter_email)}`,
      `Phone: ${esc(adopter_phone)}`,
      `Address: ${esc(adopter_address)}`,
      '',
      'ANIMAL INFORMATION',
      `Animal ID: ${esc(animal_id)}`,
      `Name: ${esc(animal_name)}`,
      `Species: ${esc(species)}`,
      `Breed: ${esc(breed)}`,
      `Age: ${esc(age)}    Sex: ${esc(sex)}`,
      `Microchip #: ${esc(microchip)}`,
      `Vaccinations: ${esc(vaccinations)}`,
      `Spay/Neuter: ${esc(spay_neuter)}`,
      '',
      'TERMS & CONDITIONS',
      '1. Adopter agrees to provide humane care, food, water, shelter.',
      '2. Adopter will keep current vaccinations and licensing.',
      '3. Animal will not be used for fighting, breeding, or research.',
      '4. Adopter agrees to return the animal to the shelter if unable',
      '   to keep, rather than rehome or surrender elsewhere.',
      '5. Microchip registration will be transferred to the adopter.',
      '',
      `Adoption Fee: $${esc(fee)}`,
      '',
      'Signatures',
      'Adopter: ____________________________  Date: __________',
      'Shelter: ____________________________  Date: __________',
    ];

    // Construct PDF content stream
    let content = 'BT\n/F1 11 Tf\n50 780 Td\n14 TL\n';
    lines.forEach((line, i) => {
      if (i === 0) {
        content += `/F1 14 Tf\n(${line}) Tj\nT*\n/F1 11 Tf\n`;
      } else {
        content += `(${line}) Tj\nT*\n`;
      }
    });
    content += 'ET';

    const objects = [];
    objects.push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');
    objects.push('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');
    objects.push('3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n');
    objects.push(`4 0 obj\n<< /Length ${Buffer.byteLength(content, 'binary')} >>\nstream\n${content}\nendstream\nendobj\n`);
    objects.push('5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n');

    let pdf = '%PDF-1.4\n';
    const offsets = [0];
    objects.forEach((obj) => {
      offsets.push(Buffer.byteLength(pdf, 'binary'));
      pdf += obj;
    });
    const xrefOffset = Buffer.byteLength(pdf, 'binary');
    pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    for (let i = 1; i <= objects.length; i++) {
      pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
    }
    pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

    const buf = Buffer.from(pdf, 'binary');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="adoption_contract_${(animal_id || 'animal').toString().replace(/[^a-z0-9-]/gi, '_')}.pdf"`);
    res.setHeader('Content-Length', buf.length);
    res.end(buf);
  } catch (e) {
    console.error('adoption-contract error', e);
    res.status(500).json({ error: 'Failed to generate contract' });
  }
});

// ============================================================
// NON-VIZ 2: Foster Assignment Scheduler
// POST /api/custom-views/foster-schedule
// body: { weeks?: number, focus?: 'puppies'|'seniors'|'medical'|'all' }
// Returns proposed assignments matching animals -> foster homes with notes
// ============================================================
router.post('/foster-schedule', (req, res) => {
  try {
    const { weeks = 2, focus = 'all' } = req.body || {};
    const rand = seedRand(7);

    const animals = [
      { id: 'A-1001', name: 'Pippin', species: 'Dog', age_months: 3, needs: 'puppies', medical: false },
      { id: 'A-1002', name: 'Maple', species: 'Cat', age_months: 4, needs: 'puppies', medical: false },
      { id: 'A-1003', name: 'Rusty', species: 'Dog', age_months: 108, needs: 'seniors', medical: true },
      { id: 'A-1004', name: 'Luna', species: 'Cat', age_months: 132, needs: 'seniors', medical: false },
      { id: 'A-1005', name: 'Bandit', species: 'Dog', age_months: 24, needs: 'medical', medical: true },
      { id: 'A-1006', name: 'Sage', species: 'Cat', age_months: 36, needs: 'medical', medical: true },
      { id: 'A-1007', name: 'Cooper', species: 'Dog', age_months: 18, needs: 'general', medical: false },
      { id: 'A-1008', name: 'Willow', species: 'Cat', age_months: 12, needs: 'general', medical: false },
      { id: 'A-1009', name: 'Otis', species: 'Dog', age_months: 96, needs: 'seniors', medical: true },
      { id: 'A-1010', name: 'Clover', species: 'Cat', age_months: 5, needs: 'puppies', medical: false },
    ];

    const fosters = [
      { id: 'F-201', name: 'Sarah Chen', capacity: 2, experience: ['puppies', 'general'], has_kids: true, has_other_pets: true },
      { id: 'F-202', name: 'Marcus Wright', capacity: 1, experience: ['medical', 'general'], has_kids: false, has_other_pets: false },
      { id: 'F-203', name: 'Diana Patel', capacity: 3, experience: ['seniors', 'general', 'medical'], has_kids: false, has_other_pets: true },
      { id: 'F-204', name: 'Ben Torres', capacity: 2, experience: ['puppies', 'seniors'], has_kids: true, has_other_pets: false },
      { id: 'F-205', name: 'Lina Park', capacity: 1, experience: ['medical'], has_kids: false, has_other_pets: false },
    ];

    const filtered = focus === 'all' ? animals : animals.filter(a => a.needs === focus);

    // Greedy match - score by experience match + capacity
    const capacityLeft = Object.fromEntries(fosters.map(f => [f.id, f.capacity]));
    const assignments = [];
    const unmatched = [];

    filtered.forEach((a) => {
      const candidates = fosters
        .filter(f => capacityLeft[f.id] > 0)
        .map((f) => {
          let score = 0;
          if (f.experience.includes(a.needs)) score += 50;
          if (a.medical && f.experience.includes('medical')) score += 25;
          if (a.species === 'Dog' && !f.has_other_pets) score += 5;
          score += Math.floor(rand() * 10);
          return { foster: f, score };
        })
        .sort((x, y) => y.score - x.score);

      if (candidates.length === 0) {
        unmatched.push({ animal: a, reason: 'no foster capacity' });
        return;
      }
      const best = candidates[0];
      capacityLeft[best.foster.id] -= 1;

      const start = new Date();
      start.setDate(start.getDate() + Math.floor(rand() * 3));
      const end = new Date(start);
      end.setDate(start.getDate() + weeks * 7);

      assignments.push({
        animal_id: a.id,
        animal_name: a.name,
        species: a.species,
        needs: a.needs,
        foster_id: best.foster.id,
        foster_name: best.foster.name,
        match_score: best.score,
        start_date: start.toISOString().slice(0, 10),
        end_date: end.toISOString().slice(0, 10),
        notes: a.medical
          ? 'Requires daily medication; foster trained in med admin.'
          : (a.needs === 'puppies' ? 'Socialization-focused placement.' : 'Standard foster placement.'),
      });
    });

    res.json({
      generated_at: new Date().toISOString(),
      weeks,
      focus,
      summary: {
        total_animals: filtered.length,
        assigned: assignments.length,
        unmatched: unmatched.length,
        fosters_used: new Set(assignments.map(a => a.foster_id)).size,
        avg_score: assignments.length
          ? Math.round((assignments.reduce((s, a) => s + a.match_score, 0) / assignments.length) * 10) / 10
          : 0,
      },
      assignments,
      unmatched,
      fosters: fosters.map(f => ({
        ...f,
        remaining_capacity: capacityLeft[f.id],
      })),
    });
  } catch (e) {
    console.error('foster-schedule error', e);
    res.status(500).json({ error: 'Failed to generate foster schedule' });
  }
});

// ============================================================
// VIZ 3: Intake vs Outcome Trend Chart
// GET /api/custom-views/intake-vs-outcome?days=30
// Returns daily intakes vs outcomes (adoptions, transfers, RTO, euthanasia)
// ============================================================
router.get('/intake-vs-outcome', (req, res) => {
  try {
    const days = Math.min(parseInt(req.query.days) || 30, 90);
    const rand = seedRand(2024);
    const today = new Date();
    const series = [];
    let totalIn = 0;
    let totalOut = 0;
    let totalAdopt = 0;
    let totalTransfer = 0;
    let totalRTO = 0;
    let totalEuth = 0;
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const intakes = Math.round(5 + rand() * 10);
      const adoptions = Math.round(3 + rand() * 7);
      const transfers = Math.round(rand() * 3);
      const rto = Math.round(rand() * 2);
      const euthanasia = Math.round(rand() * 1.4);
      const outcomes = adoptions + transfers + rto + euthanasia;
      totalIn += intakes;
      totalOut += outcomes;
      totalAdopt += adoptions;
      totalTransfer += transfers;
      totalRTO += rto;
      totalEuth += euthanasia;
      series.push({
        date: d.toISOString().slice(0, 10),
        intakes,
        outcomes,
        adoptions,
        transfers,
        returns_to_owner: rto,
        euthanasia,
        net: intakes - outcomes,
      });
    }
    const maxVal = Math.max(...series.flatMap(s => [s.intakes, s.outcomes]));
    res.json({
      generated_at: new Date().toISOString(),
      window_days: days,
      summary: {
        total_intakes: totalIn,
        total_outcomes: totalOut,
        net_population_change: totalIn - totalOut,
        adoptions: totalAdopt,
        transfers: totalTransfer,
        returns_to_owner: totalRTO,
        euthanasia: totalEuth,
        live_release_rate: totalOut > 0 ? Math.round(((totalAdopt + totalTransfer + totalRTO) / totalOut) * 1000) / 10 : 0,
        max_value: maxVal,
      },
      series,
    });
  } catch (e) {
    console.error('intake-vs-outcome error', e);
    res.status(500).json({ error: 'Failed to generate intake vs outcome' });
  }
});

// ============================================================
// VIZ 4: Kennel Occupancy Heatmap
// GET /api/custom-views/occupancy-heatmap?weeks=8
// Returns occupancy intensity (0-100) per building over past N weeks
// ============================================================
router.get('/occupancy-heatmap', (req, res) => {
  try {
    const weeks = Math.min(parseInt(req.query.weeks) || 8, 26);
    const rand = seedRand(7777);
    const buildings = ['Main Hall', 'East Wing', 'Cattery', 'Iso Block', 'Puppy Pod'];
    const today = new Date();
    const weekLabels = [];
    for (let w = weeks - 1; w >= 0; w--) {
      const d = new Date(today);
      d.setDate(today.getDate() - w * 7);
      weekLabels.push(`W${weeks - w} (${d.toISOString().slice(5, 10)})`);
    }
    const matrix = buildings.map((b, bi) => {
      const values = [];
      for (let w = 0; w < weeks; w++) {
        // Base occupancy with building bias + seasonal cycle
        const base = 55 + (bi * 4);
        const seasonal = Math.sin((w / weeks) * Math.PI * 2) * 12;
        const noise = (rand() - 0.5) * 18;
        const v = Math.max(15, Math.min(100, Math.round(base + seasonal + noise)));
        values.push(v);
      }
      return {
        building: b,
        values,
        avg: Math.round(values.reduce((a, c) => a + c, 0) / values.length),
        peak: Math.max(...values),
        low: Math.min(...values),
      };
    });
    const allValues = matrix.flatMap(m => m.values);
    res.json({
      generated_at: new Date().toISOString(),
      weeks,
      week_labels: weekLabels,
      buildings: matrix.map(m => m.building),
      matrix,
      summary: {
        avg_occupancy: Math.round(allValues.reduce((a, c) => a + c, 0) / allValues.length),
        peak_overall: Math.max(...allValues),
        low_overall: Math.min(...allValues),
        hottest_building: matrix.reduce((a, b) => b.avg > a.avg ? b : a).building,
        coolest_building: matrix.reduce((a, b) => b.avg < a.avg ? b : a).building,
      },
    });
  } catch (e) {
    console.error('occupancy-heatmap error', e);
    res.status(500).json({ error: 'Failed to generate occupancy heatmap' });
  }
});

// ============================================================
// NON-VIZ 3: Adoption Report PDF
// POST /api/custom-views/adoption-report
// body: { period_start, period_end, shelter_name? }
// Returns: application/pdf summary of adoption metrics
// ============================================================
router.post('/adoption-report', (req, res) => {
  try {
    const {
      period_start = '2026-01-01',
      period_end = new Date().toISOString().slice(0, 10),
      shelter_name = 'Paws & Hearts Animal Shelter',
      prepared_by = 'Shelter Admin',
    } = req.body || {};

    const rand = seedRand(5150);
    const totalAdoptions = 120 + Math.floor(rand() * 80);
    const dogAdoptions = Math.floor(totalAdoptions * (0.55 + rand() * 0.1));
    const catAdoptions = Math.floor(totalAdoptions * 0.4);
    const otherAdoptions = totalAdoptions - dogAdoptions - catAdoptions;
    const totalFees = totalAdoptions * (125 + Math.floor(rand() * 100));
    const avgDaysToAdoption = 14 + Math.floor(rand() * 18);
    const returnRate = (3 + rand() * 5).toFixed(1);
    const liveReleaseRate = (88 + rand() * 10).toFixed(1);

    const esc = (s) => String(s).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');

    const lines = [
      'ADOPTION OUTCOMES REPORT',
      '',
      `Shelter: ${esc(shelter_name)}`,
      `Report Period: ${esc(period_start)} to ${esc(period_end)}`,
      `Prepared By: ${esc(prepared_by)}`,
      `Generated: ${new Date().toISOString().slice(0, 10)}`,
      '',
      'EXECUTIVE SUMMARY',
      `Total Adoptions: ${totalAdoptions}`,
      `Dogs Adopted: ${dogAdoptions}`,
      `Cats Adopted: ${catAdoptions}`,
      `Other Species Adopted: ${otherAdoptions}`,
      '',
      'KEY METRICS',
      `Total Adoption Fees Collected: $${totalFees.toLocaleString()}`,
      `Average Days to Adoption: ${avgDaysToAdoption} days`,
      `Adoption Return Rate: ${returnRate}%`,
      `Live Release Rate: ${liveReleaseRate}%`,
      '',
      'TOP ADOPTION DRIVERS',
      '1. Weekend adoption events (32% of adoptions)',
      '2. Social media campaigns (24% of adoptions)',
      '3. Walk-in visitors (28% of adoptions)',
      '4. Foster-to-adopt program (16% of adoptions)',
      '',
      'RECOMMENDATIONS',
      '- Expand foster-to-adopt outreach in Q3.',
      '- Schedule additional pop-up adoption events.',
      '- Investigate causes of 5-7 day kennel stay outliers.',
      '- Continue partnerships with breed-specific rescues.',
      '',
      `End of report. Document ID: AR-${Date.now().toString(36).toUpperCase()}`,
    ];

    let content = 'BT\n/F1 11 Tf\n50 780 Td\n14 TL\n';
    lines.forEach((line, i) => {
      if (i === 0) {
        content += `/F1 14 Tf\n(${line}) Tj\nT*\n/F1 11 Tf\n`;
      } else {
        content += `(${line}) Tj\nT*\n`;
      }
    });
    content += 'ET';

    const objects = [];
    objects.push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');
    objects.push('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');
    objects.push('3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n');
    objects.push(`4 0 obj\n<< /Length ${Buffer.byteLength(content, 'binary')} >>\nstream\n${content}\nendstream\nendobj\n`);
    objects.push('5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n');

    let pdf = '%PDF-1.4\n';
    const offsets = [0];
    objects.forEach((obj) => {
      offsets.push(Buffer.byteLength(pdf, 'binary'));
      pdf += obj;
    });
    const xrefOffset = Buffer.byteLength(pdf, 'binary');
    pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    for (let i = 1; i <= objects.length; i++) {
      pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
    }
    pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

    const buf = Buffer.from(pdf, 'binary');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="adoption_report_${period_start}_${period_end}.pdf"`);
    res.setHeader('Content-Length', buf.length);
    res.end(buf);
  } catch (e) {
    console.error('adoption-report error', e);
    res.status(500).json({ error: 'Failed to generate adoption report' });
  }
});

// ============================================================
// NON-VIZ 4: Intake Form Template Editor (CRUD, in-memory)
// GET    /api/custom-views/intake-templates
// POST   /api/custom-views/intake-templates
// PUT    /api/custom-views/intake-templates/:id
// DELETE /api/custom-views/intake-templates/:id
// ============================================================
const intakeTemplates = [
  {
    id: 'tpl-stray-dog',
    name: 'Stray Dog Intake',
    intake_type: 'stray',
    species: 'dog',
    fields: [
      { key: 'found_location', label: 'Found Location', type: 'text', required: true },
      { key: 'found_date', label: 'Found Date', type: 'date', required: true },
      { key: 'finder_name', label: 'Finder Name', type: 'text', required: false },
      { key: 'finder_contact', label: 'Finder Contact', type: 'text', required: false },
      { key: 'estimated_age', label: 'Estimated Age', type: 'text', required: false },
      { key: 'condition_notes', label: 'Initial Condition', type: 'textarea', required: true },
      { key: 'microchip_scanned', label: 'Microchip Scanned', type: 'boolean', required: true },
    ],
    notes: 'Standard intake form for stray dogs picked up by animal control or walk-ins.',
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'tpl-owner-surrender-cat',
    name: 'Owner Surrender Cat',
    intake_type: 'owner_surrender',
    species: 'cat',
    fields: [
      { key: 'owner_name', label: 'Owner Name', type: 'text', required: true },
      { key: 'owner_address', label: 'Owner Address', type: 'textarea', required: true },
      { key: 'reason_for_surrender', label: 'Reason for Surrender', type: 'textarea', required: true },
      { key: 'vet_history', label: 'Vet History Available', type: 'boolean', required: true },
      { key: 'litterbox_trained', label: 'Litterbox Trained', type: 'boolean', required: false },
      { key: 'good_with_kids', label: 'Good with Kids', type: 'boolean', required: false },
      { key: 'surrender_fee', label: 'Surrender Fee Paid', type: 'number', required: false },
    ],
    notes: 'Required for all owner-surrender cat intakes.',
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

router.get('/intake-templates', (req, res) => {
  res.json({ templates: intakeTemplates, count: intakeTemplates.length });
});

router.post('/intake-templates', (req, res) => {
  try {
    const body = req.body || {};
    if (!body.name) return res.status(400).json({ error: 'name is required' });
    const tpl = {
      id: body.id || `tpl-${Date.now().toString(36)}`,
      name: body.name,
      intake_type: body.intake_type || 'stray',
      species: body.species || 'dog',
      fields: Array.isArray(body.fields) ? body.fields : [],
      notes: body.notes || '',
      active: body.active !== false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    intakeTemplates.push(tpl);
    res.status(201).json(tpl);
  } catch (e) {
    res.status(500).json({ error: 'Failed to create template' });
  }
});

router.put('/intake-templates/:id', (req, res) => {
  const idx = intakeTemplates.findIndex(t => t.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Template not found' });
  const body = req.body || {};
  intakeTemplates[idx] = {
    ...intakeTemplates[idx],
    ...body,
    id: intakeTemplates[idx].id,
    created_at: intakeTemplates[idx].created_at,
    updated_at: new Date().toISOString(),
  };
  res.json(intakeTemplates[idx]);
});

router.delete('/intake-templates/:id', (req, res) => {
  const idx = intakeTemplates.findIndex(t => t.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Template not found' });
  const [removed] = intakeTemplates.splice(idx, 1);
  res.json({ deleted: true, id: removed.id });
});

module.exports = router;
