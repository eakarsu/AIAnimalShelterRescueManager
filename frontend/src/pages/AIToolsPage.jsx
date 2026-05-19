import { useState, useEffect } from 'react';
import { Sparkles, Heart, Brain, Stethoscope, Share2, Users, DollarSign, Search, Tag, AlertTriangle } from 'lucide-react';
import api from '../api';
import AIOutput from '../components/AIOutput';
import FormField from '../components/FormField';

export default function AIToolsPage() {
  const [animals, setAnimals] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [applications, setApplications] = useState([]);
  const [placements, setPlacements] = useState([]);

  // State for each AI tool
  const [adoptionAnimalId, setAdoptionAnimalId] = useState('');
  const [adoptionResult, setAdoptionResult] = useState(null);
  const [adoptionLoading, setAdoptionLoading] = useState(false);

  const [behaviorAssessmentId, setBehaviorAssessmentId] = useState('');
  const [behaviorResult, setBehaviorResult] = useState(null);
  const [behaviorLoading, setBehaviorLoading] = useState(false);

  const [medicalAnimalId, setMedicalAnimalId] = useState('');
  const [medicalResult, setMedicalResult] = useState(null);
  const [medicalLoading, setMedicalLoading] = useState(false);

  const [socialAnimalId, setSocialAnimalId] = useState('');
  const [socialResult, setSocialResult] = useState(null);
  const [socialLoading, setSocialLoading] = useState(false);

  const [fosterPlacementId, setFosterPlacementId] = useState('');
  const [fosterCommType, setFosterCommType] = useState('welcome');
  const [fosterResult, setFosterResult] = useState(null);
  const [fosterLoading, setFosterLoading] = useState(false);

  const [donationCampaign, setDonationCampaign] = useState('');
  const [donationResult, setDonationResult] = useState(null);
  const [donationLoading, setDonationLoading] = useState(false);

  const [matchApplicationId, setMatchApplicationId] = useState('');
  const [matchResult, setMatchResult] = useState(null);
  const [matchLoading, setMatchLoading] = useState(false);

  const [compatNewAnimalId, setCompatNewAnimalId] = useState('');
  const [compatExistingIds, setCompatExistingIds] = useState('');
  const [compatResult, setCompatResult] = useState(null);
  const [compatLoading, setCompatLoading] = useState(false);

  // 9. Breed ID from description
  const [breedDescription, setBreedDescription] = useState('');
  const [breedSpecies, setBreedSpecies] = useState('');
  const [breedColor, setBreedColor] = useState('');
  const [breedWeight, setBreedWeight] = useState('');
  const [breedAge, setBreedAge] = useState('');
  const [breedTraits, setBreedTraits] = useState('');
  const [breedResult, setBreedResult] = useState(null);
  const [breedLoading, setBreedLoading] = useState(false);

  // 10. Return risk prediction
  const [returnAnimalId, setReturnAnimalId] = useState('');
  const [returnAdopterProfile, setReturnAdopterProfile] = useState('');
  const [returnResult, setReturnResult] = useState(null);
  const [returnLoading, setReturnLoading] = useState(false);

  useEffect(() => {
    // Fetch reference data for dropdowns
    const fetchData = async () => {
      try {
        const [animalsRes, assessmentsRes, applicationsRes, placementsRes] = await Promise.all([
          api.get('/animals'),
          api.get('/behavioral'),
          api.get('/adoptions/applications'),
          api.get('/fosters/placements'),
        ]);
        const extractData = (res) => {
          const d = res.data;
          return Array.isArray(d) ? d : (Array.isArray(d?.data) ? d.data : []);
        };
        setAnimals(extractData(animalsRes));
        setAssessments(extractData(assessmentsRes));
        setApplications(extractData(applicationsRes));
        setPlacements(extractData(placementsRes));
      } catch (err) { console.error(err); }
    };
    fetchData();
  }, []);

  const callAI = async (endpoint, body, setResult, setLoading) => {
    setLoading(true);
    setResult(null);
    try {
      const res = await api.post(endpoint, body);
      setResult(res.data.content || res.data.result || res.data);
    } catch (err) {
      setResult('Error: ' + (err.response?.data?.error || 'AI request failed'));
    } finally {
      setLoading(false);
    }
  };

  const animalOptions = animals.map(a => ({ value: a.id, label: `${a.name} (${a.species} - ${a.breed || 'Unknown'})` }));
  const assessmentOptions = assessments.map(a => ({ value: a.id, label: `Assessment #${a.id} - Animal #${a.animal_id}` }));
  const applicationOptions = applications.map(a => ({ value: a.id, label: `${a.applicant_name} - ${a.preferred_species || 'Any'}` }));
  const placementOptions = placements.map(p => ({ value: p.id, label: `Placement #${p.id} - Animal #${p.animal_id}` }));

  return (
    <div>
      <div className="page-header">
        <h2><Sparkles size={24} /> AI Tools</h2>
      </div>

      <div className="ai-tools-grid">
        {/* 1. Adoption Listing Generator */}
        <div className="ai-tool-card">
          <div className="ai-tool-card-header">
            <div className="ai-tool-icon" style={{ background: '#fdf2f8' }}>
              <Heart size={22} color="#ec4899" />
            </div>
            <div>
              <h3>Adoption Listing Generator</h3>
              <p>Generate a compelling adoption listing for an animal</p>
            </div>
          </div>
          <div className="ai-tool-card-body">
            <div className="ai-tool-controls">
              <FormField label="Select Animal" name="adoptionAnimal" type="select" value={adoptionAnimalId} onChange={(_, v) => setAdoptionAnimalId(v)} options={animalOptions} placeholder="Choose an animal..." />
              <button className="btn btn-primary" disabled={!adoptionAnimalId || adoptionLoading} onClick={() => callAI('/ai/adoption-listing', { animalId: adoptionAnimalId }, setAdoptionResult, setAdoptionLoading)}>
                <Sparkles size={14} /> Generate
              </button>
            </div>
            <AIOutput title="Adoption Listing" content={adoptionResult} isLoading={adoptionLoading} onRegenerate={() => callAI('/ai/adoption-listing', { animalId: adoptionAnimalId }, setAdoptionResult, setAdoptionLoading)} />
          </div>
        </div>

        {/* 2. Behavior Analysis */}
        <div className="ai-tool-card">
          <div className="ai-tool-card-header">
            <div className="ai-tool-icon" style={{ background: '#f5f3ff' }}>
              <Brain size={22} color="#7c3aed" />
            </div>
            <div>
              <h3>Behavioral Assessment Analysis</h3>
              <p>AI analysis of behavioral assessment with recommendations</p>
            </div>
          </div>
          <div className="ai-tool-card-body">
            <div className="ai-tool-controls">
              <FormField label="Select Assessment" name="behaviorAssessment" type="select" value={behaviorAssessmentId} onChange={(_, v) => setBehaviorAssessmentId(v)} options={assessmentOptions} placeholder="Choose an assessment..." />
              <button className="btn btn-primary" disabled={!behaviorAssessmentId || behaviorLoading} onClick={() => callAI('/ai/behavior-analysis', { assessmentId: behaviorAssessmentId }, setBehaviorResult, setBehaviorLoading)}>
                <Sparkles size={14} /> Analyze
              </button>
            </div>
            <AIOutput title="Behavior Analysis" content={behaviorResult} isLoading={behaviorLoading} onRegenerate={() => callAI('/ai/behavior-analysis', { assessmentId: behaviorAssessmentId }, setBehaviorResult, setBehaviorLoading)} />
          </div>
        </div>

        {/* 3. Medical Summary */}
        <div className="ai-tool-card">
          <div className="ai-tool-card-header">
            <div className="ai-tool-icon" style={{ background: '#fef2f2' }}>
              <Stethoscope size={22} color="#dc2626" />
            </div>
            <div>
              <h3>Medical Record Summary</h3>
              <p>Summarize an animal's complete medical history</p>
            </div>
          </div>
          <div className="ai-tool-card-body">
            <div className="ai-tool-controls">
              <FormField label="Select Animal" name="medicalAnimal" type="select" value={medicalAnimalId} onChange={(_, v) => setMedicalAnimalId(v)} options={animalOptions} placeholder="Choose an animal..." />
              <button className="btn btn-primary" disabled={!medicalAnimalId || medicalLoading} onClick={() => callAI('/ai/medical-summary', { animalId: medicalAnimalId }, setMedicalResult, setMedicalLoading)}>
                <Sparkles size={14} /> Summarize
              </button>
            </div>
            <AIOutput title="Medical Summary" content={medicalResult} isLoading={medicalLoading} onRegenerate={() => callAI('/ai/medical-summary', { animalId: medicalAnimalId }, setMedicalResult, setMedicalLoading)} />
          </div>
        </div>

        {/* 4. Social Media Post */}
        <div className="ai-tool-card">
          <div className="ai-tool-card-header">
            <div className="ai-tool-icon" style={{ background: '#eff6ff' }}>
              <Share2 size={22} color="#2563eb" />
            </div>
            <div>
              <h3>Social Media Post Generator</h3>
              <p>Create engaging social media adoption campaign content</p>
            </div>
          </div>
          <div className="ai-tool-card-body">
            <div className="ai-tool-controls">
              <FormField label="Select Animal" name="socialAnimal" type="select" value={socialAnimalId} onChange={(_, v) => setSocialAnimalId(v)} options={animalOptions} placeholder="Choose an animal..." />
              <button className="btn btn-primary" disabled={!socialAnimalId || socialLoading} onClick={() => callAI('/ai/social-media', { animalId: socialAnimalId }, setSocialResult, setSocialLoading)}>
                <Sparkles size={14} /> Generate Post
              </button>
            </div>
            <AIOutput title="Social Media Post" content={socialResult} isLoading={socialLoading} onRegenerate={() => callAI('/ai/social-media', { animalId: socialAnimalId }, setSocialResult, setSocialLoading)} />
          </div>
        </div>

        {/* 5. Foster Communication */}
        <div className="ai-tool-card">
          <div className="ai-tool-card-header">
            <div className="ai-tool-icon" style={{ background: '#f0fdfa' }}>
              <Users size={22} color="#0d9488" />
            </div>
            <div>
              <h3>Foster Communication Drafter</h3>
              <p>Draft communications between foster families and adopters</p>
            </div>
          </div>
          <div className="ai-tool-card-body">
            <div className="ai-tool-controls">
              <FormField label="Select Placement" name="fosterPlacement" type="select" value={fosterPlacementId} onChange={(_, v) => setFosterPlacementId(v)} options={placementOptions} placeholder="Choose a placement..." />
              <FormField label="Communication Type" name="fosterCommType" type="select" value={fosterCommType} onChange={(_, v) => setFosterCommType(v)} options={[{value:'welcome',label:'Welcome Letter'},{value:'update',label:'Progress Update'},{value:'transition',label:'Transition to Adopter'},{value:'medical_update',label:'Medical Update'}]} />
              <button className="btn btn-primary" disabled={!fosterPlacementId || fosterLoading} onClick={() => callAI('/ai/foster-communication', { placementId: fosterPlacementId, type: fosterCommType }, setFosterResult, setFosterLoading)}>
                <Sparkles size={14} /> Draft
              </button>
            </div>
            <AIOutput title="Foster Communication" content={fosterResult} isLoading={fosterLoading} onRegenerate={() => callAI('/ai/foster-communication', { placementId: fosterPlacementId, type: fosterCommType }, setFosterResult, setFosterLoading)} />
          </div>
        </div>

        {/* 6. Donation Appeal */}
        <div className="ai-tool-card">
          <div className="ai-tool-card-header">
            <div className="ai-tool-icon" style={{ background: '#ecfdf5' }}>
              <DollarSign size={22} color="#10b981" />
            </div>
            <div>
              <h3>Donation Appeal Generator</h3>
              <p>Create compelling donation appeal letters for campaigns</p>
            </div>
          </div>
          <div className="ai-tool-card-body">
            <div className="ai-tool-controls">
              <FormField label="Campaign Name" name="donationCampaign" value={donationCampaign} onChange={(_, v) => setDonationCampaign(v)} placeholder="Enter campaign name..." />
              <button className="btn btn-primary" disabled={!donationCampaign || donationLoading} onClick={() => callAI('/ai/donation-appeal', { campaign: donationCampaign }, setDonationResult, setDonationLoading)}>
                <Sparkles size={14} /> Generate Appeal
              </button>
            </div>
            <AIOutput title="Donation Appeal" content={donationResult} isLoading={donationLoading} onRegenerate={() => callAI('/ai/donation-appeal', { campaign: donationCampaign }, setDonationResult, setDonationLoading)} />
          </div>
        </div>

        {/* 7. Animal Matcher */}
        <div className="ai-tool-card">
          <div className="ai-tool-card-header">
            <div className="ai-tool-icon" style={{ background: '#fef3c7' }}>
              <Search size={22} color="#d97706" />
            </div>
            <div>
              <h3>Animal Matcher</h3>
              <p>Match adopter preferences with available animals</p>
            </div>
          </div>
          <div className="ai-tool-card-body">
            <div className="ai-tool-controls">
              <FormField label="Select Application" name="matchApplication" type="select" value={matchApplicationId} onChange={(_, v) => setMatchApplicationId(v)} options={applicationOptions} placeholder="Choose an application..." />
              <button className="btn btn-primary" disabled={!matchApplicationId || matchLoading} onClick={() => callAI('/ai/match-animal', { applicationId: parseInt(matchApplicationId) }, setMatchResult, setMatchLoading)}>
                <Sparkles size={14} /> Find Matches
              </button>
            </div>
            <AIOutput title="Animal Matches" content={matchResult} isLoading={matchLoading} onRegenerate={() => callAI('/ai/match-animal', { applicationId: parseInt(matchApplicationId) }, setMatchResult, setMatchLoading)} />
          </div>
        </div>

        {/* 8. Behavioral Compatibility Checker */}
        <div className="ai-tool-card">
          <div className="ai-tool-card-header">
            <div className="ai-tool-icon" style={{ background: '#f0fdf4' }}>
              <Users size={22} color="#16a34a" />
            </div>
            <div>
              <h3>Compatibility Checker</h3>
              <p>Predict behavioral compatibility between animals</p>
            </div>
          </div>
          <div className="ai-tool-card-body">
            <div className="ai-tool-controls">
              <FormField
                label="New Animal"
                name="compatNewAnimal"
                type="select"
                value={compatNewAnimalId}
                onChange={(_, v) => setCompatNewAnimalId(v)}
                options={animalOptions}
                placeholder="Select new animal..."
              />
              <FormField
                label="Existing Animal IDs (comma-separated)"
                name="compatExistingIds"
                value={compatExistingIds}
                onChange={(_, v) => setCompatExistingIds(v)}
                placeholder="e.g. 1, 2, 3"
              />
              <button
                className="btn btn-primary"
                disabled={!compatNewAnimalId || !compatExistingIds || compatLoading}
                onClick={() => {
                  const existing = compatExistingIds.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n) && n > 0);
                  callAI(
                    '/ai/compatibility-check',
                    { new_animal_id: parseInt(compatNewAnimalId), existing_animal_ids: existing },
                    setCompatResult,
                    setCompatLoading
                  );
                }}
              >
                <Sparkles size={14} /> Check Compatibility
              </button>
            </div>
            <AIOutput title="Compatibility Assessment" content={compatResult} isLoading={compatLoading} />
          </div>
        </div>

        {/* 9. Breed Identification (text-based) */}
        <div className="ai-tool-card">
          <div className="ai-tool-card-header">
            <div className="ai-tool-icon" style={{ background: '#fff7ed' }}>
              <Tag size={22} color="#ea580c" />
            </div>
            <div>
              <h3>Breed Identification (Text)</h3>
              <p>Identify breed/mix and care needs from a written description (no photo needed)</p>
            </div>
          </div>
          <div className="ai-tool-card-body">
            <div className="ai-tool-controls">
              <FormField label="Description *" name="breedDescription" type="textarea" value={breedDescription} onChange={(_, v) => setBreedDescription(v)} placeholder="Brown short coat, ~30lbs, muscular build, floppy ears, active and friendly..." />
              <FormField label="Species" name="breedSpecies" value={breedSpecies} onChange={(_, v) => setBreedSpecies(v)} placeholder="dog, cat, etc." />
              <FormField label="Color" name="breedColor" value={breedColor} onChange={(_, v) => setBreedColor(v)} placeholder="brindle, tabby..." />
              <FormField label="Weight (lbs)" name="breedWeight" value={breedWeight} onChange={(_, v) => setBreedWeight(v)} placeholder="e.g. 28" />
              <FormField label="Age (years)" name="breedAge" value={breedAge} onChange={(_, v) => setBreedAge(v)} placeholder="e.g. 3" />
              <FormField label="Observed Traits" name="breedTraits" value={breedTraits} onChange={(_, v) => setBreedTraits(v)} placeholder="curly tail, blue eyes..." />
              <button
                className="btn btn-primary"
                disabled={!breedDescription || breedLoading}
                onClick={() => callAI('/ai/breed-id-from-description', {
                  description: breedDescription,
                  species: breedSpecies || undefined,
                  color: breedColor || undefined,
                  weight_lbs: breedWeight ? Number(breedWeight) : undefined,
                  age_years: breedAge ? Number(breedAge) : undefined,
                  observed_traits: breedTraits || undefined,
                }, setBreedResult, setBreedLoading)}
              >
                <Sparkles size={14} /> Identify Breed
              </button>
            </div>
            <AIOutput title="Breed Identification" content={breedResult} isLoading={breedLoading} />
          </div>
        </div>

        {/* 10. Return Risk Prediction */}
        <div className="ai-tool-card">
          <div className="ai-tool-card-header">
            <div className="ai-tool-icon" style={{ background: '#fef2f2' }}>
              <AlertTriangle size={22} color="#dc2626" />
            </div>
            <div>
              <h3>Adoption Return Risk</h3>
              <p>Predict return risk and get recommended pre/post-adoption support actions</p>
            </div>
          </div>
          <div className="ai-tool-card-body">
            <div className="ai-tool-controls">
              <FormField label="Select Animal" name="returnAnimal" type="select" value={returnAnimalId} onChange={(_, v) => setReturnAnimalId(v)} options={animalOptions} placeholder="Choose an animal..." />
              <FormField
                label="Adopter Profile (JSON)"
                name="returnAdopterProfile"
                type="textarea"
                value={returnAdopterProfile}
                onChange={(_, v) => setReturnAdopterProfile(v)}
                placeholder='{"household_size": 3, "has_children": true, "has_yard": true, "experience_level": "first_time", "hours_alone_per_day": 8, "other_pets": []}'
              />
              <button
                className="btn btn-primary"
                disabled={!returnAnimalId || !returnAdopterProfile || returnLoading}
                onClick={() => {
                  let parsed;
                  try { parsed = JSON.parse(returnAdopterProfile); } catch (e) {
                    setReturnResult('Error: Adopter Profile must be valid JSON');
                    return;
                  }
                  callAI('/ai/return-risk', { animalId: parseInt(returnAnimalId), adopterProfile: parsed }, setReturnResult, setReturnLoading);
                }}
              >
                <Sparkles size={14} /> Predict Risk
              </button>
            </div>
            <AIOutput title="Return Risk Assessment" content={returnResult} isLoading={returnLoading} />
          </div>
        </div>
      </div>
    </div>
  );
}
