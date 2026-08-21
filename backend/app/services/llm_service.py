import os
import json
from typing import Dict, Any, List
from app.models.schemas import (
    ExplainResponse,
    SuggestResolutionResponse,
    ChatResponse,
    PolicyAction,
    ExceptionType
)
from app.services.exception_engine import ExceptionEngine

class LLMService:
    def __init__(self):
        self.api_key = os.getenv("OPENAI_API_KEY", "")
        self.client = None
        if self.api_key:
            try:
                from openai import OpenAI
                self.client = OpenAI(api_key=self.api_key)
            except Exception as e:
                print(f"[LLMService] Failed to initialize OpenAI client: {e}")

    def generate_explanation(self, item: Dict[str, Any], query: str = None) -> ExplainResponse:
        evidence = ExceptionEngine.extract_evidence_facts(item)
        exc_type = item.get("exception_type", "PRICE_MISMATCH")
        vendor = item.get("vendor", "Vendor")
        inv_amt = item.get("invoice_amount", 0)
        exp_amt = item.get("expected_amount", 0)
        diff = item.get("variance_amount", 0)
        pct = item.get("variance_pct", 0)
        conf = item.get("confidence_score", 0.85)
        policy = item.get("policy_action", PolicyAction.SUGGEST)

        # Attempt OpenAI structured completion if client available
        if self.client:
            try:
                prompt = f"""
                You are an enterprise AP Exception Resolution Assistant.
                Analyze this transaction exception and provide a clear, source-grounded explanation.

                Transaction Data:
                - ID: {item.get('id')}
                - Vendor: {vendor}
                - PO Number: {item.get('po_number')}
                - Invoice Number: {item.get('invoice_number')}
                - Exception Type: {exc_type}
                - Invoice Amount: ${inv_amt:,.2f}
                - Expected Amount: ${exp_amt:,.2f}
                - Variance: ${diff:,.2f} ({pct}%)
                - Line Items: {json.dumps(item.get('line_items', []))}
                - Confidence Score: {conf}
                - Policy Action: {policy}

                Return valid JSON matching this exact structure:
                {{
                    "root_cause": "Short summary of why this exception occurred",
                    "explanation": "Detailed plain-English breakdown citing exact amounts and line item discrepancies",
                    "evidence": ["Bullet point fact 1", "Bullet point fact 2"],
                    "suggested_action": "Recommended step to resolve"
                }}
                """
                response = self.client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[
                        {"role": "system", "content": "You are a precise corporate accounting AI assistant. Always output JSON."},
                        {"role": "user", "content": prompt}
                    ],
                    response_format={"type": "json_object"},
                    temperature=0.2
                )
                res_json = json.loads(response.choices[0].message.content)
                return ExplainResponse(
                    exception_id=item.get("id"),
                    root_cause=res_json.get("root_cause", f"{exc_type} detected for {vendor}"),
                    explanation=res_json.get("explanation", ""),
                    evidence=res_json.get("evidence", evidence),
                    confidence_score=conf,
                    policy_action=policy,
                    suggested_action=res_json.get("suggested_action", "")
                )
            except Exception as e:
                print(f"[LLMService] OpenAI call failed: {e}. Falling back to deterministic structured response.")

        # High-quality deterministic fallback response grounded in item facts
        root_cause_map = {
            "PRICE_MISMATCH": f"Unit price on Invoice {item.get('invoice_number')} (${inv_amt:,.2f}) exceeds Purchase Order {item.get('po_number')} rate (${exp_amt:,.2f}).",
            "QUANTITY_MISMATCH": f"Invoiced line item quantity exceeds authorized quantity on PO {item.get('po_number')}.",
            "TAX_MISMATCH": f"Sales tax calculated on invoice differs from jurisdictional contract tax rate.",
            "DUPLICATE_INVOICE": f"Invoice {item.get('invoice_number')} matches a previously processed payment transaction.",
            "MISSING_PO_REFERENCE": f"Invoice submitted without an active purchase order reference number.",
            "UNUSUALLY_HIGH_AMOUNT": f"Invoice total (${inv_amt:,.2f}) exceeds vendor historic spending limit threshold."
        }
        root_cause = root_cause_map.get(exc_type, f"Discrepancy detected in invoice from {vendor}.")

        explanation = (
            f"{item.get('id')} was flagged due to a {exc_type.replace('_', ' ').lower()}. "
            f"The vendor {vendor} submitted invoice #{item.get('invoice_number')} totaling ${inv_amt:,.2f}, "
            f"whereas expected amount on PO #{item.get('po_number')} was ${exp_amt:,.2f} "
            f"(net variance of ${diff:,.2f} / {pct}%). "
            f"AI Confidence is {int(conf * 100)}% based on rule determinism and line item matching."
        )

        suggested_action_map = {
            "AUTO_RESOLVE": f"Execute automated price variance tolerance adjustment up to ${diff:,.2f}.",
            "SUGGEST": f"Request vendor credit note for ${diff:,.2f} or submit internal price variance approval.",
            "HUMAN_REVIEW": f"Escalate to Accounts Payable supervisor for manual contract review."
        }
        suggested_action = suggested_action_map.get(policy, "Review transaction details.")

        return ExplainResponse(
            exception_id=item.get("id"),
            root_cause=root_cause,
            explanation=explanation,
            evidence=evidence,
            confidence_score=conf,
            policy_action=policy,
            suggested_action=suggested_action
        )

    def suggest_resolution(self, item: Dict[str, Any]) -> SuggestResolutionResponse:
        conf = item.get("confidence_score", 0.85)
        policy = item.get("policy_action", PolicyAction.SUGGEST)
        exc_type = item.get("exception_type", "PRICE_MISMATCH")
        diff = item.get("variance_amount", 0)

        can_auto = (policy == PolicyAction.AUTO_RESOLVE and conf >= 0.90)

        if policy == PolicyAction.AUTO_RESOLVE:
            action = f"Auto-Approve: Apply minor price tolerance threshold rule to absorb ${diff:,.2f} variance."
            rationale = f"Variance is within pre-approved corporate threshold (variance < $600 and confidence {int(conf*100)}% >= 90%)."
            risk = "LOW"
        elif policy == PolicyAction.SUGGEST:
            action = f"Vendor Correction: Issue automated line-item discrepancy notice for ${diff:,.2f} credit."
            rationale = f"High probability of price mismatch. Requires 1-click human reviewer sign-off before vendor dispatch."
            risk = "MEDIUM"
        else:
            action = f"Escalate to Senior AP Audit: Flag invoice for manual vendor contract re-negotiation."
            rationale = f"Confidence score ({int(conf*100)}%) is below automated threshold (<70%). Requires manual verification."
            risk = "HIGH"

        return SuggestResolutionResponse(
            exception_id=item.get("id"),
            suggested_action=action,
            rationale=rationale,
            risk_level=risk,
            can_auto_resolve=can_auto,
            confidence_score=conf
        )

    def process_chat(self, item: Dict[str, Any], user_message: str) -> ChatResponse:
        msg_lower = user_message.lower()
        evidence = ExceptionEngine.extract_evidence_facts(item)
        conf = item.get("confidence_score", 0.85)
        policy = item.get("policy_action", PolicyAction.SUGGEST)

        # Contextual intelligence routing
        if "why" in msg_lower or "flag" in msg_lower or "reason" in msg_lower:
            reply = f"Exception {item.get('id')} was flagged for {item.get('exception_type')}. Invoice amount is ${item.get('invoice_amount'):,.2f} compared to PO expected ${item.get('expected_amount'):,.2f} (Variance: ${item.get('variance_amount'):,.2f})."
            suggested = ["What resolution is suggested?", "Show the evidence", "Can this be auto-resolved?"]
        elif "evidence" in msg_lower or "show" in msg_lower or "details" in msg_lower:
            reply = f"Here is the verified data evidence for {item.get('id')}:\n" + "\n".join([f"• {e}" for e in evidence])
            suggested = ["Why was this flagged?", "What resolution is suggested?", "Can this be auto-resolved?"]
        elif "auto" in msg_lower or "threshold" in msg_lower or "can this" in msg_lower:
            if policy == PolicyAction.AUTO_RESOLVE:
                reply = f"Yes! Confidence is {int(conf*100)}% (≥90% policy threshold). This item is eligible for 1-click Auto-Resolution."
            elif policy == PolicyAction.SUGGEST:
                reply = f"No auto-resolution. Confidence is {int(conf*100)}% (70-89% threshold range). It requires human reviewer approval."
            else:
                reply = f"Strictly blocked. Confidence is {int(conf*100)}% (<70% threshold). This item requires full manual audit."
            suggested = ["Why was this flagged?", "What resolution is suggested?", "Show the evidence"]
        else:
            reply = f"Regarding {item.get('id')} ({item.get('vendor')}): The item has a status of '{item.get('status')}' with AI confidence of {int(conf*100)}%. How would you like to proceed?"
            suggested = ["Why was this flagged?", "What resolution is suggested?", "Show the evidence", "Can this be auto-resolved?"]

        return ChatResponse(
            reply=reply,
            suggested_actions=suggested,
            evidence_highlights=evidence
        )
