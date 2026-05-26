import json
import logging
import google.generativeai as genai
from app.config import settings
from app.schemas.ai import AIAnalysisResult

logger = logging.getLogger(__name__)

class GeminiService:
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        if self.api_key:
            genai.configure(api_key=self.api_key)
        else:
            logger.warning("GEMINI_API_KEY is not set. AI services will run in warning fallback mode.")

    def generate_note_insights(self, note_title: str, note_content: str) -> AIAnalysisResult:
        if not self.api_key:
            # Fallback mock results if API key is missing so the application still runs and guides the user
            return AIAnalysisResult(
                summary="AI service is not configured (missing GEMINI_API_KEY). Please add your Gemini API key in the backend `.env` file and restart the server.",
                action_items=[
                    "Create or open backend/.env",
                    "Add GEMINI_API_KEY=your_key_here",
                    "Restart backend server"
                ],
                suggested_title=f"Setup AI: {note_title}"
            )

        if not note_content.strip():
            return AIAnalysisResult(
                summary="The note content is empty. Add text to your note before requesting AI insights.",
                action_items=["Write note content", "Run AI summary again"],
                suggested_title=note_title or "Empty Note"
            )

        prompt = f"""
You are an expert executive assistant and summaries engine.
Analyze the note titled "{note_title}" and the content provided below.
Provide:
1. A concise, professional summary of the note (no more than 3-4 sentences).
2. A list of clear, actionable tasks or items extracted from the content.
3. A suggested short, engaging, and professional title that fits the note content.

Note content:
\"\"\"
{note_content}
\"\"\"

You MUST respond strictly with a valid JSON object matching this structure:
{{
  "summary": "string summary",
  "action_items": ["item 1", "item 2", ...],
  "suggested_title": "string title"
}}
Do NOT wrap the response in markdown blocks like ```json. Return only the raw JSON string.
"""
        try:
            # Use gemini-flash-latest which is the current standard model
            model = genai.GenerativeModel(
                model_name="gemini-flash-latest",
                generation_config={"response_mime_type": "application/json"}
            )
            
            response = model.generate_content(prompt)
            response_text = response.text.strip()
            
            # Clean potential markdown wraps
            if response_text.startswith("```json"):
                response_text = response_text[7:]
            if response_text.endswith("```"):
                response_text = response_text[:-3]
            response_text = response_text.strip()
            
            data = json.loads(response_text)
            
            summary = data.get("summary", "")
            action_items = data.get("action_items", [])
            suggested_title = data.get("suggested_title", note_title)
            
            if not isinstance(action_items, list):
                action_items = [str(action_items)] if action_items else []
            
            return AIAnalysisResult(
                summary=str(summary),
                action_items=[str(item) for item in action_items],
                suggested_title=str(suggested_title)
            )
        except Exception as e:
            logger.error(f"Gemini API invocation error: {str(e)}")
            return AIAnalysisResult(
                summary=f"Failed to generate AI insights: {str(e)}",
                action_items=[
                    "Check internet connection",
                    "Verify GEMINI_API_KEY is valid",
                    "Try again in a few moments"
                ],
                suggested_title=note_title or "Error Analyzing Note"
            )

gemini_service = GeminiService()
