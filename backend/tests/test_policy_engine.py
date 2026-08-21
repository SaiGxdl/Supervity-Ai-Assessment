import unittest
import sys
import os

# Ensure backend root is in sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient
from app.main import app
from app.models.schemas import PolicyAction, ExceptionType, SeverityLevel
from app.services.confidence_engine import ConfidencePolicyEngine
from app.services.exception_engine import ExceptionEngine

class TestPolicyEngine(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_90_percent_is_auto_resolve(self):
        """Verify confidence score >= 0.90 maps strictly to AUTO_RESOLVE policy."""
        policy = ConfidencePolicyEngine.evaluate_policy(0.90)
        self.assertEqual(policy, PolicyAction.AUTO_RESOLVE)

    def test_89_percent_is_suggest(self):
        """Verify confidence score of 0.89 maps to SUGGEST policy."""
        policy = ConfidencePolicyEngine.evaluate_policy(0.89)
        self.assertEqual(policy, PolicyAction.SUGGEST)

    def test_70_percent_is_suggest(self):
        """Verify confidence score of 0.70 maps to SUGGEST policy boundary."""
        policy = ConfidencePolicyEngine.evaluate_policy(0.70)
        self.assertEqual(policy, PolicyAction.SUGGEST)

    def test_69_percent_is_human_review(self):
        """Verify confidence score < 0.70 (0.69) maps strictly to HUMAN_REVIEW policy."""
        policy = ConfidencePolicyEngine.evaluate_policy(0.69)
        self.assertEqual(policy, PolicyAction.HUMAN_REVIEW)

    def test_price_mismatch_detection(self):
        """Verify deterministic price mismatch severity classification."""
        severity = ExceptionEngine.classify_severity(variance_pct=6.96, exception_type=ExceptionType.PRICE_MISMATCH)
        self.assertEqual(severity, SeverityLevel.MEDIUM)

    def test_variance_calculation(self):
        """Verify deterministic dollar and percentage variance calculation math."""
        var_amt, var_pct = ExceptionEngine.calculate_variance(expected=7900.0, actual=8450.0)
        self.assertEqual(var_amt, 550.0)
        self.assertEqual(var_pct, 6.96)

    def test_auto_resolve_guardrail(self):
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

if __name__ == "__main__":
    unittest.main()
