const pool = require('./config/db');
const { createRedisClient, getRedisClient } = require('./config/redis');
const { WAITLIST_JOBS, NOTIFICATION_JOBS, FAILED_JOBS } = require('./queues/keys');
const { WORKER } = require('./config/constants');
const { logAudit } = require('./services/auditLogger');
const promoteWaitlist = require('./jobs/promoteWaitlist');
const sendConfirmation = require('./jobs/sendConfirmation');

const HANDLERS = {
  [WAITLIST_JOBS]: promoteWaitlist,
  [NOTIFICATION_JOBS]: sendConfirmation,
};

let running = true;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function handleFailure(queue, job, err) {
  const attempts = (job.attempts || 0) + 1;
  console.error(`[worker] ${job.type} failed (attempt ${attempts}):`, err.message);

  if (attempts >= WORKER.MAX_JOB_ATTEMPTS) {
    await getRedisClient().lpush(FAILED_JOBS, JSON.stringify({ ...job, attempts, queue, error: err.message }));
    logAudit('JOB_FAILED', { queue, job, error: err.message });
    return;
  }

  await sleep(WORKER.RETRY_DELAY_MS);
  await getRedisClient().lpush(queue, JSON.stringify({ ...job, attempts }));
}

async function processJob(queue, raw) {
  let job;
  try {
    job = JSON.parse(raw);
  } catch {
    console.error('[worker] discarding malformed job:', raw);
    await getRedisClient().lpush(FAILED_JOBS, raw);
    return;
  }

  try {
    await HANDLERS[queue](job);
  } catch (err) {
    await handleFailure(queue, job, err);
  }
}

async function run() {
  const blockingClient = createRedisClient({ maxRetriesPerRequest: null });
  console.log('[worker] waiting for jobs (waitlist promotions, confirmations)');

  while (running) {
    try {
      const item = await blockingClient.brpop(WAITLIST_JOBS, NOTIFICATION_JOBS, WORKER.POLL_TIMEOUT_SECONDS);
      if (item) await processJob(item[0], item[1]);
    } catch (err) {
      console.error('[worker] queue error:', err.message);
      await sleep(WORKER.RETRY_DELAY_MS);
    }
  }

  blockingClient.disconnect();
  getRedisClient().disconnect();
  await pool.end();
  console.log('[worker] stopped');
}

function stop() {
  console.log('[worker] finishing the current job, then stopping');
  running = false;
}

process.on('SIGINT', stop);
process.on('SIGTERM', stop);

run();
