"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Video, CalendarCheck } from 'lucide-react';
import { Badge } from "@/components/ui/badge";

export function ZoomLobbyCard({ 
  title, 
  module,
  url, 
  startTime, 
  endTime 
}: { 
  title: string;
  module: string;
  url: string; 
  startTime: string; 
  endTime: string; 
}) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [status, setStatus] = useState<"upcoming" | "live" | "ended">("upcoming");

  const parseDate = (d: any) => {
    if (!d) return null;
    if (typeof d === 'string') return new Date(d);
    if (d.toDate) return d.toDate();
    if (d.seconds) return new Date(d.seconds * 1000);
    return new Date(d);
  };

  useEffect(() => {
    if (!startTime || !endTime) return;

    const timer = setInterval(() => {
      // Get current time in Sri Lanka timezone
      const nowString = new Date().toLocaleString("en-US", { timeZone: "Asia/Colombo" });
      const now = new Date(nowString).getTime();
      
      const startDate = parseDate(startTime);
      const endDate = parseDate(endTime);
      if (!startDate || !endDate) return;

      const start = startDate.getTime();
      const end = endDate.getTime();
      
      const timeToStart = start - now;
      const timeToEnd = end - now;

      // Logic: 15 minutes before start is considered LIVE
      const fifteenMins = 15 * 60 * 1000;

      if (timeToEnd < 0) {
        setStatus("ended");
        clearInterval(timer);
      } else if (timeToStart <= fifteenMins && timeToEnd >= 0) {
        setStatus("live");
      } else {
        setStatus("upcoming");
        // Calculate countdown
        setTimeLeft({
          days: Math.floor(timeToStart / (1000 * 60 * 60 * 24)),
          hours: Math.floor((timeToStart % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((timeToStart % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((timeToStart % (1000 * 60)) / 1000),
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [startTime, endTime]);

  const parsedStart = parseDate(startTime);

  return (
    <div className={`flex flex-col h-full transition-all duration-500`}>
      {/* 16:9 Visual Section for Timer */}
      <div className={`relative aspect-video w-full flex flex-col items-center justify-center border-b ${status === 'live' ? 'bg-red-950/20 shadow-inner shadow-red-500/20' : 'bg-black/40'}`}>
        
        {/* Status Banner */}
        <div className={`absolute top-0 left-0 right-0 p-1 text-center text-[10px] font-bold uppercase tracking-widest text-white ${status === 'live' ? 'bg-red-500 animate-pulse' : status === 'ended' ? 'bg-muted-foreground' : 'bg-primary/90'}`}>
          {status === 'live' ? '🔴 Session is Live' : status === 'ended' ? 'Session Completed' : 'Upcoming Session'}
        </div>
        
        <div className="w-full px-4 mt-6">
          {status === "upcoming" && (
            <div className="text-center w-full">
              <div className="text-[11px] text-muted-foreground uppercase tracking-widest mb-3 font-bold">Starting In</div>
              <div className="flex items-center justify-center gap-3">
                <TimeUnit value={timeLeft.days} label="d" />
                <span className="text-muted-foreground font-bold pb-4">:</span>
                <TimeUnit value={timeLeft.hours} label="h" />
                <span className="text-muted-foreground font-bold pb-4">:</span>
                <TimeUnit value={timeLeft.minutes} label="m" />
                <span className="text-muted-foreground font-bold pb-4">:</span>
                <TimeUnit value={timeLeft.seconds} label="s" />
              </div>
            </div>
          )}

          {status === "live" && (
            <a href={url} target="_blank" rel="noreferrer" className="w-full flex justify-center">
              <Button size="lg" className="w-full max-w-xs bg-red-600 hover:bg-red-700 text-white font-bold text-lg animate-bounce shadow-lg shadow-red-500/30">
                <Video className="w-5 h-5 mr-2" />
                JOIN LIVE CLASS
              </Button>
            </a>
          )}

          {status === "ended" && (
            <div className="text-muted-foreground font-medium text-center text-sm">
              This session has concluded.
            </div>
          )}
        </div>
      </div>
      
      {/* Bottom Text Section */}
      <div className="p-4 flex flex-col flex-grow bg-card">
        <div className="text-xs font-bold text-primary tracking-wider uppercase mb-1.5">{module}</div>
        <h3 className="text-[17px] font-semibold mb-3 leading-tight line-clamp-2">{title}</h3>
        <div className="flex flex-col gap-1.5 text-xs text-muted-foreground font-medium mt-auto border-t border-border/40 pt-3">
          <div className="flex items-center gap-2 mt-1">
            <CalendarCheck className="h-3 w-3" />
            {parsedStart ? parsedStart.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' }) : "Date not specified"}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Clock className="h-3 w-3" />
            {parsedStart ? parsedStart.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : "Time not specified"}
          </div>
        </div>
      </div>
    </div>
  );
}

function TimeUnit({ value, label }: { value: number, label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="w-[45px] h-[50px] bg-background rounded-lg border border-border/50 flex items-center justify-center shadow-inner relative overflow-hidden group-hover:border-primary/30 transition-colors">
        <span className="text-2xl font-bold font-mono tracking-tighter text-white">
          {String(value).padStart(2, '0')}
        </span>
      </div>
      <span className="text-[9px] font-bold text-muted-foreground uppercase">{label}</span>
    </div>
  );
}

