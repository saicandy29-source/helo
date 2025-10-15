import sql from "@/app/api/utils/sql";

export async function GET() {
  try {
    const communities = await sql`
      SELECT 
        c.id,
        c.name,
        COUNT(u.id) as unit_count,
        ROUND(AVG(cr.water_usage), 2) as avg_consumption
      FROM communities c
      LEFT JOIN units u ON c.id = u.community_id
      LEFT JOIN consumption_readings cr ON u.id = cr.unit_id
      WHERE cr.reading_date >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY c.id, c.name
      ORDER BY c.name
    `;

    const formattedCommunities = communities.map(community => ({
      id: community.id,
      name: community.name,
      unitCount: parseInt(community.unit_count) || 0,
      avgConsumption: parseFloat(community.avg_consumption) || 0
    }));

    return Response.json(formattedCommunities);
  } catch (error) {
    console.error('Error fetching communities:', error);
    return Response.json({ error: 'Failed to fetch communities' }, { status: 500 });
  }
}