import sql from "@/app/api/utils/sql";

export async function GET(request, { params }) {
  try {
    const { communityId } = params;
    
    // Get consumption data for CSV export
    const data = await sql`
      SELECT 
        u.unit_number,
        cr.reading_date,
        cr.water_usage,
        cr.electricity_usage,
        c.name as community_name
      FROM consumption_readings cr
      JOIN units u ON cr.unit_id = u.id
      JOIN communities c ON u.community_id = c.id
      WHERE u.community_id = ${communityId}
      ORDER BY u.unit_number, cr.reading_date DESC
    `;
    
    if (data.length === 0) {
      return Response.json({ error: 'No data found for this community' }, { status: 404 });
    }
    
    // Create CSV content
    const headers = ['Unit Number', 'Reading Date', 'Water Usage (gal)', 'Electricity Usage (kWh)', 'Community'];
    const csvRows = [headers.join(',')];
    
    data.forEach(row => {
      const csvRow = [
        row.unit_number,
        row.reading_date,
        row.water_usage,
        row.electricity_usage || '0',
        row.community_name
      ];
      csvRows.push(csvRow.join(','));
    });
    
    const csvContent = csvRows.join('\n');
    
    return new Response(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="community_${communityId}_consumption.csv"`
      }
    });
    
  } catch (error) {
    console.error('CSV export error:', error);
    return Response.json({ error: 'Failed to export CSV' }, { status: 500 });
  }
}