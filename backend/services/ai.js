const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
const fetch = require('node-fetch');

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5';

async function callOpenRouter(systemPrompt, userPrompt) {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'http://localhost:3001',
        'X-Title': 'AI Animal Shelter Manager',
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 1500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('OpenRouter API call failed:', error.message);
    throw error;
  }
}

async function generateAdoptionListing(animal) {
  const systemPrompt = `You are an expert animal shelter copywriter. Create beautiful, compelling adoption listings that highlight each animal's personality and help them find their forever home. Include a catchy headline, a heartwarming description, key details, and a call to action. Format with sections and use warm, engaging language.`;

  const userPrompt = `Create an adoption listing for this animal:
Name: ${animal.name}
Species: ${animal.species}
Breed: ${animal.breed}
Age: ${animal.age_years} years, ${animal.age_months} months
Weight: ${animal.weight} lbs
Color: ${animal.color}
Sex: ${animal.sex}
Description: ${animal.description}
Status: ${animal.status}`;

  return callOpenRouter(systemPrompt, userPrompt);
}

async function analyzeBehavior(assessment) {
  const systemPrompt = `You are a certified animal behaviorist. Analyze the behavioral assessment data and provide professional insights, recommendations for the animal's care, ideal home environment, and any training suggestions. Be specific and actionable in your recommendations.`;

  const userPrompt = `Analyze this behavioral assessment:
Animal: ${assessment.animal_name || 'Unknown'}
Assessor: ${assessment.assessor}
Assessment Date: ${assessment.assessment_date}
Aggression Level: ${assessment.aggression_level}/5
Fear Level: ${assessment.fear_level}/5
Sociability Level: ${assessment.sociability_level}/5
Energy Level: ${assessment.energy_level}/5
Trainability Level: ${assessment.trainability_level}/5
Good with Kids: ${assessment.good_with_kids}
Good with Dogs: ${assessment.good_with_dogs}
Good with Cats: ${assessment.good_with_cats}
Bite History: ${assessment.bite_history}
Bite Details: ${assessment.bite_details || 'None'}
Notes: ${assessment.notes}
Overall Rating: ${assessment.overall_rating}`;

  return callOpenRouter(systemPrompt, userPrompt);
}

async function summarizeMedicalRecords(records) {
  const systemPrompt = `You are a veterinary medical records specialist. Summarize the animal's medical history in a clear, organized format. Highlight important findings, ongoing treatments, upcoming due dates, and any concerns. Use medical terminology appropriately but keep it understandable for shelter staff.`;

  const recordsText = records.map(r =>
    `- ${r.record_date}: ${r.record_type} - ${r.description} (Vet: ${r.veterinarian})${r.next_due_date ? ` [Next due: ${r.next_due_date}]` : ''}${r.notes ? ` Notes: ${r.notes}` : ''}`
  ).join('\n');

  const userPrompt = `Summarize these medical records:\n${recordsText}`;

  return callOpenRouter(systemPrompt, userPrompt);
}

async function generateSocialMediaPost(animal) {
  const systemPrompt = `You are a social media manager for an animal shelter. Create engaging, shareable social media posts that will help animals get adopted. Include relevant hashtags, emojis, and a compelling narrative. The post should work well on Instagram, Facebook, and Twitter. Keep it concise but impactful.`;

  const userPrompt = `Create a social media post for this adoptable animal:
Name: ${animal.name}
Species: ${animal.species}
Breed: ${animal.breed}
Age: ${animal.age_years} years, ${animal.age_months} months
Color: ${animal.color}
Sex: ${animal.sex}
Description: ${animal.description}`;

  return callOpenRouter(systemPrompt, userPrompt);
}

async function generateFosterCommunication(placement, type) {
  const systemPrompt = `You are a foster program coordinator at an animal shelter. Draft professional, warm communications for foster families. Be supportive, clear about expectations, and provide helpful information. Types include: welcome (new placement), update_request, thank_you, return_notice, and medical_alert.`;

  const userPrompt = `Draft a "${type}" communication for this foster placement:
Animal Name: ${placement.animal_name || 'the foster animal'}
Foster Parent: ${placement.foster_name}
Start Date: ${placement.start_date}
End Date: ${placement.end_date || 'TBD'}
Status: ${placement.status}
Notes: ${placement.notes || 'None'}`;

  return callOpenRouter(systemPrompt, userPrompt);
}

async function generateDonationAppeal(campaign, stats) {
  const systemPrompt = `You are a nonprofit fundraising specialist for an animal shelter. Create compelling donation appeal letters that inspire generosity. Include emotional storytelling, specific impact examples, and clear calls to action. Make donors feel their contribution matters.`;

  const userPrompt = `Create a donation appeal for the "${campaign}" campaign.
Statistics:
- Total animals helped this year: ${stats.totalAnimals || 'N/A'}
- Adoption rate: ${stats.adoptionRate || 'N/A'}
- Current funding goal: ${stats.fundingGoal || 'N/A'}
- Amount raised so far: ${stats.amountRaised || 'N/A'}
- Number of donors: ${stats.donorCount || 'N/A'}
Additional context: ${stats.context || 'General appeal'}`;

  return callOpenRouter(systemPrompt, userPrompt);
}

async function matchAnimalToAdopter(application, animals) {
  const systemPrompt = `You are an expert adoption counselor at an animal shelter. Based on the applicant's preferences, lifestyle, and experience, recommend the best matching animals from the available list. Explain why each animal would be a good match. Rank your top 3 recommendations.`;

  const animalsText = animals.map(a =>
    `- ${a.name} (${a.species}, ${a.breed}, ${a.age_years}y${a.age_months}m, ${a.weight}lbs, ${a.sex}, ${a.color}): ${a.description}`
  ).join('\n');

  const userPrompt = `Match animals to this adopter:
Applicant: ${application.applicant_name}
Housing: ${application.housing_type}
Has Yard: ${application.has_yard}
Has Other Pets: ${application.has_other_pets} ${application.other_pets_details ? `(${application.other_pets_details})` : ''}
Has Children: ${application.has_children} ${application.children_ages ? `(Ages: ${application.children_ages})` : ''}
Experience: ${application.experience}
Preferred Species: ${application.preferred_species}
Preferred Breed: ${application.preferred_breed}
Preferred Age: ${application.preferred_age}
Preferred Size: ${application.preferred_size}
Reason: ${application.reason}

Available Animals:
${animalsText}`;

  return callOpenRouter(systemPrompt, userPrompt);
}

module.exports = {
  callOpenRouter,
  generateAdoptionListing,
  analyzeBehavior,
  summarizeMedicalRecords,
  generateSocialMediaPost,
  generateFosterCommunication,
  generateDonationAppeal,
  matchAnimalToAdopter,
};
