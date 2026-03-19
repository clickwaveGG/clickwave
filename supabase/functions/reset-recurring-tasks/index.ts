import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Services that reset monthly (video/design/posts)
const RESETTABLE_SERVICES = [
  'vídeos', 'videos', 'posts / design', 'posts/design', 'branding',
  'gestão de redes sociais', 'gestao de redes sociais',
];

// Services that are perpetual (no reset)
const PERPETUAL_SERVICES = ['tráfego pago', 'trafego pago'];

// Services that are one-time (no reset)
const ONETIME_SERVICES = ['site / landing page', 'site/landing page', 'automações / chatbot', 'automacoes / chatbot'];

function isResettable(serviceName: string): boolean {
  const lower = serviceName.toLowerCase().trim();
  return RESETTABLE_SERVICES.some(s => lower.includes(s));
}

Deno.serve(async (req) => {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const now = new Date();

    // Fetch all non-completed client_services with quantity_per_month
    const { data: services, error: sErr } = await supabase
      .from('client_services')
      .select('*, clients!client_services_client_id_fkey(name)')
      .eq('completed', false)
      .not('quantity_per_month', 'is', null);

    if (sErr) throw sErr;
    if (!services || services.length === 0) {
      return new Response(JSON.stringify({ message: 'No services to reset', count: 0 }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const tasksToInsert: any[] = [];
    const serviceUpdates: string[] = [];

    for (const svc of services) {
      if (!isResettable(svc.service_name)) continue;
      if (!svc.quantity_per_month || svc.quantity_per_month <= 0) continue;

      const createdAt = new Date(svc.created_at);
      const cycleDay = createdAt.getDate(); // Day of month when cycle starts

      // Check if today is the cycle day (or past it) and we haven't reset this month yet
      const todayDay = now.getDate();
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), cycleDay);
      
      // If cycle day hasn't arrived this month yet, skip
      if (todayDay < cycleDay) continue;

      // Check if already reset this cycle
      if (svc.last_reset_at) {
        const lastReset = new Date(svc.last_reset_at);
        // If last reset was in this month (same year+month), skip
        if (lastReset.getFullYear() === now.getFullYear() && lastReset.getMonth() === now.getMonth()) {
          continue;
        }
      }

      // Generate tasks for this service
      const clientName = svc.clients?.name || 'Cliente';
      const qty = svc.quantity_per_month;
      const responsibleId = svc.responsible_id;

      for (let i = 0; i < qty; i++) {
        tasksToInsert.push({
          title: qty > 1
            ? `${svc.service_name} ${i + 1}/${qty} — ${clientName}`
            : `${svc.service_name} — ${clientName}`,
          client_name: clientName,
          assigned_to: responsibleId,
          created_by: responsibleId || svc.responsible_id,
          price: svc.price ? Number(svc.price) / qty : null,
          status: 'todo',
          priority: 'medium',
        });
      }

      serviceUpdates.push(svc.id);
    }

    // Insert new tasks
    if (tasksToInsert.length > 0) {
      const { error: tErr } = await supabase.from('tasks').insert(tasksToInsert);
      if (tErr) throw tErr;
    }

    // Update last_reset_at for processed services
    if (serviceUpdates.length > 0) {
      const { error: uErr } = await supabase
        .from('client_services')
        .update({ last_reset_at: now.toISOString() })
        .in('id', serviceUpdates);
      if (uErr) throw uErr;
    }

    return new Response(
      JSON.stringify({
        message: `Reset complete`,
        tasks_created: tasksToInsert.length,
        services_reset: serviceUpdates.length,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
