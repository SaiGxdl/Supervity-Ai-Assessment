from app.models.schemas import ExceptionType, SeverityLevel

class ExceptionEngine:
    @staticmethod
    def calculate_variance(expected: float, actual: float) -> tuple[float, float]:
        variance_amount = round(actual - expected, 2)
        variance_pct = round((variance_amount / expected) * 100, 2) if expected > 0 else 0.0
        return variance_amount, variance_pct

    @staticmethod
    def classify_severity(variance_pct: float, exception_type: ExceptionType) -> SeverityLevel:
        abs_var = abs(variance_pct)
        if exception_type in [ExceptionType.DUPLICATE_INVOICE, ExceptionType.MISSING_PO_REFERENCE]:
            return SeverityLevel.HIGH
        
        if abs_var >= 10.0 or exception_type == ExceptionType.UNUSUALLY_HIGH_AMOUNT:
            return SeverityLevel.HIGH
        elif abs_var >= 5.0:
            return SeverityLevel.MEDIUM
        else:
            return SeverityLevel.LOW

    @staticmethod
    def extract_evidence_facts(item: dict) -> list[str]:
        evidence = []
        invoice_amt = item.get("invoice_amount", 0)
        expected_amt = item.get("expected_amount", 0)
        var_amt = item.get("variance_amount", 0)
        var_pct = item.get("variance_pct", 0)

        evidence.append(f"PO Amount: ${expected_amt:,.2f}")
        evidence.append(f"Invoice Amount: ${invoice_amt:,.2f}")
        diff_prefix = "+" if var_amt > 0 else ""
        evidence.append(f"Difference: {diff_prefix}${var_amt:,.2f}")
        pct_prefix = "+" if var_pct > 0 else ""
        evidence.append(f"Variance: {pct_prefix}{var_pct}%")

        line_items = item.get("line_items", [])
        for line in line_items:
            if line.get("unit_price_inv") != line.get("unit_price_po"):
                evidence.append(
                    f"Line {line['item_id']} ({line['description']}): "
                    f"PO Rate ${line['unit_price_po']:,.2f} vs Inv Rate ${line['unit_price_inv']:,.2f}"
                )
            if line.get("qty_inv") != line.get("qty_po"):
                evidence.append(
                    f"Line {line['item_id']} ({line['description']}): "
                    f"PO Qty {line['qty_po']} vs Inv Qty {line['qty_inv']}"
                )
        return evidence
