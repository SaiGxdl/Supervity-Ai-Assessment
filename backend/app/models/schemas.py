from pydantic import BaseModel, Field
from typing import List, Optional
from enum import Enum
from datetime import datetime

class ExceptionType(str, Enum):
    PRICE_MISMATCH = "PRICE_MISMATCH"
    QUANTITY_MISMATCH = "QUANTITY_MISMATCH"
    TAX_MISMATCH = "TAX_MISMATCH"
    DUPLICATE_INVOICE = "DUPLICATE_INVOICE"
    MISSING_PO_REFERENCE = "MISSING_PO_REFERENCE"
    UNUSUALLY_HIGH_AMOUNT = "UNUSUALLY_HIGH_AMOUNT"

class SeverityLevel(str, Enum):
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"

class PolicyAction(str, Enum):
    AUTO_RESOLVE = "AUTO_RESOLVE"
    SUGGEST = "SUGGEST"
    HUMAN_REVIEW = "HUMAN_REVIEW"

class ExceptionStatus(str, Enum):
    PENDING = "PENDING"
    RESOLVED = "RESOLVED"
    AUTO_RESOLVED = "AUTO_RESOLVED"
    ESCALATED = "ESCALATED"

class LineItem(BaseModel):
    item_id: str
    description: str
    qty_po: int
    qty_inv: int
    unit_price_po: float
    unit_price_inv: float
    total_po: float
    total_inv: float

class AuditLogEntry(BaseModel):
    timestamp: str
    event: str
    actor: str = "System"
    details: Optional[str] = None

class ExceptionItem(BaseModel):
    id: str
    vendor: str
    po_number: str
    invoice_number: str
    invoice_amount: float
    expected_amount: float
    variance_amount: float
    variance_pct: float
    exception_type: ExceptionType
    severity: SeverityLevel
    confidence_score: float = Field(..., ge=0.0, le=1.0)
    policy_action: PolicyAction
    status: ExceptionStatus
    created_at: str
    line_items: List[LineItem] = []
    audit_trail: List[AuditLogEntry] = []
    resolution_notes: Optional[str] = None
    resolved_at: Optional[str] = None

class CreateExceptionRequest(BaseModel):
    vendor: str
    po_number: str
    invoice_number: str
    invoice_amount: float
    expected_amount: float
    exception_type: ExceptionType
    line_items: List[LineItem] = []


class ExplainRequest(BaseModel):
    user_query: Optional[str] = None

class ExplainResponse(BaseModel):
    exception_id: str
    root_cause: str
    explanation: str
    evidence: List[str]
    confidence_score: float
    policy_action: PolicyAction
    suggested_action: str

class SuggestResolutionResponse(BaseModel):
    exception_id: str
    suggested_action: str
    rationale: str
    risk_level: str
    can_auto_resolve: bool
    confidence_score: float

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    reply: str
    suggested_actions: List[str] = []
    evidence_highlights: List[str] = []

class ResolveRequest(BaseModel):
    notes: Optional[str] = None
    resolution_type: str = "MANUAL_APPROVAL"

class MetricsSummary(BaseModel):
    total_exceptions: int
    high_risk_count: int
    medium_risk_count: int
    low_risk_count: int
    pending_count: int
    auto_resolved_count: int
    manually_resolved_count: int
    escalated_count: int
    resolution_rate_pct: float
    by_type: dict
