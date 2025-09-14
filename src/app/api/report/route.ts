import { NextResponse } from 'next/server';

const AUTH_TOKEN = 'your_super_secret_auth_token';

interface GraphQLGroup {
  sum: {
    requests: number;
    bytes: number;
  };
}

// Cloudflare API functions
async function getZoneMetrics(zoneId: string, apiToken: string) {
  const last30Days = new Date();
  last30Days.setDate(last30Days.getDate() - 30);
  const sinceDate = last30Days.toISOString().split('T')[0];

  const graphqlQuery = `
    query getZoneMetrics($zoneTag: string, $sinceDate: string!) {
      viewer {
        zones(filter: {zoneTag: $zoneTag}) {
          httpRequests1dGroups(
            limit: 30,
            filter: {date_gt: $sinceDate}
          ) {
            sum {
              requests
              bytes
            }
          }
        }
      }
    }
  `;
  
  const headers = {
    'Authorization': `Bearer ${apiToken}`,
    'Content-Type': 'application/json'
  };

  try {
    const response = await fetch('https://api.cloudflare.com/client/v4/graphql', {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        query: graphqlQuery,
        variables: { 
          zoneTag: zoneId,
          sinceDate: sinceDate
        }
      })
    });
    
    // Check if the response was successful before parsing
    if (!response.ok) {
        const errorText = await response.text();
        console.error(`API response failed: ${response.status} - ${response.statusText}`, errorText);
        return null;
    }

    const data = await response.json();
    if (data.errors) {
      console.error(`Error fetching metrics for zone ${zoneId}:`, data.errors);
      return null;
    }
    
    const groups = data.data.viewer.zones[0].httpRequests1dGroups;
    if (!groups || groups.length === 0) {
      return { requests: 0, bandwidth: 0 };
    }
    
    let totalRequests = 0;
    let totalBandwidth = 0;
    
    groups.forEach((group: GraphQLGroup) => {
      totalRequests += group.sum.requests;
      totalBandwidth += group.sum.bytes;
    });

    return { 
      requests: totalRequests, 
      bandwidth: totalBandwidth,
    };
  } catch (error) {
    console.error(`Fetch failed for zone ${zoneId}:`, error);
    return null;
  }
}

async function getZones(apiToken: string) {
  const url = `https://api.cloudflare.com/client/v4/zones?per_page=50`;
  const headers = { 'Authorization': `Bearer ${apiToken}`, 'Content-Type': 'application/json' };
  
  try {
    const response = await fetch(url, { headers });
    const data = await response.json();
    if (!data.success) {
      console.error('Error fetching zones:', data.errors);
      return [];
    }
    return data.result;
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

  if (!apiToken) {
    return NextResponse.json({ error: 'API token not set.' }, { status: 500 });
  }

  const zones = await getZones(apiToken);
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
    zones: zones.map(zone => ({ id: zone.id, name: zone.name })),
    report,
    totals: {
      requests: totalRequests,
      bandwidth: totalBandwidth,
    }
  });
}
