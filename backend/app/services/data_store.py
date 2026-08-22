import os
import json
from datetime import datetime
from typing import List, Dict, Any, Optional
from app.models.schemas import ExceptionStatus, PolicyAction

DATA_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data", "exceptions.json")
SEED_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data", "exceptions_seed.json")

class DataStore:
    def __init__(self):
        self._data: List[Dict[str, Any]] = []
        self._initial_backup: List[Dict[str, Any]] = []
        self.load_data()

    def load_data(self):
        if os.path.exists(DATA_FILE):
            with open(DATA_FILE, "r", encoding="utf-8") as f:
                self._data = json.load(f)
                self._initial_backup = json.loads(json.dumps(self._data))
        else:
            self._data = []

    def save_data(self):
        os.makedirs(os.path.dirname(DATA_FILE), exist_ok=True)
        with open(DATA_FILE, "w", encoding="utf-8") as f:
            json.dump(self._data, f, indent=2)

    def get_all(self, status_filter: str = None, severity_filter: str = None) -> List[Dict[str, Any]]:
        result = self._data
        if status_filter and status_filter.upper() != "ALL":
            result = [item for item in result if item.get("status") == status_filter.upper()]
        if severity_filter and severity_filter.upper() != "ALL":
            result = [item for item in result if item.get("severity") == severity_filter.upper()]
        return result

    def get_by_id(self, item_id: str) -> Optional[Dict[str, Any]]:
        for item in self._data:
            if item.get("id") == item_id:
                return item
        return None

    def add_exception(self, item: Dict[str, Any]) -> Dict[str, Any]:
        self._data.insert(0, item)
        self.save_data()
        return item


    def update_status(self, item_id: str, new_status: ExceptionStatus, notes: str = None, actor: str = "Human Reviewer") -> Optional[Dict[str, Any]]:
        item = self.get_by_id(item_id)
        if not item:
            return None

        status_str = new_status.value if hasattr(new_status, "value") else str(new_status)
        now_str = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
        item["status"] = status_str
        item["resolved_at"] = now_str
        if notes:
            item["resolution_notes"] = notes

        # Audit trail event
        if "audit_trail" not in item:
            item["audit_trail"] = []

        item["audit_trail"].append({
            "timestamp": now_str,
            "event": f"Status updated to '{status_str}' ({notes if notes else 'No notes'})",
            "actor": actor
        })

        self.save_data()
        return item

    def append_audit_log(self, item_id: str, event: str, actor: str = "System"):
        item = self.get_by_id(item_id)
        if item:
            if "audit_trail" not in item:
                item["audit_trail"] = []
            item["audit_trail"].append({
                "timestamp": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
                "event": event,
                "actor": actor
            })
            self.save_data()

    def get_metrics(self) -> Dict[str, Any]:
        total = len(self._data)
        high = sum(1 for x in self._data if x.get("severity") == "HIGH")
        med = sum(1 for x in self._data if x.get("severity") == "MEDIUM")
        low = sum(1 for x in self._data if x.get("severity") == "LOW")
        pending = sum(1 for x in self._data if x.get("status") == "PENDING")
        auto_resolved = sum(1 for x in self._data if x.get("status") == "AUTO_RESOLVED")
        manually_resolved = sum(1 for x in self._data if x.get("status") == "RESOLVED")
        escalated = sum(1 for x in self._data if x.get("status") == "ESCALATED")

        resolved_count = auto_resolved + manually_resolved
        res_rate = round((resolved_count / total * 100), 1) if total > 0 else 0.0

        by_type = {}
        for x in self._data:
            t = x.get("exception_type", "UNKNOWN")
            by_type[t] = by_type.get(t, 0) + 1

        return {
            "total_exceptions": total,
            "high_risk_count": high,
            "medium_risk_count": med,
            "low_risk_count": low,
            "pending_count": pending,
            "auto_resolved_count": auto_resolved,
            "manually_resolved_count": manually_resolved,
            "escalated_count": escalated,
            "resolution_rate_pct": res_rate,
            "by_type": by_type
        }

    def reset_data(self):
        """Reset to the clean baseline seed — always restores all items to PENDING."""
        seed_file = SEED_FILE if os.path.exists(SEED_FILE) else DATA_FILE
        with open(seed_file, "r", encoding="utf-8") as f:
            self._data = json.load(f)
        self.save_data()

data_store = DataStore()
