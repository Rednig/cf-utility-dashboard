import { NextResponse } from 'next/server';

const AUTH_TOKEN = 'your_super_secret_auth_token';

// Define specific interfaces for the Cloudflare API response
interface CloudflareZoneMetric {
  timeseries: {
    requests: { all: number };
    bandwidth: { all: number };
  }[];
}

interface CloudflareAPIResponse<T> {
  success: boolean;
  errors?: { message: string }[];
  result?: T;
}

interface CloudflareZone {
  id: string;
  name: string;
  status: string;
}

// Cloudflare API functions
async function getZoneMetrics(zoneId: string, apiToken: string) {
  const url = `https://api.cloudflare.com/client/v4/zones/${zoneId}/analytics/dashboard?since=-720`; // Last 12 hours
  const headers = { 'Authorization': `Bearer ${apiToken}`, 'Content-Type': 'application/json' };
  
  try {
    const response = await fetch(url, { headers });
    const data: CloudflareAPIResponse<CloudflareZoneMetric> = await response.json();
    if (!data.success) {
      console.error(`Error fetching metrics for zone ${zoneId}:`, data.errors);
      return null;
    }
    const metrics = data.result?.timeseries;
    if (!metrics || metrics.length === 0) {
      return { requests: 0, bandwidth: 0, cachedRequests: 0, cachedBandwidth: 0 };
    }
    
    let totalRequests = 0;
    let totalBandwidth = 0;
    metrics.forEach((timeSlot) => {
      totalRequests += timeSlot.requests.all;
      totalBandwidth += timeSlot.bandwidth.all;
    });

    return { requests: totalRequests, bandwidth: totalBandwidth };
  } catch (error) {
    console.error(`Fetch failed for zone ${zoneId}:`, error);
    return null;
  }
}

async function getZones(accountId: string, apiToken: string) {
  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/zones?status=active`;
  const headers = { 'Authorization': `Bearer ${apiToken}`, 'Content-Type': 'application/json' };

  try {
    const response = await fetch(url, { headers });
    const data: CloudflareAPIResponse<CloudflareZone[]> = await response.json();
    if (!data.success) {
      console.error('Error fetching zones:', data.errors);
      return [];
    }
    return data.result || [];
  } catch (error) {
    console.error('Fetch failed for zones:', error);
    return [];
  }
}

export async function GET(request: Request) {
  // Check for the authentication token in the request header
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ') || authHeader.substring(7) !== AUTH_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const apiToken = process.env.CLOUDFLARE_API_TOKEN;
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;

  if (!apiToken || !accountId) {
    return NextResponse.json({ error: 'API token or account ID not set.' }, { status: 500 });
  }

  const zones = await getZones(accountId, apiToken);
  if (zones.length === 0) {
    return NextResponse.json({ error: 'No zones found or error fetching zones.' }, { status: 500 });
  }

  const report = [];
  let totalRequests = 0;
  let totalBandwidth = 0;
  
  for (const zone of zones) {
    const metrics = await getZoneMetrics(zone.id, apiToken);
    if (metrics) {
      report.push({
        zoneName: zone.name,
        requests: metrics.requests,
        bandwidth: metrics.bandwidth,
      });
      totalRequests += metrics.requests;
      totalBandwidth += metrics.bandwidth;
    }
  }

  return NextResponse.json({
    report: report,
    totals: {
      requests: totalRequests,
      bandwidth: totalBandwidth,
    },
  });
}
