import { useState, useEffect } from 'react';
import { Sparkles, Heart, Brain, Stethoscope, Share2, Users, DollarSign, Search } from 'lucide-react';
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
        setAnimals(Array.isArray(animalsRes.data) ? animalsRes.data : []);
        setAssessments(Array.isArray(assessmentsRes.data) ? assessmentsRes.data : []);
        setApplications(Array.isArray(applicationsRes.data) ? applicationsRes.data : []);
        setPlacements(Array.isArray(placementsRes.data) ? placementsRes.data : []);
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
              <button className="btn btn-primary" disabled={!matchApplicationId || matchLoading} onClick={() => callAI('/ai/match-animal', { applicationId: matchApplicationId }, setMatchResult, setMatchLoading)}>
                <Sparkles size={14} /> Find Matches
              </button>
            </div>
            <AIOutput title="Animal Matches" content={matchResult} isLoading={matchLoading} onRegenerate={() => callAI('/ai/match-animal', { applicationId: matchApplicationId }, setMatchResult, setMatchLoading)} />
          </div>
        </div>
      </div>
    </div>
  );
}
