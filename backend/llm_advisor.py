"""LLM Advisor — generates explanation, next action, and outreach draft via OpenAI."""

import json
import logging
import os

from models import CompanyResult, LLMDetails, Preferences

logger = logging.getLogger(__name__)

_FALLBACK = LLMDetails(
    explanation="Relevance based on your preferences.",
    next_action="Reach out via LinkedIn message.",
    outreach_draft=(
        "Hi {contact_name}, I noticed we're connected on LinkedIn. "
        "I'm exploring {target_role} opportunities and would love to learn "
        "about your experience at {company}. Would you be open to a quick chat?"
    ),
)

_PROMPT_TEMPLATE = """You are a career networking advisor. Given the following context, produce three outputs.

Context:
- Job seeker's target role: {target_role}
- Preferred location: {location}
- Company type preference: {company_type}
- Company: {company_name}
- Contact: {contact_name}, {contact_title}
- Path strength: {path_label} (score: {score}/100)
- Email available: {has_email}

Produce:
1. EXPLANATION (2-3 sentences): Why this company/contact is relevant.
2. NEXT ACTION (1 sentence): The recommended next step, considering whether email is available.
3. OUTREACH DRAFT (3-5 sentences): A personalized message to the contact.

Format your response as JSON: {{"explanation": "...", "next_action": "...", "outreach_draft": "..."}}"""


def _build_fallback(result: CompanyResult, prefs: Preferences) -> LLMDetails:
    """Return fallback content with placeholders filled in."""
    return LLMDetails(
        explanation=_FALLBACK.explanation,
        next_action=_FALLBACK.next_action,
        outreach_draft=_FALLBACK.outreach_draft.format(
            contact_name=result.contact_name,
            target_role=prefs.target_role,
            company=result.company_name,
        ),
    )


async def generate_details(
    result: CompanyResult, prefs: Preferences
) -> LLMDetails:
    """Call OpenAI to generate details. Falls back on any error."""
    api_key = os.environ.get("LLM_API_KEY", "")
    model = os.environ.get("LLM_MODEL", "gpt-4o-mini")

    if not api_key:
        logger.warning("LLM_API_KEY not set — returning fallback content")
        return _build_fallback(result, prefs)

    prompt = _PROMPT_TEMPLATE.format(
        target_role=prefs.target_role,
        location=prefs.location or "Not specified",
        company_type=prefs.company_type,
        company_name=result.company_name,
        contact_name=result.contact_name,
        contact_title=result.contact_title,
        path_label=result.path_label,
        score=result.score,
        has_email="Yes" if result.contact_email else "No",
    )

    try:
        import httpx

        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": model,
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0.7,
                },
            )
            resp.raise_for_status()
            body = resp.json()

        content = body["choices"][0]["message"]["content"]
        # Strip markdown code fences if present
        content = content.strip()
        if content.startswith("```"):
            content = content.split("\n", 1)[1] if "\n" in content else content[3:]
        if content.endswith("```"):
            content = content[:-3]
        content = content.strip()

        parsed = json.loads(content)
        return LLMDetails(
            explanation=parsed.get("explanation", _FALLBACK.explanation),
            next_action=parsed.get("next_action", _FALLBACK.next_action),
            outreach_draft=parsed.get("outreach_draft", _FALLBACK.outreach_draft),
        )

    except Exception as e:
        logger.error("LLM call failed: %s", e)
        return _build_fallback(result, prefs)
