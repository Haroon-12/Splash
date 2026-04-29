const Database = require('better-sqlite3');
const db = new Database('local.db');

console.log("Before:");
console.log(db.prepare("SELECT id, brand_id, plan_type, status, current_period_end FROM subscriptions WHERE status = 'active'").all());

const result = db.prepare("UPDATE subscriptions SET current_period_end = ? WHERE status = 'active'").run(Date.now() - 100000);

console.log("After update:");
console.log(db.prepare("SELECT id, brand_id, plan_type, status, current_period_end FROM subscriptions WHERE status = 'active'").all());
