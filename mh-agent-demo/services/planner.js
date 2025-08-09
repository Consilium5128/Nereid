// services/planner.js
function schedulePlan(user, plan){
    // For demo: simply print scheduled actions to console and return an id
    console.log('--- Planner: scheduling plan for', user.id);
    console.log('Plan version:', plan.plan_version || plan.plan.plan_version);
    const nodes = (plan.plan && plan.plan.nodes) || plan.nodes || [];
    nodes.forEach(n => {
      console.log(` - Schedule ${n.type} (${n.id}) via ${n.channel}: ${n.content || JSON.stringify(n)}`);
    });
    return { scheduled: true, scheduledAt: new Date().toISOString() };
  }
  
  module.exports = { schedulePlan };