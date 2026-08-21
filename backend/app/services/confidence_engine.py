from app.models.schemas import PolicyAction, ExceptionType, SeverityLevel

class ConfidencePolicyEngine:
    AUTO_RESOLVE_THRESHOLD = 0.90
    SUGGEST_THRESHOLD = 0.70

    @classmethod
    def evaluate_policy(cls, confidence_score: float) -> PolicyAction:
        """
        Determines the policy action based strictly on deterministic confidence thresholds.
        Python controls threshold enforcement, NOT the LLM.
        """
        if confidence_score >= cls.AUTO_RESOLVE_THRESHOLD:
            return PolicyAction.AUTO_RESOLVE
        elif confidence_score >= cls.SUGGEST_THRESHOLD:
            return PolicyAction.SUGGEST
        else:
            return PolicyAction.HUMAN_REVIEW

    @classmethod
    def calculate_confidence(
        cls,
        exception_type: ExceptionType,
        variance_pct: float,
        has_line_items: bool,
        vendor_history_score: float = 0.95,
        has_exact_match_rules: bool = True
    ) -> float:
        """
        Calculates a deterministic confidence score [0.0 - 1.0] based on data completeness,
        variance severity, and rule predictability.
        """
        base_confidence = 0.85

        # Penalty for large variances
        if abs(variance_pct) > 20.0:
            base_confidence -= 0.25
        elif abs(variance_pct) > 10.0:
            base_confidence -= 0.15
        elif abs(variance_pct) <= 5.0:
            base_confidence += 0.10

        # Adjust for exception type predictability
        if exception_type in [ExceptionType.PRICE_MISMATCH, ExceptionType.TAX_MISMATCH]:
            base_confidence += 0.05
        elif exception_type in [ExceptionType.MISSING_PO_REFERENCE, ExceptionType.UNUSUALLY_HIGH_AMOUNT]:
            base_confidence -= 0.20

        # Data completeness bonus
        if has_line_items:
            base_confidence += 0.05

        # Vendor historical reliability factor
        base_confidence = (base_confidence * 0.7) + (vendor_history_score * 0.3)

        # Clamp between 0.40 and 0.98
        final_score = max(0.40, min(0.98, round(base_confidence, 2)))
        return final_score
