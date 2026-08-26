import { pool } from '../../config/db';

export interface GrowthScore {
  score: number | null; // null if insufficient data
  trend: 'up' | 'down' | 'flat' | 'none';
  change: number;
  factors: Array<{
    name: string;
    score: number;
    weight: number;
  }>;
}

export interface BestTimeScore {
  platform: string;
  dayOfWeek: number; // 0 (Sunday) to 6 (Saturday)
  hour: number; // 0 to 23
  score: number; // Avg reach or engagement relative score
  sampleSize: number;
}

export interface ContentFormatPerformance {
  format: string; // 'video', 'carousel', 'single_image'
  averageEngagementRate: number;
  averageReach: number;
  averageSaves: number;
  sampleSize: number;
}

export interface GrowthRecommendation {
  category: string;
  recommendation: string;
  reason: string;
  metric: {
    name: string;
    value: number;
    baseline: number;
  };
  confidence: number;
}

export class GrowthService {
  async calculateGrowthScore(userId: string): Promise<GrowthScore> {
    const insufficientDataResult: GrowthScore = {
      score: null,
      trend: 'none',
      change: 0,
      factors: [],
    };

    // We need social accounts
    const accountsRes = await pool.query(`SELECT id FROM social_accounts WHERE user_id = $1`, [userId]);
    if (accountsRes.rowCount === 0) return insufficientDataResult;
    const accountIds = accountsRes.rows.map(r => r.id);

    // Fetch snapshot history for the last 30 days and the 30 days before that
    const recentRes = await pool.query(`
      SELECT 
        AVG(reach_24h) as avg_reach,
        MAX(followers_count) as current_followers
      FROM social_account_snapshots
      WHERE social_account_id = ANY($1)
      AND collected_at >= NOW() - INTERVAL '30 days'
    `, [accountIds]);

    const previousRes = await pool.query(`
      SELECT 
        AVG(reach_24h) as avg_reach,
        MAX(followers_count) as old_followers
      FROM social_account_snapshots
      WHERE social_account_id = ANY($1)
      AND collected_at >= NOW() - INTERVAL '60 days'
      AND collected_at < NOW() - INTERVAL '30 days'
    `, [accountIds]);

    const recent = recentRes.rows[0];
    const previous = previousRes.rows[0];

    // If we have literally 0 metrics, return insufficient
    if (!recent.current_followers && !recent.avg_reach) {
        return insufficientDataResult;
    }

    // Baseline calculation (very simple deterministic model for score)
    let score = 50; // Starting baseline
    const factors = [];

    // Follower Trend (Weight: 40%)
    let followerScore = 50;
    if (recent.current_followers && previous.old_followers) {
        const growth = (recent.current_followers - previous.old_followers) / Math.max(previous.old_followers, 1);
        if (growth > 0.05) followerScore = 90;
        else if (growth > 0) followerScore = 70;
        else if (growth < 0) followerScore = 30;
    } else if (recent.current_followers > 0) {
        followerScore = 60; // Has followers but no history
    }
    factors.push({ name: 'Follower Growth', score: followerScore, weight: 0.4 });
    
    // Reach Trend (Weight: 30%)
    let reachScore = 50;
    if (recent.avg_reach && previous.avg_reach) {
        if (recent.avg_reach > previous.avg_reach * 1.1) reachScore = 85;
        else if (recent.avg_reach > previous.avg_reach) reachScore = 65;
        else if (recent.avg_reach < previous.avg_reach * 0.9) reachScore = 35;
    } else if (recent.avg_reach > 0) {
        reachScore = 60;
    }
    factors.push({ name: 'Reach Trend', score: reachScore, weight: 0.3 });

    // Publishing Consistency (Weight: 30%)
    const postCountRes = await pool.query(`
      SELECT COUNT(*) as post_count 
      FROM content_posts 
      WHERE user_id = $1 
      AND status = 'published' 
      AND published_at >= NOW() - INTERVAL '14 days'
    `, [userId]);
    const postCount = parseInt(postCountRes.rows[0].post_count, 10);
    
    let consistencyScore = 50;
    if (postCount >= 4) consistencyScore = 90; // Approx 2/week
    else if (postCount >= 2) consistencyScore = 70;
    else if (postCount === 0) consistencyScore = 20;
    
    factors.push({ name: 'Publishing Consistency', score: consistencyScore, weight: 0.3 });

    // Final Weighted Score
    score = Math.round(
      factors.reduce((acc, f) => acc + (f.score * f.weight), 0)
    );

    // Naive mock change for UI (since we don't store historical overall scores yet)
    let trend: 'up' | 'down' | 'flat' | 'none' = 'flat';
    if (score > 70) trend = 'up';
    if (score < 40) trend = 'down';

    return {
      score,
      trend,
      change: trend === 'up' ? 5 : (trend === 'down' ? -5 : 0), 
      factors,
    };
  }

  async calculateBestTimesToPost(userId: string): Promise<BestTimeScore[]> {
    // Join posts with snapshots to get reach and engagement by hour and dow
    const query = `
      WITH PostStats AS (
        SELECT 
          p.platform,
          EXTRACT(DOW FROM p.published_at) as day_of_week,
          EXTRACT(HOUR FROM p.published_at) as hour_of_day,
          COALESCE(s.reach, 0) as reach,
          COALESCE(s.engagement_rate, 0) as engagement_rate
        FROM content_posts p
        LEFT JOIN content_post_snapshots s ON p.id = s.post_id
        WHERE p.user_id = $1 AND p.status = 'published' AND p.published_at IS NOT NULL
      )
      SELECT 
        platform,
        day_of_week,
        hour_of_day,
        COUNT(*) as sample_size,
        AVG(reach) as avg_reach,
        AVG(engagement_rate) as avg_engagement
      FROM PostStats
      GROUP BY platform, day_of_week, hour_of_day
      HAVING COUNT(*) >= 2 -- Minimum sample size protection
      ORDER BY avg_engagement DESC, avg_reach DESC
      LIMIT 10
    `;
    const res = await pool.query(query, [userId]);
    
    return res.rows.map(r => ({
      platform: r.platform,
      dayOfWeek: parseInt(r.day_of_week, 10),
      hour: parseInt(r.hour_of_day, 10),
      score: parseFloat(r.avg_engagement) * 100 + (parseInt(r.avg_reach, 10) / 1000), // simplistic combined score metric
      sampleSize: parseInt(r.sample_size, 10),
    }));
  }

  async analyzeContentPerformance(userId: string): Promise<{
    formats: ContentFormatPerformance[],
    overallAverageEngagement: number,
    overallAverageReach: number,
  }> {
    const query = `
      WITH PostData AS (
        SELECT 
          p.id,
          p.media_ids,
          COALESCE(s.reach, 0) as reach,
          COALESCE(s.engagement_rate, 0) as engagement_rate,
          COALESCE(s.saved, 0) as saved,
          (
            SELECT COUNT(*) FROM media_assets m 
            WHERE m.id = ANY(p.media_ids) AND m.type = 'video'
          ) as video_count
        FROM content_posts p
        LEFT JOIN content_post_snapshots s ON p.id = s.post_id
        WHERE p.user_id = $1 AND p.status = 'published'
      ),
      Categorized AS (
        SELECT 
          reach, engagement_rate, saved,
          CASE 
            WHEN video_count > 0 THEN 'video'
            WHEN array_length(media_ids, 1) > 1 THEN 'carousel'
            ELSE 'single_image'
          END as format
        FROM PostData
      )
      SELECT 
        format,
        COUNT(*) as sample_size,
        AVG(engagement_rate) as avg_engagement,
        AVG(reach) as avg_reach,
        AVG(saved) as avg_saved
      FROM Categorized
      GROUP BY format
    `;

    const res = await pool.query(query, [userId]);
    
    let totalEng = 0;
    let totalReach = 0;
    let totalSamples = 0;

    const formats = res.rows.map(r => {
      const sample = parseInt(r.sample_size, 10);
      const eng = parseFloat(r.avg_engagement);
      const reach = parseFloat(r.avg_reach);

      totalEng += eng * sample;
      totalReach += reach * sample;
      totalSamples += sample;

      return {
        format: r.format,
        averageEngagementRate: eng,
        averageReach: reach,
        averageSaves: parseFloat(r.avg_saved),
        sampleSize: sample
      };
    });

    return {
      formats,
      overallAverageEngagement: totalSamples > 0 ? totalEng / totalSamples : 0,
      overallAverageReach: totalSamples > 0 ? totalReach / totalSamples : 0,
    };
  }

  async generateRecommendations(userId: string): Promise<GrowthRecommendation[]> {
    const analysis = await this.analyzeContentPerformance(userId);
    const recs: GrowthRecommendation[] = [];

    if (analysis.formats.length === 0) return recs;

    // 1. Content Format Recommendations
    for (const f of analysis.formats) {
      if (f.sampleSize >= 2) {
        if (f.averageEngagementRate > analysis.overallAverageEngagement * 1.15) {
          recs.push({
            category: 'content_format',
            recommendation: `Publish more ${f.format}s`,
            reason: `Your ${f.format}s generate above-average engagement.`,
            metric: {
              name: 'engagement_rate',
              value: f.averageEngagementRate,
              baseline: analysis.overallAverageEngagement
            },
            confidence: Math.min(0.95, 0.5 + (f.sampleSize * 0.05))
          });
        }
      }
    }

    // 2. Best Time Recommendation
    const bestTimes = await this.calculateBestTimesToPost(userId);
    if (bestTimes.length > 0) {
      const best = bestTimes[0];
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      recs.push({
        category: 'timing',
        recommendation: `Publish on ${days[best.dayOfWeek]}s at ${best.hour}:00`,
        reason: 'Your audience responds strongly to content published in this window.',
        metric: {
          name: 'relative_score',
          value: best.score,
          baseline: 0
        },
        confidence: Math.min(0.9, 0.6 + (best.sampleSize * 0.05))
      });
    }

    // 3. Consistency Recommendation
    const postCountRes = await pool.query(`
      SELECT COUNT(*) as post_count 
      FROM content_posts 
      WHERE user_id = $1 
      AND status = 'published' 
      AND published_at >= NOW() - INTERVAL '14 days'
    `, [userId]);
    const postCount = parseInt(postCountRes.rows[0].post_count, 10);
    
    if (postCount < 2) {
      recs.push({
        category: 'consistency',
        recommendation: 'Increase your publishing frequency',
        reason: 'Your posting consistency has been very low over the last 14 days, limiting reach.',
        metric: {
          name: 'posts_last_14d',
          value: postCount,
          baseline: 4
        },
        confidence: 0.8
      });
    }

    // Sort by confidence DESC and return top 5
    return recs.sort((a, b) => b.confidence - a.confidence).slice(0, 5);
  }
}
