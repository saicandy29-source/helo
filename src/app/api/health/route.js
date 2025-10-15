import sql from "@/app/api/utils/sql";

export async function GET() {
  try {
    // Get counts for health check
    const [communitiesCount] = await sql`SELECT COUNT(*) as count FROM communities`;
    const [unitsCount] = await sql`SELECT COUNT(*) as count FROM units`;
    const [readingsCount] = await sql`SELECT COUNT(*) as count FROM consumption_readings`;
    
    return Response.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      database: {
        communities: parseInt(communitiesCount.count),
        units: parseInt(unitsCount.count),
        readings: parseInt(readingsCount.count)
      },
      version: '1.0.0'
    });
  } catch (error) {
    console.error('Health check failed:', error);
    return Response.json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: error.message
    }, { status: 500 });
  }
}