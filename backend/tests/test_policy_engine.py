import unittest
import sys
import os

# Ensure backend root is in sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient
from app.main import app
from app.models.schemas import PolicyAction, ExceptionType
from app.services.confidence_engine import ConfidencePolicyEngine
from app.services.exception_engine import ExceptionEngine

class TestPolicyEngine(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_auto_resolve_at_90_percent(self):
        """Verify confidence score >= 0.90 maps strictly to AUTO_RESOLVE policy."""
        policy = ConfidencePolicyEngine.evaluate_policy(0.94)
        self.assertEqual(policy, PolicyAction.AUTO_RESOLVE)

    def test_suggest_at_78_percent(self):
        """Verify confidence score between 0.70 and 0.89 maps to SUGGEST policy."""
        policy = ConfidencePolicyEngine.evaluate_policy(0.78)
        self.assertEqual(policy, PolicyAction.SUGGEST)

    def test_human_review_below_70_percent(self):
        """Verify confidence score < 0.70 maps strictly to HUMAN_REVIEW policy."""
        policy = ConfidencePolicyEngine.evaluate_policy(0.45)
        self.assertEqual(policy, PolicyAction.HUMAN_REVIEW)

    def test_auto_resolve_blocked_below_90(self):
        """Verify API blocks auto-resolution attempt for <90% confidence with HTTP 400 and logs audit event."""
        self.client.post("/api/reset")
        res = self.client.post("/api/exceptions/EX-1043/auto-resolve")
        self.assertEqual(res.status_code, 400)
        self.assertIn("Policy Violation", res.json()["detail"])
        
        # Check item audit trail contains blocked log entry
        item = self.client.get("/api/exceptions/EX-1043").json()
        latest_event = item["audit_trail"][-1]
        self.assertEqual(latest_event["actor"], "Policy Engine")
        self.assertIn("AUTO_RESOLVE_ATTEMPT Blocked", latest_event["event"])
        self.client.post("/api/reset")

    def test_variance_calculation(self):
        """Verify deterministic dollar and percentage variance calculation math."""
        var_amt, var_pct = ExceptionEngine.calculate_variance(expected=7900.0, actual=8450.0)
        self.assertEqual(var_amt, 550.0)
        self.assertEqual(var_pct, 6.96)

    def test_evidence_extraction(self):
        """Verify evidence extraction facts contain PO Amount, Invoice Amount, Difference, and Variance."""
        item = {
            "id": "EX-1042",
            "invoice_amount": 8450.0,
            "expected_amount": 7900.0,
            "variance_amount": 550.0,
            "variance_pct": 6.96,
            "line_items": []
        }
        facts = ExceptionEngine.extract_evidence_facts(item)
        self.assertIn("PO Amount: $7,900.00", facts)
        self.assertIn("Invoice Amount: $8,450.00", facts)
        self.assertIn("Difference: +$550.00", facts)
        self.assertIn("Variance: +6.96%", facts)

if __name__ == "__main__":
    unittest.main()
