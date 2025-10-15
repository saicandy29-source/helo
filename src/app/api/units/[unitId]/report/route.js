import sql from "@/app/api/utils/sql";

export async function GET(request, { params }) {
  try {
    const { unitId } = params;
    
    // Get unit details
    const unitDetails = await sql`
      SELECT 
        u.id,
        u.unit_number,
        c.name as community_name
      FROM units u
      JOIN communities c ON u.community_id = c.id
      WHERE u.id = ${unitId}
    `;
    
    if (unitDetails.length === 0) {
      return Response.json({ error: 'Unit not found' }, { status: 404 });
    }
    
    // Get historical consumption data
    const consumption = await sql`
      SELECT 
        cr.reading_date,
        cr.water_usage,
        cr.electricity_usage
      FROM consumption_readings cr
      WHERE cr.unit_id = ${unitId}
      ORDER BY cr.reading_date DESC
      LIMIT 12
    `;
    
    // Get current month average
    const currentAvg = await sql`
      SELECT 
        ROUND(AVG(cr.water_usage), 2) as avg_water,
        ROUND(AVG(cr.electricity_usage), 2) as avg_electricity
      FROM consumption_readings cr
      WHERE cr.unit_id = ${unitId}
        AND cr.reading_date >= CURRENT_DATE - INTERVAL '30 days'
    `;
    
    // Get community average for comparison
    const communityAvg = await sql`
      SELECT 
        ROUND(AVG(cr.water_usage), 2) as community_avg_water,
        ROUND(AVG(cr.electricity_usage), 2) as community_avg_electricity
      FROM consumption_readings cr
      JOIN units u ON cr.unit_id = u.id
      JOIN units target_unit ON u.community_id = target_unit.community_id
      WHERE target_unit.id = ${unitId}
        AND cr.reading_date >= CURRENT_DATE - INTERVAL '30 days'
    `;
    
    const unit = unitDetails[0];
    const currentUsage = currentAvg[0] || { avg_water: 0, avg_electricity: 0 };
    const communityUsage = communityAvg[0] || { community_avg_water: 0, community_avg_electricity: 0 };
    
    // Calculate efficiency tips based on usage patterns
    const tips = [];
    const waterDiff = parseFloat(currentUsage.avg_water) - parseFloat(communityUsage.community_avg_water);
    const electricityDiff = parseFloat(currentUsage.avg_electricity) - parseFloat(communityUsage.community_avg_electricity);
    
    if (waterDiff > 20) {
      tips.push("Consider installing low-flow fixtures to reduce water usage");
      tips.push("Check for leaks in faucets and toilets");
    }
    
    if (electricityDiff > 20) {
      tips.push("Switch to LED bulbs to reduce electricity consumption");
      tips.push("Unplug electronics when not in use");
    }
    
    if (waterDiff <= 0 && electricityDiff <= 0) {
      tips.push("Great job! Your usage is below community average");
    }
    
    return Response.json({
      unit: {
        id: unit.id,
        unitNumber: unit.unit_number,
        communityName: unit.community_name
      },
      currentUsage: {
        water: parseFloat(currentUsage.avg_water) || 0,
        electricity: parseFloat(currentUsage.avg_electricity) || 0
      },
      communityAverage: {
        water: parseFloat(communityUsage.community_avg_water) || 0,
        electricity: parseFloat(communityUsage.community_avg_electricity) || 0
      },
      historicalData: consumption.map(item => ({
        date: item.reading_date,
        water: parseFloat(item.water_usage) || 0,
        electricity: parseFloat(item.electricity_usage) || 0
      })),
      tips
    });
  } catch (error) {
    console.error('Error generating unit report:', error);
    return Response.json({ error: 'Failed to generate unit report' }, { status: 500 });
  }
}