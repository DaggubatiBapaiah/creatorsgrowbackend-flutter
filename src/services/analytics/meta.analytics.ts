import { env } from '../../config/env';

export interface MetaInsights {
  followersCount: number;
  reach24h: number;
  impressions24h: number;
}

export interface MetaPostInsights {
  likes: number;
  comments: number;
  reach: number;
  impressions: number;
  saved: number;
}

export interface MetaAnalyticsClient {
  getAccountInsights(platformAccountId: string, accessToken: string): Promise<MetaInsights>;
  getPostInsights(externalMediaId: string, accessToken: string): Promise<MetaPostInsights>;
}

export class RealMetaAnalyticsClient implements MetaAnalyticsClient {
  async getAccountInsights(platformAccountId: string, accessToken: string): Promise<MetaInsights> {
    try {
      const profileUrl = `https://graph.instagram.com/v20.0/${platformAccountId}?fields=followers_count&access_token=${accessToken}`;
      const profileRes = await fetch(profileUrl);
      const profileData = await profileRes.json();
      
      const followersCount = profileData.followers_count || 0;
      
      const insightsUrl = `https://graph.instagram.com/v20.0/${platformAccountId}/insights?metric=reach,impressions,profile_views&period=day&access_token=${accessToken}`;
      const insightsRes = await fetch(insightsUrl);
      const insightsData = await insightsRes.json();
      
      let reach = 0;
      let impressions = 0;
      
      if (insightsData.data) {
        const reachMetric = insightsData.data.find((m: any) => m.name === 'reach');
        const impMetric = insightsData.data.find((m: any) => m.name === 'impressions');
        
        reach = reachMetric?.values?.[0]?.value || 0;
        impressions = impMetric?.values?.[0]?.value || 0;
      }
      
      return {
        followersCount: followersCount,
        reach24h: reach,
        impressions24h: impressions
      };
    } catch (error) {
      console.error('[MetaAnalytics] Profile Insights Error:', error);
      return { followersCount: 0, reach24h: 0, impressions24h: 0 };
    }
  }

  async getPostInsights(externalMediaId: string, accessToken: string): Promise<MetaPostInsights> {
    try {
      const mediaUrl = `https://graph.instagram.com/v20.0/${externalMediaId}?fields=like_count,comments_count&access_token=${accessToken}`;
      const mediaRes = await fetch(mediaUrl);
      const mediaData = await mediaRes.json();
      
      const likes = mediaData.like_count || 0;
      const comments = mediaData.comments_count || 0;
      
      const insightsUrl = `https://graph.instagram.com/v20.0/${externalMediaId}/insights?metric=reach,impressions,saved&access_token=${accessToken}`;
      const insightsRes = await fetch(insightsUrl);
      const insightsData = await insightsRes.json();
      
      let reach = 0;
      let impressions = 0;
      let saved = 0;
      
      if (insightsData.data) {
        const reachMetric = insightsData.data.find((m: any) => m.name === 'reach');
        const impMetric = insightsData.data.find((m: any) => m.name === 'impressions');
        const savedMetric = insightsData.data.find((m: any) => m.name === 'saved');
        
        reach = reachMetric?.values?.[0]?.value || 0;
        impressions = impMetric?.values?.[0]?.value || 0;
        saved = savedMetric?.values?.[0]?.value || 0;
      }
      
      return {
        likes,
        comments,
        reach,
        impressions,
        saved
      };
    } catch (error) {
      console.error('[MetaAnalytics] Post Insights Error:', error);
      return { likes: 0, comments: 0, reach: 0, impressions: 0, saved: 0 };
    }
  }
}

export class MockMetaAnalyticsClient implements MetaAnalyticsClient {
  async getAccountInsights(platformAccountId: string, accessToken: string): Promise<MetaInsights> {
    console.log(`[MOCK] Fetching account insights for ${platformAccountId}`);
    return {
      followersCount: Math.floor(Math.random() * 10000) + 1000,
      reach24h: Math.floor(Math.random() * 5000),
      impressions24h: Math.floor(Math.random() * 8000),
    };
  }

  async getPostInsights(externalMediaId: string, accessToken: string): Promise<MetaPostInsights> {
    console.log(`[MOCK] Fetching post insights for ${externalMediaId}`);
    return {
      likes: Math.floor(Math.random() * 500),
      comments: Math.floor(Math.random() * 50),
      reach: Math.floor(Math.random() * 1000),
      impressions: Math.floor(Math.random() * 1500),
      saved: Math.floor(Math.random() * 20),
    };
  }
}

export const metaAnalyticsClient: MetaAnalyticsClient = env.META_OAUTH_MODE === 'real'
  ? new RealMetaAnalyticsClient()
  : new MockMetaAnalyticsClient();
