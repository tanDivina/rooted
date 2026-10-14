import { AnthropicBedrock } from '@anthropic-ai/bedrock-sdk'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns'
import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2'
import { z } from 'zod'
import type { CareIncident } from '../types/care'

/**
 * Step 2 of the check-in: tell the family, and have a brief ready for paramedics.
 *
 * Claude on Amazon Bedrock writes both from the incident record alone. Without AWS
 * credentials, or if Bedrock is unreachable, an honest template stands in, so the demo
 * never depends on the network. The 911 dispatch stays simulated: this module only ever
 * contacts the family numbers and addresses configured in .env.local.
 */

// Claude Opus 4.5 is the newest Claude this AWS account can use on Bedrock today.
// Set BEDROCK_MODEL=us.anthropic.claude-opus-5-5 once AWS enables Opus 5.5 for the account.
const MODEL = process.env.BEDROCK_MODEL || 'us.anthropic.claude-opus-4-5-20251101-v1:0'
const REGION = process.env.AWS_REGION || 'us-east-1'
const hasAws = Boolean(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY)

const ZONES: Record<string, string> = {
  fall_detected: 'Living room',
  slip_inactivity: 'Living room',
  stove_unattended: 'Kitchen',
  voice_distress: 'Living room (camera audio)',
  heartbeat_loss: 'Whole home (camera offline)',
  routine_inactivity: 'Bedroom',
  smoke_co_alarm: 'Kitchen',
  medication_missed: 'Medicine cabinet',
  night_wandering: 'Front door',
}

const Brief = z.object({
  familySubject: z.string().describe('Email subject, under 70 characters'),
  familyMessage: z.string().describe('Text message to the family, under 300 characters'),
  paramedicBrief: z.string().describe('Plain-text brief for first responders'),
})
export type CareBrief = z.infer<typeof Brief> & { source: 'bedrock' | 'template' }

const SYSTEM = `You write two short messages for Rooted, a home-safety app that watches a Ring camera in an older adult's home.

Use only the facts in the incident record you are given. Never add symptoms, injuries, vital signs, medical history or anything the camera could not have seen. Say plainly what was detected and how sure the detector was. Detection is automated and can be wrong, so phrase it as what the camera saw, not as a diagnosis.

familyMessage: warm, calm and direct, for a son or daughter reading it on a phone. Say what happened, where, and when, and that Rooted has not had an answer from the person yet. Suggest calling them or opening the live view. Under 300 characters, no emoji.

paramedicBrief: plain text for first responders, short labeled lines: what was detected, location in the home, time, detector confidence, how long without a response, and the escalation steps taken so far. End with one line noting that the record comes from an automated camera detector.`

function localTime(ts: number) {
  return new Date(ts).toLocaleString('en-US', { timeZoneName: 'short' })
}

function recordFor(incident: CareIncident, unansweredSeconds: number) {
  return {
    type: incident.type,
    title: incident.title,
    description: incident.description,
    location: ZONES[incident.type] || 'Home',
    detectedAt: localTime(incident.timestamp),
    detectorConfidence: `${Math.round(incident.confidence * 100)}%`,
    secondsWithoutAnswer: unansweredSeconds,
    stepsTaken: ['Chime played in the home', 'No “I’m okay” received', 'Family being contacted now'],
  }
}

function template(incident: CareIncident, unansweredSeconds: number): CareBrief {
  const r = recordFor(incident, unansweredSeconds)
  return {
    source: 'template',
    familySubject: `Rooted: ${incident.title}`,
    familyMessage: `Rooted noticed: ${incident.title.toLowerCase()} at ${r.detectedAt}. There has been no answer to the check-in for ${unansweredSeconds} seconds. Please call, or open the live view.`,
    paramedicBrief: [
      `DETECTED: ${incident.title}`,
      `DETAIL: ${incident.description}`,
      `LOCATION: ${r.location}`,
      `TIME: ${r.detectedAt}`,
      `DETECTOR CONFIDENCE: ${r.detectorConfidence}`,
      `NO RESPONSE FOR: ${unansweredSeconds} s`,
      `STEPS TAKEN: chime in the home; no “I’m okay”; family contacted`,
      `SOURCE: automated Ring camera detector (Rooted). Not a medical assessment.`,
    ].join('\n'),
  }
}

let bedrock: AnthropicBedrock | null = null

/** Family message and paramedic brief, written by Claude on Bedrock when available. */
export async function writeBrief(incident: CareIncident, unansweredSeconds = 30): Promise<CareBrief> {
  if (!hasAws) return template(incident, unansweredSeconds)
  try {
    bedrock ??= new AnthropicBedrock({ awsRegion: REGION })
    const response = await bedrock.messages.parse(
      {
        model: MODEL,
        max_tokens: 4000,
        output_config: { format: zodOutputFormat(Brief) },
        system: SYSTEM,
        messages: [{ role: 'user', content: JSON.stringify(recordFor(incident, unansweredSeconds), null, 2) }],
      },
      { timeout: 20_000 }
    )
    if (response.stop_reason === 'refusal' || !response.parsed_output) {
      return template(incident, unansweredSeconds)
    }
    return { ...response.parsed_output, source: 'bedrock' }
  } catch (err) {
    console.warn('[outreach] Bedrock unavailable, using the template brief:', (err as Error).message)
    return template(incident, unansweredSeconds)
  }
}

export type ChannelResult = 'sent' | 'not configured' | `failed: ${string}`

/** Text and email the family contact. Each channel is skipped unless it is configured. */
export async function notifyFamily(brief: CareBrief): Promise<{ sms: ChannelResult; email: ChannelResult }> {
  const phone = process.env.FAMILY_PHONE
  const to = process.env.FAMILY_EMAIL
  const from = process.env.SES_FROM_EMAIL

  const sms: Promise<ChannelResult> =
    hasAws && phone
      ? new SNSClient({ region: REGION })
          .send(new PublishCommand({ PhoneNumber: phone, Message: brief.familyMessage }))
          .then(() => 'sent' as const)
          .catch((e: Error) => `failed: ${e.name}` as const)
      : Promise.resolve('not configured')

  const email: Promise<ChannelResult> =
    hasAws && to && from
      ? new SESv2Client({ region: REGION })
          .send(
            new SendEmailCommand({
              FromEmailAddress: from,
              Destination: { ToAddresses: [to] },
              Content: {
                Simple: {
                  Subject: { Data: brief.familySubject },
                  Body: { Text: { Data: `${brief.familyMessage}\n\n— Brief for paramedics —\n${brief.paramedicBrief}` } },
                },
              },
            })
          )
          .then(() => 'sent' as const)
          .catch((e: Error) => `failed: ${e.name}` as const)
      : Promise.resolve('not configured')

  const [s, e] = await Promise.all([sms, email])
  return { sms: s, email: e }
}
