'use client'

import React, { useState } from 'react'
import { CareIncident } from '@/lib/types/care'
import {
  AlertCircle,
  Activity,
  Flame,
  Mic,
  WifiOff,
  CheckCircle2,
  FileText,
  Clock,
  Sparkles,
  Send,
} from 'lucide-react'

interface CaregiverTimelineProps {
  incidents: CareIncident[]
  onAcknowledge: (id: string) => void
}

export function CaregiverTimeline({ incidents, onAcknowledge }: CaregiverTimelineProps) {
  const [selectedIncidentForBrief, setSelectedIncidentForBrief] = useState<CareIncident | null>(null)
  const [briefSummary, setBriefSummary] = useState<string | null>(null)
  const [generatingBrief, setGeneratingBrief] = useState(false)

  const handleGenerateBrief = async (incident: CareIncident) => {
    setSelectedIncidentForBrief(incident)
    setGeneratingBrief(true)
    setBriefSummary(null)

    try {
      const res = await fetch('/api/care/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ incident }),
      })
      const data = await res.json()
      setBriefSummary(data.summary || 'Summary unavailable')
    } catch {
      setBriefSummary(
        `EMERGENCY EMS REPORT:\nResident: Senior Care Subject #104\nEvent: ${incident.title}\nSeverity: ${incident.severity.toUpperCase()}\nTime: ${new Date(incident.timestamp).toLocaleString()}\nDetails: ${incident.description}\nRing Camera Sentinel: Confidence ${Math.round(incident.confidence * 100)}%. Escalation Level ${incident.escalationLevel} executed.`
      )
    } finally {
      setGeneratingBrief(false)
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'fall_detected':
      case 'slip_inactivity':
        return <Activity className="w-4 h-4 text-red-400" />
      case 'stove_unattended':
        return <Flame className="w-4 h-4 text-orange-400" />
      case 'voice_distress':
        return <Mic className="w-4 h-4 text-indigo-400" />
      case 'heartbeat_loss':
        return <WifiOff className="w-4 h-4 text-amber-400" />
      default:
        return <AlertCircle className="w-4 h-4 text-cyan-400" />
    }
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3 flex flex-col">
      <div className="flex items-center justify-between pb-2 border-b border-slate-700">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <span>🛡️ Caregiver Incident Log</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-800 text-cyan-300 font-mono">
              {incidents.length} Events
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time Ring camera audit trail & automated dispatch records
          </p>
        </div>
      </div>

      {/* Incident List */}
      <div className="space-y-3 flex-1">
        {incidents.map((incident) => {
          const isCritical = incident.severity === 'critical'
          const isHigh = incident.severity === 'high'

          return (
            <div
              key={incident.id}
              className={`p-3.5 rounded-xl border transition ${
                isCritical
                  ? 'bg-red-950/30 border-red-800/80 shadow-lg shadow-red-950/20'
                  : isHigh
                  ? 'bg-orange-950/20 border-orange-800/60'
                  : 'bg-slate-800/60 border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-1.5">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800">
                    {getIcon(incident.type)}
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white">{incident.title}</h3>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-0.5">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(incident.timestamp).toLocaleTimeString()}</span>
                      <span>•</span>
                      <span>Confidence: {(incident.confidence * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                </div>

                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    isCritical
                      ? 'bg-red-500 text-white'
                      : isHigh
                      ? 'bg-orange-500 text-white'
                      : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  {incident.severity}
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed pl-8 pr-2">
                {incident.description}
              </p>

              <div className="mt-3 pl-8 flex items-center justify-between gap-2 pt-2 border-t border-slate-700/50">
                <button
                  onClick={() => handleGenerateBrief(incident)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[11px] font-medium flex items-center gap-1.5 border border-slate-700 transition"
                >
                  <Sparkles className="w-3 h-3 text-cyan-400" />
                  Paramedic EMS Summary
                </button>

                {!incident.resolved ? (
                  <button
                    onClick={() => onAcknowledge(incident.id)}
                    className="px-2.5 py-1 rounded-lg bg-emerald-950 hover:bg-emerald-900 text-emerald-300 text-[11px] font-medium flex items-center gap-1 border border-emerald-800 transition"
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    Mark Resolved
                  </button>
                ) : (
                  <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Resolved
                  </span>
                )}
              </div>
            </div>
          )
        })}

        {incidents.length === 0 && (
          <div className="text-center py-12 text-slate-500 text-xs">
            <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500/50" />
            No incidents detected. Resident is safe and mobility patterns are normal.
          </div>
        )}
      </div>

      {/* EMS Brief Modal */}
      {selectedIncidentForBrief && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 text-white shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
                <FileText className="w-5 h-5" />
                Automated Clinical Dispatch Brief (AWS Bedrock / Ring AVA)
              </div>
              <button
                onClick={() => setSelectedIncidentForBrief(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {generatingBrief ? (
              <div className="py-8 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                Synthesizing multi-modal incident brief for emergency responders...
              </div>
            ) : (
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs font-mono text-slate-300 whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto">
                {briefSummary}
              </div>
            )}

            <div className="flex justify-between items-center pt-2">
              <span className="text-[11px] text-slate-500">
                Ready to transmit to local first responders via CAD / Webhook
              </span>
              <button
                onClick={() => setSelectedIncidentForBrief(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
