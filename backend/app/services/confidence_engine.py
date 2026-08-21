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
        Calculates a deterministic, explainable confidence score [0.0 - 1.0].
        
        Formula Factors:
        1. Base Confidence: 80%
        2. Line-Item Evidence Availability: +5% (if line items present)
        3. Exception Rule Predictability: +5% for PRICE/TAX, -20% for MISSING_PO/UNUSUALLY_HIGH
        4. Variance Severity Factor: +10% (<=5%), -15% (>10%), -25% (>20%)
        5. Vendor History Reliability: 30% weight blend
        """
        base_confidence = 0.80

        # 1. Line-item evidence availability bonus
        if has_line_items:
            base_confidence += 0.05

        # 2. Exception type rule predictability
        if exception_type in [ExceptionType.PRICE_MISMATCH, ExceptionType.TAX_MISMATCH]:
            base_confidence += 0.05
        elif exception_type in [ExceptionType.MISSING_PO_REFERENCE, ExceptionType.UNUSUALLY_HIGH_AMOUNT]:
            base_confidence -= 0.20

        # 3. Variance severity adjustment
        abs_var = abs(variance_pct)
        if abs_var <= 5.0:
            base_confidence += 0.10
        elif abs_var > 20.0:
            base_confidence -= 0.25
        elif abs_var > 10.0:
            base_confidence -= 0.15

        # 4. Vendor historical reliability factor (70% rules + 30% vendor history)
        final_score = (base_confidence * 0.70) + (vendor_history_score * 0.30)
        return max(0.40, min(0.98, round(final_score, 2)))

    @classmethod
    def explain_confidence_breakdown(cls, item: dict) -> list[str]:
        """
        Returns human-readable breakdown factors explaining how the score was calculated.
        """
        factors = []
        conf_pct = int(item.get("confidence_score", 0.85) * 100)
        exc_type = item.get("exception_type", "PRICE_MISMATCH")
        var_pct = abs(item.get("variance_pct", 0))
        line_items = item.get("line_items", [])

        factors.append("Base Rule Score: 80%")
        if line_items:
            factors.append("Line-Item Evidence Available: +5%")
        if exc_type in ["PRICE_MISMATCH", "TAX_MISMATCH"]:
            factors.append(f"Predictable Rule Pattern ({exc_type}): +5%")
        elif exc_type in ["MISSING_PO_REFERENCE", "UNUSUALLY_HIGH_AMOUNT"]:
            factors.append(f"Unpredictable Pattern ({exc_type}): -20%")

        if var_pct <= 5.0:
            factors.append(f"Low Variance (<5%): +10%")
        elif var_pct > 20.0:
            factors.append(f"High Variance (>20%): -25%")
        elif var_pct > 10.0:
            factors.append(f"Moderate Variance (>10%): -15%")

        factors.append("Vendor Historic Reliability: 30% Weight")
        factors.append(f"Final Calculated Score: {conf_pct}%")
        return factors
