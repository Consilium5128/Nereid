// services/planner.js
function schedulePlan(user, planEnvelope) {
  console.log('--- Planner: scheduling plan for', user.id);

  // read version from envelope or nested plan
  const version =
    (planEnvelope && planEnvelope.plan_version) ||
    (planEnvelope && planEnvelope.plan && planEnvelope.plan.plan_version) ||
    'unknown';
  console.log('Plan version:', version);

  // support both: { plan: { nodes: [...] } } OR { plan: { track/maintain/... } } OR just { nodes: [...] }
  const planBody = (planEnvelope && planEnvelope.plan) ? planEnvelope.plan : planEnvelope;

  // 1) Node-style plans
  const nodes = (planBody && planBody.nodes) || [];
  if (nodes.length) {
    nodes.forEach(n => {
      console.log(
        ` - Schedule ${n.type || 'action'} (${n.id || 'no-id'}) via ${n.channel || 'app'}: ${n.content || JSON.stringify(n)}`
      );
    });
    return { scheduled: true, items: nodes.length, version, scheduledAt: new Date().toISOString() };
  }

  // 2) Track/Maintain-style plans (what your DPGA returned)
  const actions = [];
  if (Array.isArray(planBody?.track)) {
    planBody.track.forEach(t => actions.push({ type: 'track', content: t }));
  }
  if (Array.isArray(planBody?.maintain)) {
    planBody.maintain.forEach(t => actions.push({ type: 'maintain', content: t }));
  }
  if (planBody?.escalation) {
    actions.push({ type: 'escalation', content: 'Follow escalation protocol if criteria met' });
  }

  actions.forEach(a => console.log(` - ${a.type}: ${a.content}`));
  return { scheduled: true, items: actions.length, version, scheduledAt: new Date().toISOString() };
}

module.exports = { schedulePlan };