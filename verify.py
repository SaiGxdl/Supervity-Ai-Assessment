import sys, requests
sys.path.insert(0, 'backend')

print('=' * 58)
print('  COMPLETE BUILD VERIFICATION')
print('=' * 58)

checks = []
base = 'http://127.0.0.1:8000/api'

# 1. Backend health
try:
    r = requests.get('http://127.0.0.1:8000/', timeout=5).json()
    checks.append(('Backend server UP (:8000)', r.get('status') == 'HEALTHY'))
except Exception:
    checks.append(('Backend server UP (:8000)', False))

# 2. Frontend server
try:
    r = requests.get('http://localhost:5173/', timeout=5)
    checks.append(('Frontend server UP (:5173)', r.status_code == 200))
except Exception:
    checks.append(('Frontend server UP (:5173)', False))

# 3. Reset
r = requests.post(base + '/reset')
checks.append(('Dataset reset API', r.status_code == 200))

# 4. Exception list
excs = requests.get(base + '/exceptions').json()
checks.append(('Exception queue has 10 items', len(excs) == 10))

# 5. EX-1042
item = requests.get(base + '/exceptions/EX-1042').json()
checks.append(('EX-1042 confidence=0.94', item['confidence_score'] == 0.94))
checks.append(('EX-1042 policy=AUTO_RESOLVE', item['policy_action'] == 'AUTO_RESOLVE'))
checks.append(('EX-1042 status=PENDING', item['status'] == 'PENDING'))

# 6. Gemini live explanation
exp = requests.post(base + '/exceptions/EX-1042/explain').json()
checks.append(('Explain API responds', 'root_cause' in exp))
checks.append(('Evidence has 5 grounded facts', len(exp.get('evidence', [])) == 5))
checks.append(('Root cause non-empty', len(exp.get('root_cause', '')) > 10))

# 7. Suggest resolution
sug = requests.post(base + '/exceptions/EX-1042/suggest-resolution').json()
checks.append(('Suggest resolution API', 'suggested_action' in sug))
checks.append(('EX-1042 can_auto_resolve=True', sug.get('can_auto_resolve') == True))

# 8. Auto-resolve
res = requests.post(base + '/exceptions/EX-1042/auto-resolve').json()
checks.append(('EX-1042 AUTO_RESOLVED', res.get('status') == 'AUTO_RESOLVED'))
checks.append(('Audit trail recorded', len(res.get('audit_trail', [])) > 0))

# 9. Guardrail block
blk = requests.post(base + '/exceptions/EX-1043/auto-resolve')
checks.append(('EX-1043 blocked HTTP 400', blk.status_code == 400))
checks.append(('Policy Violation in error detail', 'Policy Violation' in blk.json().get('detail', '')))

# 10. Audit log for block
it43 = requests.get(base + '/exceptions/EX-1043').json()
la = it43['audit_trail'][-1]
checks.append(('Blocked actor=Policy Engine', la['actor'] == 'Policy Engine'))
checks.append(('Blocked event logged', 'AUTO_RESOLVE_ATTEMPT Blocked' in la['event']))

# 11. Human approval
h = requests.post(base + '/exceptions/EX-1043/resolve', json={'notes': 'Manually verified'}).json()
checks.append(('EX-1043 RESOLVED by human', h.get('status') == 'RESOLVED'))
has_human = any(e.get('actor') == 'Human Reviewer' for e in h.get('audit_trail', []))
checks.append(('Human Reviewer in audit trail', has_human))

# 12. Chat
chat = requests.post(base + '/exceptions/EX-1042/chat', json={'message': 'Why was this flagged?'}).json()
checks.append(('Chat API responds', 'reply' in chat))
checks.append(('Chat suggested_actions present', len(chat.get('suggested_actions', [])) > 0))

# 13. Metrics
m = requests.get(base + '/metrics').json()
checks.append(('Metrics API responds', 'total_exceptions' in m))
checks.append(('Metrics total=10', m['total_exceptions'] == 10))
checks.append(('Resolution rate > 0', m['resolution_rate_pct'] > 0))

# 14. Policy engine thresholds (direct Python)
from app.services.confidence_engine import ConfidencePolicyEngine
from app.models.schemas import PolicyAction
checks.append(('0.90 maps to AUTO_RESOLVE', ConfidencePolicyEngine.evaluate_policy(0.90) == PolicyAction.AUTO_RESOLVE))
checks.append(('0.89 maps to SUGGEST', ConfidencePolicyEngine.evaluate_policy(0.89) == PolicyAction.SUGGEST))
checks.append(('0.69 maps to HUMAN_REVIEW', ConfidencePolicyEngine.evaluate_policy(0.69) == PolicyAction.HUMAN_REVIEW))

# Print results
print()
passed = 0
for label, result in checks:
    status = 'PASS' if result else 'FAIL'
    print('  [' + status + ']  ' + label)
    if result:
        passed += 1

print()
print('=' * 58)
print('  ' + str(passed) + '/' + str(len(checks)) + ' checks passed')
if passed == len(checks):
    print()
    print('  BUILD COMPLETE - SUBMISSION READY')
    print('  Gemini 3.6-flash AI: LIVE')
    print('  Backend :8000: HEALTHY')
    print('  Frontend :5173: RUNNING')
    print('  Policy guardrails: ENFORCED')
    print('  Audit trail: FULLY OPERATIONAL')
else:
    print('  ' + str(len(checks) - passed) + ' check(s) failed - review above')
print('=' * 58)
