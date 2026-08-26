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
    // 1. Get follower count from business account basic fields
    const profileUrl = `https://graph.facebook.com/v19.0/${platformAccountId}?fields=followers_count&access_token=${accessToken}`;
    const profileRes = await fetch(profileUrl);
    const profileData = await profileRes.json();

    if (!profileRes.ok) {
      throw new Error(`Meta Analytics Profile Fetch Failed: ${profileData.error?.message || 'Unknown error'}`);
    }

    // 2. Get insights (reach and impressions)
    const insightsUrl = `https://graph.facebook.com/v19.0/${platformAccountId}/insights?metric=reach,impressions&period=day&access_token=${accessToken}`;
    const insightsRes = await fetch(insightsUrl);
    const insightsData = await insightsRes.json();

    if (!insightsRes.ok) {
      throw new Error(`Meta Analytics Insights Fetch Failed: ${insightsData.error?.message || 'Unknown error'}`);
    }

    let reach = 0;
    let impressions = 0;

    for (const metric of insightsData.data || []) {
      if (metric.name === 'reach' && metric.values.length > 0) {
        reach = metric.values[0].value; // Latest day value
      }
      if (metric.name === 'impressions' && metric.values.length > 0) {
        impressions = metric.values[0].value;
      }
    }

    return {
      followersCount: profileData.followers_count || 0,
      reach24h: reach,
      impressions24h: impressions,
    };
  }

  async getPostInsights(externalMediaId: string, accessToken: string): Promise<MetaPostInsights> {
    // Basic media metrics
    const mediaUrl = `https://graph.facebook.com/v19.0/${externalMediaId}?fields=like_count,comments_count&access_token=${accessToken}`;
    const mediaRes = await fetch(mediaUrl);
    const mediaData = await mediaRes.json();

    if (!mediaRes.ok) {
      throw new Error(`Meta Analytics Media Fetch Failed: ${mediaData.error?.message || 'Unknown error'}`);
    }

    // Media insights
    const insightsUrl = `https://graph.facebook.com/v19.0/${externalMediaId}/insights?metric=reach,impressions,saved&access_token=${accessToken}`;
    const insightsRes = await fetch(insightsUrl);
    const insightsData = await insightsRes.json();

    let reach = 0;
    let impressions = 0;
    let saved = 0;

    if (insightsRes.ok && insightsData.data) {
      for (const metric of insightsData.data) {
        if (metric.name === 'reach' && metric.values.length > 0) reach = metric.values[0].value;
        if (metric.name === 'impressions' && metric.values.length > 0) impressions = metric.values[0].value;
        if (metric.name === 'saved' && metric.values.length > 0) saved = metric.values[0].value;
      }
    }

    return {
      likes: mediaData.like_count || 0,
      comments: mediaData.comments_count || 0,
      reach: reach,
      impressions: impressions,
      saved: saved,
    };
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
