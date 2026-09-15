/**
 * src/services/supabaseClient.ts
 * ==============================
 * Supabase Realtime (Postgres Change Data Capture) & Resilient Live Stream.
 *
 * Listens to `postgres_changes` on the `ward_risk_index` table via Supabase WebSockets.
 * If Supabase environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY) are
 * not configured or in offline demo mode, seamlessly activates the local Server-Sent
 * Events (SSE) broadcast stream at `/api/v1/realtime/ward-stream`.
 */

export interface WardRiskChangeEvent {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE' | 'SIMULATION';
  table: string;
  record: any;
  timestamp: string;
  source: 'supabase_realtime_cdc' | 'local_sensor_stream';
}

// Read environment variables (supports Vite import.meta.env or window overrides)
const SUPABASE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) || '';
const SUPABASE_ANON_KEY = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) || '';

let activeChannel: any = null;
let sseEventSource: EventSource | null = null;

/**
 * Subscribes to Realtime updates on the `ward_risk_index` table.
 * Returns an unsubscribe teardown function.
 */
export function subscribeToWardRiskUpdates(
  onUpdate: (event: WardRiskChangeEvent) => void,
  onConnectionStatus?: (status: 'connected' | 'reconnecting' | 'disconnected', channelType: string) => void
): () => void {
  const hasSupabaseCreds = Boolean(
    SUPABASE_URL && 
    SUPABASE_ANON_KEY && 
    SUPABASE_URL !== 'YOUR_SUPABASE_URL' &&
    SUPABASE_URL.startsWith('http')
  );

  if (hasSupabaseCreds) {
    // Attempt dynamic Supabase Realtime Channel import
    import('@supabase/supabase-js')
      .then(({ createClient }) => {
        try {
          const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            realtime: {
              params: {
                eventsPerSecond: 10,
              },
            },
          });

          console.log('⚡ [Supabase Realtime] Connecting to channel for public:ward_risk_index...');
          activeChannel = supabase
            .channel('realtime_ward_risk_index')
            .on(
              'postgres_changes',
              { event: '*', schema: 'public', table: 'ward_risk_index' },
              (payload: any) => {
                console.log('⚡ [Supabase Realtime CDC] Table change detected:', payload);
                const event: WardRiskChangeEvent = {
                  eventType: payload.eventType || 'UPDATE',
                  table: payload.table || 'ward_risk_index',
                  record: payload.new || payload.record || payload,
                  timestamp: new Date().toISOString(),
                  source: 'supabase_realtime_cdc',
                };
                onUpdate(event);
              }
            )
            .subscribe((status: string) => {
              console.log(`⚡ [Supabase Realtime] Channel status: ${status}`);
              if (onConnectionStatus) {
                onConnectionStatus(
                  status === 'SUBSCRIBED' ? 'connected' : 'reconnecting',
                  'Supabase Realtime WebSocket (PostgreSQL CDC)'
                );
              }
            });
        } catch (err) {
          console.warn('[Supabase Realtime] Failed initializing cloud client, falling back to local stream:', err);
          connectLocalSSE(onUpdate, onConnectionStatus);
        }
      })
      .catch(() => {
        console.info('[Supabase Realtime] @supabase/supabase-js not installed, using live SSE broadcast stream.');
        connectLocalSSE(onUpdate, onConnectionStatus);
      });
  } else {
    // Zero-config live demo mode using local Server-Sent Events (SSE)
    console.info('⚡ [Realtime] Live telemetry channel active via SentinelX EventStream.');
    connectLocalSSE(onUpdate, onConnectionStatus);
  }

  // Return unsubscribe handler
  return () => {
    if (activeChannel && typeof activeChannel.unsubscribe === 'function') {
      activeChannel.unsubscribe();
      activeChannel = null;
    }
    if (sseEventSource) {
      sseEventSource.close();
      sseEventSource = null;
    }
  };
}

/**
 * Connects to local Server-Sent Events (SSE) stream for infallible offline SIH demos.
 */
function connectLocalSSE(
  onUpdate: (event: WardRiskChangeEvent) => void,
  onConnectionStatus?: (status: 'connected' | 'reconnecting' | 'disconnected', channelType: string) => void
) {
  if (typeof window === 'undefined' || !window.EventSource) return;

  try {
    if (sseEventSource) {
      sseEventSource.close();
    }

    const sse = new EventSource('/api/v1/realtime/ward-stream');
    sseEventSource = sse;

    sse.onopen = () => {
      console.log('⚡ [Realtime Stream] Connected to /api/v1/realtime/ward-stream');
      if (onConnectionStatus) {
        onConnectionStatus('connected', 'Live Telemetry EventStream (Active CDC Sync)');
      }
    };

    sse.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data && (data.ward_no || data.record)) {
          const event: WardRiskChangeEvent = {
            eventType: data.eventType || 'UPDATE',
            table: 'ward_risk_index',
            record: data.record || data,
            timestamp: data.timestamp || new Date().toISOString(),
            source: 'local_sensor_stream',
          };
          onUpdate(event);
        }
      } catch (err) {
        // silent ping
      }
    };

    sse.onerror = () => {
      if (onConnectionStatus) {
        onConnectionStatus('reconnecting', 'EventStream Reconnecting...');
      }
    };
  } catch (err) {
    console.error('[Realtime Stream] SSE connection error:', err);
  }
}
