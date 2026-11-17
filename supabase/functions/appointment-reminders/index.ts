import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function sendWhatsAppMessage(phone: string, message: string) {
  const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID')
  const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN')
  const twilioWhatsAppNumber = Deno.env.get('TWILIO_WHATSAPP_NUMBER') || 'whatsapp:+14155238886'

  if (!twilioAccountSid || !twilioAuthToken) {
    console.error('Twilio credentials not configured')
    return false
  }

  // Clean phone number and add whatsapp prefix
  const cleanPhone = phone.replace(/\D/g, '')
  const whatsappNumber = `whatsapp:+${cleanPhone}`

  const url = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`
  const auth = btoa(`${twilioAccountSid}:${twilioAuthToken}`)

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        From: twilioWhatsAppNumber,
        To: whatsappNumber,
        Body: message,
      }),
    })

    if (response.ok) {
      console.log(`WhatsApp message sent successfully to ${whatsappNumber}`)
      return true
    } else {
      const error = await response.text()
      console.error(`Failed to send WhatsApp message: ${error}`)
      return false
    }
  } catch (error) {
    console.error('Error sending WhatsApp message:', error)
    return false
  }
}

function formatAppointmentMessage(appointment: any, reminderType: '24h' | '1h') {
  const appointmentDate = new Date(appointment.appointment_date)
  const formattedDate = appointmentDate.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
  const formattedTime = appointmentDate.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit'
  })

  const reminderText = reminderType === '24h' 
    ? 'Recordatorio: Tienes un turno programado para mañana'
    : '¡RECORDATORIO URGENTE! Tu turno es en 1 hora'

  return `${reminderText}

📅 Fecha: ${formattedDate}
🕐 Hora: ${formattedTime}
🔧 Servicio: ${appointment.service_type}
${appointment.vehicle_info ? `🚗 Vehículo: ${appointment.vehicle_info}` : ''}

${appointment.notes ? `📝 Notas: ${appointment.notes}` : ''}

Por favor confirma tu asistencia respondiendo a este mensaje.
¡Te esperamos!

AutoService - Tu taller de confianza`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get current time with buffer zones for reminders
    const now = new Date()
    const oneDayFromNow = new Date(now.getTime() + (24 * 60 * 60 * 1000) + (30 * 60 * 1000)) // 24h + 30min buffer
    const oneDayAgo = new Date(now.getTime() + (24 * 60 * 60 * 1000) - (30 * 60 * 1000)) // 24h - 30min buffer
    const oneHourFromNow = new Date(now.getTime() + (60 * 60 * 1000) + (15 * 60 * 1000)) // 1h + 15min buffer
    const oneHourAgo = new Date(now.getTime() + (60 * 60 * 1000) - (15 * 60 * 1000)) // 1h - 15min buffer

    // Find appointments that need 24h reminders (within the buffer window)
    const { data: appointments24h } = await supabaseClient
      .from('appointments')
      .select(`
        *,
        clients (first_name, last_name, phone)
      `)
      .gte('appointment_date', oneDayAgo.toISOString())
      .lte('appointment_date', oneDayFromNow.toISOString())
      .eq('reminder_sent_24h', false)
      .in('status', ['scheduled', 'confirmed'])

    // Find appointments that need 1h reminders (within the buffer window)
    const { data: appointments1h } = await supabaseClient
      .from('appointments')
      .select(`
        *,
        clients (first_name, last_name, phone)
      `)
      .gte('appointment_date', oneHourAgo.toISOString())
      .lte('appointment_date', oneHourFromNow.toISOString())
      .eq('reminder_sent_1h', false)
      .in('status', ['scheduled', 'confirmed'])

    let remindersSent = 0
    let errors = []

    // Process 24h reminders
    if (appointments24h) {
      for (const appointment of appointments24h) {
        if (appointment.clients?.phone) {
          const message = formatAppointmentMessage(appointment, '24h')
          const sent = await sendWhatsAppMessage(appointment.clients.phone, message)
          
          if (sent) {
            await supabaseClient
              .from('appointments')
              .update({ reminder_sent_24h: true })
              .eq('id', appointment.id)
            
            remindersSent++
            console.log(`24h reminder sent for appointment ${appointment.id}`)
          } else {
            errors.push(`Failed to send 24h reminder for appointment ${appointment.id}`)
          }
        }
      }
    }

    // Process 1h reminders
    if (appointments1h) {
      for (const appointment of appointments1h) {
        if (appointment.clients?.phone) {
          const message = formatAppointmentMessage(appointment, '1h')
          const sent = await sendWhatsAppMessage(appointment.clients.phone, message)
          
          if (sent) {
            await supabaseClient
              .from('appointments')
              .update({ reminder_sent_1h: true })
              .eq('id', appointment.id)
            
            remindersSent++
            console.log(`1h reminder sent for appointment ${appointment.id}`)
          } else {
            errors.push(`Failed to send 1h reminder for appointment ${appointment.id}`)
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        remindersSent,
        message: `Processed ${remindersSent} appointment reminders`
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error processing reminders:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})