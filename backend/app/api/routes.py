from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from datetime import datetime
import random
from app.models.schemas import (
    ExceptionItem,
    CreateExceptionRequest,
    ExplainRequest,
    ExplainResponse,
    SuggestResolutionResponse,
    ChatRequest,
    ChatResponse,
    ResolveRequest,
    MetricsSummary,
    ExceptionStatus,
    PolicyAction
)
from app.services.data_store import data_store
from app.services.llm_service import LLMService
from app.services.confidence_engine import ConfidencePolicyEngine
from app.services.exception_engine import ExceptionEngine

router = APIRouter(prefix="/api")
llm_service = LLMService()

@router.get("/exceptions", response_model=List[ExceptionItem])
def get_exceptions(
    status: Optional[str] = Query(None, description="Filter by status (e.g., PENDING, RESOLVED)"),
    severity: Optional[str] = Query(None, description="Filter by severity (HIGH, MEDIUM, LOW)")
):
    items = data_store.get_all(status_filter=status, severity_filter=severity)
    return items

@router.post("/exceptions", response_model=ExceptionItem, status_code=201)
def create_exception(req: CreateExceptionRequest):
    var_amt, var_pct = ExceptionEngine.calculate_variance(req.expected_amount, req.invoice_amount)
    severity = ExceptionEngine.classify_severity(var_pct, req.exception_type)
    conf = ConfidencePolicyEngine.calculate_confidence(
        exception_type=req.exception_type,
        variance_pct=var_pct,
        has_line_items=len(req.line_items) > 0
    )
    policy = ConfidencePolicyEngine.evaluate_policy(conf)

    new_id = f"EX-{random.randint(1050, 9999)}"
    now_str = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")

    new_item = {
        "id": new_id,
        "vendor": req.vendor,
        "po_number": req.po_number,
        "invoice_number": req.invoice_number,
        "invoice_amount": req.invoice_amount,
        "expected_amount": req.expected_amount,
        "variance_amount": var_amt,
        "variance_pct": var_pct,
        "exception_type": req.exception_type,
        "severity": severity,
        "confidence_score": conf,
        "policy_action": policy,
        "status": ExceptionStatus.PENDING,
        "created_at": now_str,
        "line_items": [item.dict() for item in req.line_items],
        "audit_trail": [
            {
                "timestamp": now_str,
                "event": f"Custom exception {new_id} ingested into workbench queue",
                "actor": "API Ingestion"
            },
            {
                "timestamp": now_str,
                "event": f"Deterministic Engine evaluated variance {var_pct}% ({severity} risk)",
                "actor": "Rules Engine"
            },
            {
                "timestamp": now_str,
                "event": f"Confidence Policy Engine assigned {int(conf*100)}% ({policy})",
                "actor": "Policy Engine"
            }
        ]
    }
    return data_store.add_exception(new_item)


@router.get("/exceptions/{item_id}", response_model=ExceptionItem)
def get_exception_by_id(item_id: str):
    item = data_store.get_by_id(item_id)
    if not item:
        raise HTTPException(status_code=404, detail=f"Exception '{item_id}' not found.")
    return item

@router.post("/exceptions/{item_id}/explain", response_model=ExplainResponse)
def explain_exception(item_id: str, body: Optional[ExplainRequest] = None):
    item = data_store.get_by_id(item_id)
    if not item:
        raise HTTPException(status_code=404, detail=f"Exception '{item_id}' not found.")
    
    user_query = body.user_query if body else None
    explanation = llm_service.generate_explanation(item, query=user_query)
    data_store.append_audit_log(item_id, "AI Explanation generated and requested by reviewer", actor="AI Employee")
    return explanation

@router.post("/exceptions/{item_id}/suggest-resolution", response_model=SuggestResolutionResponse)
def suggest_resolution(item_id: str):
    item = data_store.get_by_id(item_id)
    if not item:
        raise HTTPException(status_code=404, detail=f"Exception '{item_id}' not found.")

    suggestion = llm_service.suggest_resolution(item)
    data_store.append_audit_log(item_id, "AI Resolution recommendation generated", actor="AI Employee")
    return suggestion

@router.post("/exceptions/{item_id}/chat", response_model=ChatResponse)
def chat_exception(item_id: str, req: ChatRequest):
    item = data_store.get_by_id(item_id)
    if not item:
        raise HTTPException(status_code=404, detail=f"Exception '{item_id}' not found.")

    res = llm_service.process_chat(item, req.message)
    data_store.append_audit_log(item_id, f"Reviewer chat query: '{req.message[:40]}...'", actor="Human Reviewer")
    return res

@router.post("/exceptions/{item_id}/resolve", response_model=ExceptionItem)
def resolve_exception(item_id: str, req: ResolveRequest):
    item = data_store.get_by_id(item_id)
    if not item:
        raise HTTPException(status_code=404, detail=f"Exception '{item_id}' not found.")

    notes = req.notes or "Manually approved by human reviewer."
    updated_item = data_store.update_status(
        item_id=item_id,
        new_status=ExceptionStatus.RESOLVED,
        notes=notes,
        actor="Human Reviewer"
    )
    return updated_item

@router.post("/exceptions/{item_id}/auto-resolve", response_model=ExceptionItem)
def auto_resolve_exception(item_id: str):
    item = data_store.get_by_id(item_id)
    if not item:
        raise HTTPException(status_code=404, detail=f"Exception '{item_id}' not found.")

    conf = item.get("confidence_score", 0.0)
    policy = item.get("policy_action")

    # DETERMINISTIC GUARDRAIL CHECK
    if conf < ConfidencePolicyEngine.AUTO_RESOLVE_THRESHOLD or policy != PolicyAction.AUTO_RESOLVE:
        blocked_msg = (
            f"AUTO_RESOLVE_ATTEMPT Blocked: confidence {int(conf*100)}% < threshold 90% "
            f"(Policy action: {policy}). Human reviewer sign-off mandatory."
        )
        data_store.append_audit_log(item_id, blocked_msg, actor="Policy Engine")
        raise HTTPException(
            status_code=400,
            detail=(
                f"Policy Violation: Exception '{item_id}' has confidence score {int(conf*100)}% "
                f"which is below the auto-resolution policy threshold (≥{int(ConfidencePolicyEngine.AUTO_RESOLVE_THRESHOLD*100)}%). "
                f"Current policy action is '{policy}'. Human sign-off required."
            )
        )

    updated_item = data_store.update_status(
        item_id=item_id,
        new_status=ExceptionStatus.AUTO_RESOLVED,
        notes=f"Auto-resolved via Policy Threshold Rule (Confidence: {int(conf*100)}% ≥ 90%).",
        actor="Policy Engine"
    )
    return updated_item

@router.get("/metrics", response_model=MetricsSummary)
def get_metrics():
    return data_store.get_metrics()

@router.post("/reset")
def reset_dataset():
    data_store.reset_data()
    return {"status": "SUCCESS", "message": "Dataset reset to initial synthetic baseline state."}
