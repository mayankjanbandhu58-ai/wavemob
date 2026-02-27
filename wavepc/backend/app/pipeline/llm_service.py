import json
import urllib.request
import logging
import time

logger = logging.getLogger("wavelength.llm")

def generate_ai_response_sync(prompt: str, system: str, model: str = "meditron:7b", max_retries=3) -> str:
    url = "http://localhost:11434/api/generate"
    data = {
        "model": model,
        "prompt": prompt,
        "stream": False,
        "system": system
    }
    
    payload = json.dumps(data).encode('utf-8')
    
    for attempt in range(max_retries):
        try:
            req = urllib.request.Request(url, data=payload)
            req.add_header('Content-Type', 'application/json')
            with urllib.request.urlopen(req, timeout=180) as response:
                result = json.loads(response.read().decode('utf-8'))
                return result.get("response", "").strip()
        except Exception as e:
            logger.error(f"Ollama generation failed (attempt {attempt+1}/{max_retries}): {e}")
            if attempt == max_retries - 1:
                return f"AI Summary is currently unavailable due to an error reaching the local model. Error: {str(e)}"
            time.sleep(2)

def generate_clinical_summary(prompt_context: str) -> str:
    """
    Step 7 - Full AI Radiology Report Generation.
    Enforces format: Patient Info, Technique, Findings, Impression, Differential, Severity, Follow-up, Recommendations.
    """
    system_prompt = (
        "You are Wavelength's Senior AI Radiologist. Synthesize a complete structured radiology report based on the provided findings.\n"
        "You MUST incorporate the patient's Symptoms and Smoking History (if provided) into your analysis and tailoring of recommendations.\n"
        "You must structure your response EXACTLY with the following headings (use Markdown bolding for headings):\n\n"
        "**Patient Info**\n"
        "[Summarize patient details, including symptoms and smoking history, or 'As provided' if missing]\n\n"
        "**Technique**\n"
        "[E.g. PA and Lateral view of Chest, AI-enhanced screening]\n\n"
        "**Findings**\n"
        "[Detailed anatomical description]\n\n"
        "**Impression**\n"
        "[Overall clinical impression]\n\n"
        "**Differential Diagnosis**\n"
        "[Potential differential diagnoses]\n\n"
        "**Severity Level**\n"
        "[Severity of findings]\n\n"
        "**Follow-up**\n"
        "[Suggested follow-up schedule]\n\n"
        "**Recommendations**\n"
        "[Clinical recommendations]"
    )
    return generate_ai_response_sync(prompt_context, system=system_prompt, model="meditron:7b")

def generate_patient_summary(prompt_context: str) -> str:
    """
    Step 7.2 - Patient-friendly AI Report Generation.
    Translates the dense medical findings into simple, accessible language.
    """
    system_prompt = (
        "You are Wavelength's compassionate AI Assistant. Your task is to translate complex radiology findings into simple, patient-friendly language.\n"
        "Do NOT use dense medical jargon. If you must use a medical term, explain it simply. Be reassuring but honest.\n"
        "You MUST incorporate the patient's Symptoms and Smoking History (if provided) into your response in a supportive way.\n\n"
        "Structure your response with the following markdown headings:\n\n"
        "**What We Looked At**\n"
        "[Brief description of the scan]\n\n"
        "**What We Found**\n"
        "[Simple explanation of the findings and what they mean]\n\n"
        "**What This Means for You**\n"
        "[How this relates to their symptoms or overall health]\n\n"
        "**Next Steps**\n"
        "[Clear, actionable advice (e.g., 'Please follow up with your doctor')]"
    )
    return generate_ai_response_sync(prompt_context, system=system_prompt, model="meditron:7b")
