import sql from "@/app/api/utils/sql";

export async function GET(request, { params }) {
  try {
    const { id } = params;
    
    const consumption = await sql`
      SELECT 
        EXTRACT(MONTH FROM cr.reading_date) as month_num,
        TO_CHAR(cr.reading_date, 'Mon') as month,
        ROUND(AVG(cr.water_usage), 1) as water,
        ROUND(AVG(cr.electricity_usage), 1) as electricity
      FROM consumption_readings cr
      JOIN units u ON cr.unit_id = u.id
      WHERE u.community_id = ${id}
        AND cr.reading_date >= CURRENT_DATE - INTERVAL '12 months'
      GROUP BY EXTRACT(MONTH FROM cr.reading_date), TO_CHAR(cr.reading_date, 'Mon')
      ORDER BY month_num
    `;

    const formattedConsumption = consumption.map(item => ({
      month: item.month,
      water: parseFloat(item.water) || 0,
      electricity: parseFloat(item.electricity) || 0
    }));

    return Response.json(formattedConsumption);
  } catch (error) {
    console.error('Error fetching consumption data:', error);
    return Response.json({ error: 'Failed to fetch consumption data' }, { status: 500 });
  }
}