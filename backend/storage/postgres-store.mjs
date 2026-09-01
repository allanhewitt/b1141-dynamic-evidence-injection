import crypto from 'node:crypto';
import { validateConfig, transitionMatrix } from '../lib/dei-domain.mjs';

export class PostgresStore {
  constructor(pool) { this.pool = pool; }
  static async fromEnv() { const { Pool } = await import('pg'); return new PostgresStore(new Pool({ connectionString: process.env.DATABASE_URL })); }
  async close() { await this.pool.end(); }
  async upsertActivity(activity) {
    const config = validateConfig(activity.config);
    await this.pool.query(`INSERT INTO activities(id,title,model,schema_version,active,config,updated_at) VALUES($1,$2,'dei',$3,$4,$5::jsonb,now()) ON CONFLICT(id) DO UPDATE SET title=excluded.title,schema_version=excluded.schema_version,active=excluded.active,config=excluded.config,updated_at=now()`, [activity.id, activity.title, activity.schema_version ?? 1, Boolean(activity.active), JSON.stringify(config)]);
  }
  async getActivity(id,{requireActive=false}={}) { const {rows}=await this.pool.query(`SELECT * FROM activities WHERE id=$1 ${requireActive?'AND active=true':''}`,[id]); return rows[0]??null; }
  async getSession(id){const {rows}=await this.pool.query('SELECT * FROM activity_sessions WHERE id=$1',[id]);return rows[0]??null;}
  async getOpenSession(activityId){const {rows}=await this.pool.query(`SELECT * FROM activity_sessions WHERE activity_id=$1 AND status='open'`,[activityId]);return rows[0]??null;}
  async createSession(activityId){const activity=await this.getActivity(activityId,{requireActive:true});if(!activity)throw new Error('activity not found or inactive');const existing=await this.getOpenSession(activityId);if(existing)return existing;const id=crypto.randomUUID();const {rows}=await this.pool.query(`INSERT INTO activity_sessions(id,activity_id,status,config_snapshot,schema_version_snapshot) VALUES($1,$2,'open',$3::jsonb,$4) RETURNING *`,[id,activityId,JSON.stringify(activity.config),activity.schema_version]);return rows[0];}
  async closeSession(sessionId){const {rows}=await this.pool.query(`UPDATE activity_sessions SET status='closed',closed_at=now() WHERE id=$1 RETURNING *`,[sessionId]);return rows[0]??null;}
  async commitInitial(sessionId,participantHash,response){const session=await this.getSession(sessionId);if(!session||session.status!=='open')throw new Error('session is not open');await this.pool.query(`INSERT INTO dei_response_traces(id,session_id,participant_hash,initial_response) VALUES($1,$2,$3,$4) ON CONFLICT(session_id,participant_hash) DO NOTHING`,[crypto.randomUUID(),sessionId,participantHash,response]);return this.getTrace(sessionId,participantHash);}
  async markInformationSeen(sessionId,participantHash){const trace=await this.getTrace(sessionId,participantHash);if(!trace)throw new Error('initial response has not been committed');await this.pool.query(`UPDATE dei_response_traces SET information_seen_at=COALESCE(information_seen_at,now()) WHERE session_id=$1 AND participant_hash=$2`,[sessionId,participantHash]);return this.getTrace(sessionId,participantHash);}
  async commitRevised(sessionId,participantHash,response){const session=await this.getSession(sessionId);if(!session||session.status!=='open')throw new Error('session is not open');const trace=await this.getTrace(sessionId,participantHash);if(!trace)throw new Error('initial response has not been committed');if(!trace.information_seen_at)throw new Error('information review has not been completed');await this.pool.query(`UPDATE dei_response_traces SET revised_response=COALESCE(revised_response,$3),revised_committed_at=COALESCE(revised_committed_at,now()),completed_at=COALESCE(completed_at,now()) WHERE session_id=$1 AND participant_hash=$2`,[sessionId,participantHash,response]);return this.getTrace(sessionId,participantHash);}
  async getTrace(sessionId,participantHash){const {rows}=await this.pool.query(`SELECT * FROM dei_response_traces WHERE session_id=$1 AND participant_hash=$2`,[sessionId,participantHash]);return rows[0]??null;}
  async getCounts(sessionId){const {rows}=await this.pool.query(`SELECT COUNT(*)::int initial,COUNT(*) FILTER (WHERE information_seen_at IS NOT NULL)::int reviewed,COUNT(*) FILTER (WHERE revised_response IS NOT NULL)::int revised FROM dei_response_traces WHERE session_id=$1`,[sessionId]);return rows[0];}
  async getCompletedPairs(sessionId){const {rows}=await this.pool.query(`SELECT initial_response,revised_response FROM dei_response_traces WHERE session_id=$1 AND revised_response IS NOT NULL ORDER BY initial_committed_at,id`,[sessionId]);return rows;}
  async getResults(sessionId){return transitionMatrix(await this.getCompletedPairs(sessionId));}
}
