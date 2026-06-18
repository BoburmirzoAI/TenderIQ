"""Document analysis service using Claude AI and PDF extraction."""

import logging
from typing import Optional

import fitz

from app.config import settings
from app.exceptions import ExternalServiceException, ValidationException
from app.schemas.document import ChecklistItem, ChecklistResponse

logger = logging.getLogger(__name__)


class DocumentService:
    """Handles PDF extraction and AI-powered document analysis."""

    async def extract_pdf_text(self, file_path: str) -> str:
        """Extract text content from a PDF file."""
        try:
            doc = fitz.open(file_path)
            text = ""
            for page in doc:
                text += page.get_text()
            doc.close()
            return text.strip()
        except Exception as e:
            logger.error("PDF extraction failed: %s", str(e))
            raise ValidationException(f"Could not read PDF file: {str(e)}")

    async def analyze_with_claude(
        self,
        text: str,
        tender_title: Optional[str] = None,
    ) -> dict:
        """Send document text to Claude AI for analysis."""
        import anthropic

        if not settings.ANTHROPIC_API_KEY:
            raise ExternalServiceException("Claude AI", "API key not configured")

        client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)

        system_prompt = (
            "You are an expert government tender analyst for Uzbekistan. "
            "Analyze the tender document and extract: "
            "1. A checklist of all requirements (mandatory and optional) "
            "2. Key dates and deadlines "
            "3. Required documents for submission "
            "4. Estimated budget if mentioned "
            "5. A brief summary "
            "Respond in JSON format with keys: checklist, key_dates, "
            "required_documents, estimated_budget, summary"
        )

        user_message = f"Tender: {tender_title or 'Unknown'}\n\nDocument text:\n{text[:15000]}"

        try:
            response = client.messages.create(
                model=settings.CLAUDE_MODEL,
                max_tokens=4096,
                system=system_prompt,
                messages=[{"role": "user", "content": user_message}],
            )
            return self._parse_claude_response(response.content[0].text)
        except anthropic.APIError as e:
            logger.error("Claude API error: %s", str(e))
            raise ExternalServiceException("Claude AI", str(e))

    async def generate_checklist(
        self,
        file_path: str,
        tender_title: Optional[str] = None,
        tender_id: Optional[int] = None,
    ) -> ChecklistResponse:
        """Extract PDF text and generate analysis checklist."""
        text = await self.extract_pdf_text(file_path)

        if len(text) < 50:
            raise ValidationException("PDF contains too little text for analysis")

        import fitz

        doc = fitz.open(file_path)
        total_pages = len(doc)
        doc.close()

        analysis = await self.analyze_with_claude(text, tender_title)

        checklist_items = [
            ChecklistItem(
                requirement=item.get("requirement", ""),
                is_mandatory=item.get("is_mandatory", True),
                category=item.get("category", "general"),
                notes=item.get("notes"),
            )
            for item in analysis.get("checklist", [])
        ]

        return ChecklistResponse(
            tender_id=tender_id,
            filename=file_path.split("/")[-1],
            total_pages=total_pages,
            checklist=checklist_items,
            summary=analysis.get("summary", ""),
            key_dates=analysis.get("key_dates", []),
            required_documents=analysis.get("required_documents", []),
            estimated_budget=analysis.get("estimated_budget"),
        )

    def _parse_claude_response(self, response_text: str) -> dict:
        """Parse Claude's JSON response."""
        import json

        try:
            start = response_text.find("{")
            end = response_text.rfind("}") + 1
            if start >= 0 and end > start:
                return json.loads(response_text[start:end])
        except json.JSONDecodeError:
            logger.warning("Failed to parse Claude response as JSON")

        return {
            "checklist": [],
            "key_dates": [],
            "required_documents": [],
            "estimated_budget": None,
            "summary": response_text[:500],
        }
