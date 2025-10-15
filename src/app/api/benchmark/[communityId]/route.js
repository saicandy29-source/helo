import sql from "@/app/api/utils/sql";

export async function GET(request, { params }) {
  try {
    const { communityId } = params;
    
    // Get community average for the last month
    const avgResult = await sql`
      SELECT ROUND(AVG(cr.water_usage), 2) as community_average
      FROM consumption_readings cr
      JOIN units u ON cr.unit_id = u.id
      WHERE u.community_id = ${communityId}
        AND cr.reading_date >= CURRENT_DATE - INTERVAL '30 days'
    `;
    
    const communityAverage = parseFloat(avgResult[0]?.community_average) || 0;
    
    // Get unit comparisons
    const unitData = await sql`
      SELECT 
        u.id as unit_id,
        u.unit_number,
        ROUND(AVG(cr.water_usage), 2) as current_usage
      FROM units u
      LEFT JOIN consumption_readings cr ON u.id = cr.unit_id
      WHERE u.community_id = ${communityId}
        AND cr.reading_date >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY u.id, u.unit_number
      ORDER BY u.unit_number
    `;
    
    const unitComparisons = unitData.map(unit => {
      const currentUsage = parseFloat(unit.current_usage) || 0;
      const diffPercent = communityAverage > 0 
        ? ((currentUsage - communityAverage) / communityAverage * 100).toFixed(1)
        : '0.0';
      
      let status = 'normal';
      let message = 'Usage within normal range.';
      
      if (parseFloat(diffPercent) <= -10) {
        status = 'good';
        message = 'Great job! Below average usage.';
      } else if (parseFloat(diffPercent) > 5 && parseFloat(diffPercent) <= 20) {
        status = 'warning';
        message = 'Usage above average. Consider conservation.';
      } else if (parseFloat(diffPercent) > 20) {
        status = 'danger';
        message = 'High usage detected. Immediate action recommended.';
      }
      
      return {
        unitId: unit.unit_id,
        unitNumber: unit.unit_number,
        currentUsage,
        diffPercent,
        status,
        message
      };
    });
    
    return Response.json({
      communityAverage,
      unitComparisons
    });
  } catch (error) {
    console.error('Error calculating benchmark:', error);
    return Response.json({ error: 'Failed to calculate benchmark' }, { status: 500 });
  }
}