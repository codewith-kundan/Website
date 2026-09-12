
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Cpu, Rocket, Plane, Hexagon, Wind, ArrowUp, ArrowRight, Umbrella, Target, AlertTriangle } from 'lucide-react';

// --- QUAD ROTOR STATUS (Drone Stability) ---
// Safe mobile haptic helper
const triggerDiagramHaptic = (pattern: number | number[] = 8) => {
    if (typeof window !== 'undefined' && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
            navigator.vibrate(pattern);
        } catch { }
    }
};

// --- QUAD ROTOR STATUS (Drone Stability - Interactive Touch Pilot) ---
export const QuadRotorStatus: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pitch, setPitch] = useState(0);
  const [roll, setRoll] = useState(0);
  const [motors, setMotors] = useState([65, 65, 65, 65]);
  const [isManual, setIsManual] = useState(false);
  const manualValues = useRef({ pitch: 0, roll: 0, active: false });

  // Auto-hover when not manually controlled
  useEffect(() => {
      const interval = setInterval(() => {
          if (manualValues.current.active) return;
          const time = Date.now() / 1000;
          const newPitch = Math.sin(time) * 5; 
          const newRoll = Math.cos(time * 1.5) * 3;
          
          setPitch(newPitch);
          setRoll(newRoll);

          const base = 65;
          setMotors([
              base + newPitch + newRoll + Math.random() * 2, 
              base - newPitch - newRoll + Math.random() * 2,
              base - newPitch + newRoll + Math.random() * 2,
              base + newPitch - newRoll + Math.random() * 2
          ]);
      }, 50);
      return () => clearInterval(interval);
  }, []);

  const updatePilot = (clientX: number, clientY: number) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const normX = ((clientX - rect.left) / rect.width - 0.5) * 2; // -1 to 1
      const normY = ((clientY - rect.top) / rect.height - 0.5) * 2; // -1 to 1

      const p = Math.max(-25, Math.min(25, normY * 25));
      const r = Math.max(-25, Math.min(25, normX * 25));

      manualValues.current.pitch = p;
      manualValues.current.roll = r;
      setPitch(p);
      setRoll(r);

      const base = 70;
      setMotors([
          Math.min(99, Math.max(20, base + p + r)),
          Math.min(99, Math.max(20, base - p - r)),
          Math.min(99, Math.max(20, base - p + r)),
          Math.min(99, Math.max(20, base + p - r))
      ]);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
      manualValues.current.active = true;
      setIsManual(true);
      updatePilot(e.clientX, e.clientY);
      triggerDiagramHaptic(10);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
      if (!manualValues.current.active) return;
      updatePilot(e.clientX, e.clientY);
  };

  const handlePointerUp = () => {
      manualValues.current.active = false;
      setIsManual(false);
  };

  return (
    <div 
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="flex flex-col items-center p-4 bg-transparent w-full h-full relative touch-none select-none cursor-crosshair"
    >
      <div className="flex justify-between w-full items-end mb-2 z-10">
          <div><h3 className="font-display text-sm text-white uppercase tracking-widest">Flight<span className="text-nation-secondary">.Ctrl</span></h3></div>
          <div className="flex items-center gap-2">
              <span className="text-[7px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-white/70 uppercase">
                  {isManual ? 'MANUAL' : 'AUTO-LEVEL'}
              </span>
              <div className="flex items-center gap-1">
                  <div className={`w-1.5 h-1.5 rounded-full ${isManual ? 'bg-cyan-400' : 'bg-green-500'} animate-pulse`}></div>
                  <span className="text-[8px] font-mono text-nation-secondary uppercase">ARMED</span>
              </div>
          </div>
      </div>
      
      <div className="relative w-full flex-1 border border-white/10 bg-black/80 flex items-center justify-center overflow-hidden rounded-sm">
         <div className="absolute inset-0 opacity-35 pointer-events-none transition-transform duration-100" style={{ transform: `rotate(${roll}deg) translateY(${pitch * 2}px)` }}>
            <div className="w-full h-[1px] bg-nation-secondary absolute top-1/2 left-0 shadow-[0_0_12px_rgba(0,240,255,0.8)]"></div>
            <div className="w-full h-full bg-gradient-to-b from-nation-secondary/20 to-transparent absolute top-0 left-0"></div>
            <div className="w-full h-full bg-gradient-to-t from-nation-accent/15 to-transparent absolute bottom-0 left-0"></div>
         </div>

         <div className="absolute inset-0 bg-[linear-gradient(rgba(0,240,255,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(0,240,255,0.12)_1px,transparent_1px)] bg-[length:20px_20px] pointer-events-none"></div>
         
         {/* GPS Coordinates & Touch Hint Overlay */}
         <div className="absolute bottom-2 left-2 z-20 flex flex-col gap-0.5 text-[7px] font-mono text-nation-text uppercase tracking-widest pointer-events-none">
             <span>LOC: NIT ROURKELA</span>
             <span className="text-nation-secondary font-semibold">22.2513° N, 84.9049° E</span>
         </div>

         <div className="absolute top-2 right-2 z-20 pointer-events-none">
             <span className="text-[7px] font-mono px-1.5 py-0.5 rounded bg-black/80 border border-nation-secondary/30 text-nation-secondary tracking-widest uppercase">
                 {isManual ? 'PILOT OVERRIDE' : 'TOUCH TO PILOT'}
             </span>
         </div>

         {/* CG Marker */}
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 border border-nation-secondary/70 rounded-full flex items-center justify-center z-20 pointer-events-none">
             <div className="w-1.5 h-1.5 bg-nation-secondary rounded-full shadow-[0_0_8px_#00F0FF]"></div>
         </div>

         <div className="relative w-32 h-32 z-10 transition-transform duration-100 ease-out pointer-events-none" style={{ transform: `perspective(500px) rotateX(${pitch}deg) rotateY(${roll}deg)` }}>
            <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
                {/* Structural Drone Arms - high contrast */}
                <line x1="20" y1="20" x2="80" y2="80" stroke="rgba(0,240,255,0.4)" strokeWidth="4" strokeLinecap="round" />
                <line x1="80" y1="20" x2="20" y2="80" stroke="rgba(0,240,255,0.4)" strokeWidth="4" strokeLinecap="round" />
                <line x1="20" y1="20" x2="80" y2="80" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
                <line x1="80" y1="20" x2="20" y2="80" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
                
                {/* Center Avionics Box */}
                <rect x="40" y="40" width="20" height="20" rx="3" fill="#0A1128" stroke="#00F0FF" strokeWidth="1.5" />
                <circle cx="50" cy="50" r="4" fill="#00F0FF" className="animate-pulse" />
                {[
                    {x: 20, y: 20, id: 0}, {x: 80, y: 20, id: 1},
                    {x: 80, y: 80, id: 2}, {x: 20, y: 80, id: 3}
                ].map((m, i) => (
                    <g key={m.id}>
                        <circle cx={m.x} cy={m.y} r="7" fill="#0E1A2F" stroke="#00F0FF" strokeWidth="1.5" />
                        <circle cx={m.x} cy={m.y} r="18" fill="url(#propBlur)" opacity={Math.min(motors[i]/100, 0.9)} />
                        <text x={m.x + (i%2===0 ? -13 : 13)} y={m.y + (i<2 ? -13 : 21)} fill="#00F0FF" fontSize="5.5" fontWeight="bold" fontFamily="monospace" textAnchor="middle">{Math.round(motors[i]*100)}</text>
                        <line x1={m.x-14} y1={m.y} x2={m.x+14} y2={m.y} stroke="rgba(0,240,255,0.7)" strokeWidth="2.5" strokeLinecap="round">
                            <animateTransform attributeName="transform" type="rotate" from={`0 ${m.x} ${m.y}`} to={`360 ${m.x} ${m.y}`} dur={`${Math.max(0.05, 200/Math.max(1, motors[i]))}s`} repeatCount="indefinite" />
                        </line>
                         <line x1={m.x} y1={m.y-14} x2={m.x} y2={m.y+14} stroke="rgba(0,240,255,0.7)" strokeWidth="2.5" strokeLinecap="round">
                            <animateTransform attributeName="transform" type="rotate" from={`0 ${m.x} ${m.y}`} to={`360 ${m.x} ${m.y}`} dur={`${Math.max(0.05, 200/Math.max(1, motors[i]))}s`} repeatCount="indefinite" />
                        </line>
                    </g>
                ))}
                <defs><radialGradient id="propBlur"><stop offset="0%" stopColor="rgba(0,240,255,0)" /><stop offset="80%" stopColor="rgba(0,240,255,0.25)" /><stop offset="100%" stopColor="rgba(0,240,255,0)" /></radialGradient></defs>
            </svg>
         </div>
      </div>
    </div>
  );
};

// --- ROCKET TRAJECTORY (Cursor/Touch-following vertical rocket) ---
export const RocketTrajectory: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    
    // Rocket position state - follows cursor/touch
    const [rocketPos, setRocketPos] = useState({ x: 50, y: 50 });
    const [targetPos, setTargetPos] = useState({ x: 50, y: 50 });
    const [isHovering, setIsHovering] = useState(false);
    const [isTouch, setIsTouch] = useState(false);
    
    // Trail state
    const [trail, setTrail] = useState<{x: number, y: number}[]>([]);
    
    // Simulated telemetry based on position
    const altitude = Math.round((100 - rocketPos.y) * 1.5); // Higher = more altitude
    const velocity = Math.round(Math.sqrt(Math.pow(targetPos.x - rocketPos.x, 2) + Math.pow(targetPos.y - rocketPos.y, 2)) * 2);
    
    // Detect touch device on mount
    useEffect(() => {
        setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0);
    }, []);
    
    // Handle pointer move (works for both mouse and touch)
    const handlePointerMove = useCallback((clientX: number, clientY: number) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = ((clientX - rect.left) / rect.width) * 100;
        const y = ((clientY - rect.top) / rect.height) * 100;
        setTargetPos({ x: Math.max(5, Math.min(95, x)), y: Math.max(5, Math.min(95, y)) });
    }, []);
    
    // Handle mouse move
    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        handlePointerMove(e.clientX, e.clientY);
    };
    
    // Handle touch move
    const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
        if (e.touches.length > 0) {
            // Prevent page scroll when interacting with diagram
            e.preventDefault();
            handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
        }
    };
    
    // Handle touch start
    const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
        setIsHovering(true);
        if (e.touches.length > 0) {
            handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
        }
    };
    
    // Handle touch end
    const handleTouchEnd = () => {
        setIsHovering(false);
        setTargetPos({ x: 50, y: 50 }); // Return to center
    };
    
    // Smooth follow animation
    useEffect(() => {
        let animationId: number;
        
        const animate = () => {
            setRocketPos(prev => {
                const dx = targetPos.x - prev.x;
                const dy = targetPos.y - prev.y;
                const ease = 0.08; // Smooth easing
                
                const newX = prev.x + dx * ease;
                const newY = prev.y + dy * ease;
                
                return { x: newX, y: newY };
            });
            
            animationId = requestAnimationFrame(animate);
        };
        
        animationId = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationId);
    }, [targetPos]);
    
    // Update trail
    useEffect(() => {
        const interval = setInterval(() => {
            setTrail(prev => {
                const newTrail = [...prev, { x: rocketPos.x, y: rocketPos.y }];
                // Keep last 20 points
                return newTrail.slice(-20);
            });
        }, 50);
        
        return () => clearInterval(interval);
    }, [rocketPos]);
    
    // Wobble effect
    const [wobble, setWobble] = useState(0);
    useEffect(() => {
        const interval = setInterval(() => {
            setWobble(Math.sin(Date.now() / 200) * 3);
        }, 50);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex flex-col items-center p-4 bg-transparent w-full h-full relative overflow-hidden">
             <div className="flex justify-between w-full items-end mb-2 z-10 pointer-events-none">
                <div><h3 className="font-display text-sm text-white uppercase tracking-widest">Apogee<span className="text-nation-accent">.Track</span></h3></div>
                <div className="flex items-center gap-2">
                    <span className={`text-[8px] font-mono px-2 py-0.5 rounded border transition-colors duration-300 ${
                        isHovering ? 'border-nation-accent text-nation-accent animate-pulse bg-nation-accent/10' : 
                        'border-white/20 text-nation-text'
                    }`}>
                        {isHovering ? 'TRACKING' : 'STANDBY'}
                    </span>
                </div>
            </div>

            <div 
                ref={containerRef}
                onMouseMove={handleMouseMove}
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => {
                    setIsHovering(false);
                    setTargetPos({ x: 50, y: 50 }); // Return to center
                }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                className={`relative w-full flex-1 bg-black/60 border border-white/5 rounded-sm overflow-hidden ${isTouch ? 'cursor-pointer touch-none' : 'cursor-none'}`}
            >
                {/* Background Grid */}
                <div className="absolute inset-0 z-0 opacity-40" 
                     style={{ backgroundImage: 'linear-gradient(rgba(0,240,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(0,240,255,0.15) 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
                </div>

                {/* Main Visualization SVG */}
                <svg className="absolute inset-0 w-full h-full z-10" viewBox="0 0 100 100" preserveAspectRatio="none">
                    {/* Altitude Reference Lines */}
                    {[25, 50, 75].map(y => (
                        <g key={y}>
                            <line x1="0" y1={y} x2="100" y2={y} stroke="#00F0FF" strokeWidth="0.3" strokeDasharray="3 3" opacity="0.6" />
                            <text x="3" y={y - 1.5} fill="#00F0FF" fontSize="3" fontWeight="bold" fontFamily="monospace" opacity="0.8">
                                {Math.round((100 - y) * 1.5)}m
                            </text>
                        </g>
                    ))}

                    {/* Trail/Smoke */}
                    {trail.length > 1 && (
                        <polyline 
                            points={trail.map(p => `${p.x},${p.y}`).join(' ')} 
                            fill="none" 
                            stroke="url(#trailGradient)" 
                            strokeWidth="2" 
                            strokeLinecap="round"
                            opacity="0.8"
                        />
                    )}
                    <defs>
                        <linearGradient id="trailGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="rgba(255,100,0,0)" />
                            <stop offset="100%" stopColor="rgba(255,170,0,0.9)" />
                        </linearGradient>
                    </defs>

                    {/* Rocket Group - VERTICAL with high-visibility styling */}
                    <g transform={`translate(${rocketPos.x}, ${rocketPos.y}) rotate(${wobble})`}>
                         {/* Exhaust Plume */}
                         <g transform="translate(0, 6)">
                             <path d="M-2.5,0 Q0,16 2.5,0 Z" fill="#FF4400" opacity="0.85">
                                 <animate attributeName="d" values="M-2.5,0 Q0,16 2.5,0 Z; M-2,0 Q0,10 2,0 Z; M-2.5,0 Q0,16 2.5,0 Z" dur="0.1s" repeatCount="indefinite" />
                             </path>
                             <path d="M-1.5,0 Q0,10 1.5,0 Z" fill="#FFAA00" opacity="0.95">
                                 <animate attributeName="d" values="M-1.5,0 Q0,10 1.5,0 Z; M-1,0 Q0,6 1,0 Z; M-1.5,0 Q0,10 1.5,0 Z" dur="0.08s" repeatCount="indefinite" />
                             </path>
                             <path d="M-0.8,0 Q0,5 0.8,0 Z" fill="#FFFFFF" opacity="1" />
                         </g>

                         {/* Rocket Body - High contrast white and cyan */}
                         <rect x="-2.5" y="-6" width="5" height="12" rx="0.8" fill="#FFFFFF" stroke="#00F0FF" strokeWidth="0.6" />
                         
                         {/* Nosecone */}
                         <path d="M-2.5,-6 L0,-11 L2.5,-6 Z" fill="#00F0FF" stroke="#FFFFFF" strokeWidth="0.4" />
                         
                         {/* Body stripes */}
                         <rect x="-2.5" y="-3" width="5" height="1" fill="#FF5500" />
                         <rect x="-2.5" y="1" width="5" height="1" fill="#0A1128" />
                         
                         {/* Fins */}
                         <path d="M-2.5,3 L-5.5,6.5 L-2.5,5 Z" fill="#FF5500" stroke="#FFFFFF" strokeWidth="0.3" />
                         <path d="M2.5,3 L5.5,6.5 L2.5,5 Z" fill="#FF5500" stroke="#FFFFFF" strokeWidth="0.3" />
                         
                         {/* Center Avionics Sensor */}
                         <circle cx="0" cy="-1.5" r="1" fill="#00F0FF" stroke="#0A1128" strokeWidth="0.3" />
                    </g>
                    
                    {/* Cursor target indicator */}
                    {isHovering && (
                        <g transform={`translate(${targetPos.x}, ${targetPos.y})`}>
                            <circle r="3" fill="none" stroke="#D4AF37" strokeWidth="0.3" opacity="0.5" strokeDasharray="1 1">
                                <animate attributeName="r" values="3;5;3" dur="1s" repeatCount="indefinite" />
                                <animate attributeName="opacity" values="0.5;0.2;0.5" dur="1s" repeatCount="indefinite" />
                            </circle>
                        </g>
                    )}
                </svg>

                {/* Telemetry Data (HUD Style) */}
                <div className="absolute bottom-2 left-2 right-2 flex justify-between items-end pointer-events-none">
                    <div className="flex flex-col bg-black/40 backdrop-blur-md p-1.5 rounded border border-white/5">
                        <span className="text-[7px] font-mono text-nation-text uppercase tracking-widest">ALTITUDE</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-lg font-mono font-bold text-white leading-none tracking-tighter w-12 text-right">
                                {altitude.toString().padStart(3, '0')}
                            </span>
                            <span className="text-[7px] font-mono text-nation-accent">m</span>
                        </div>
                    </div>
                    <div className="flex flex-col items-end bg-black/40 backdrop-blur-md p-1.5 rounded border border-white/5">
                        <span className="text-[7px] font-mono text-nation-text uppercase tracking-widest">VELOCITY</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-lg font-mono font-bold text-white leading-none tracking-tighter w-12 text-right">
                                {velocity.toString().padStart(3, '0')}
                            </span>
                            <span className="text-[7px] font-mono text-nation-secondary">m/s</span>
                        </div>
                    </div>
                </div>
                
                {/* Hover instruction - updated for touch */}
                {!isHovering && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <span className="text-[10px] font-mono text-nation-text/50 uppercase tracking-widest animate-pulse">
                            {isTouch ? 'Tap and drag to track' : 'Move cursor to track'}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}

// --- AERO FLOW (RC Plane) - with touch support ---
export const AeroFlow: React.FC = () => {
    const [aoa, setAoa] = useState(0); 
    const [bank, setBank] = useState(0);
    const [isTouch, setIsTouch] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    
    // Detect touch device on mount
    useEffect(() => {
        setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0);
    }, []);
    
    // Handle pointer move (works for both mouse and touch)
    const handlePointerMove = useCallback((clientX: number, clientY: number) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = (clientX - rect.left) / rect.width;
        const y = (clientY - rect.top) / rect.height;
        setAoa((0.5 - y) * 30);
        setBank((x - 0.5) * 20);
    }, []);
    
    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        handlePointerMove(e.clientX, e.clientY);
    };
    
    const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
        if (e.touches.length > 0) {
            e.preventDefault(); // Prevent scroll
            handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
        }
    };
    
    const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
        if (e.touches.length > 0) {
            handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
        }
    };
    
    const resetValues = () => { setAoa(0); setBank(0); };
    
    const stall = aoa > 12 || aoa < -12;
    // Simple Lift/Drag approximations
    const cl = stall ? 0.8 : 0.1 * Math.abs(aoa);
    const cd = 0.02 + 0.05 * Math.pow(cl, 2) + (stall ? 0.2 : 0);

    return (
        <div 
            ref={containerRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={resetValues}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={resetValues}
            className={`flex flex-col items-center p-4 bg-transparent w-full h-full relative ${isTouch ? 'cursor-pointer touch-none' : 'cursor-crosshair'}`}
        >
             <div className="flex justify-between w-full items-end mb-2 z-10">
                <div><h3 className="font-display text-sm text-white uppercase tracking-widest">Aero<span className="text-white">.Tunnel</span></h3></div>
                <Wind size={14} className="text-white" />
            </div>

            <div className="relative w-full flex-1 bg-black/80 border border-white/10 overflow-hidden flex items-center justify-center perspective-500 rounded-sm">
                 <div className="absolute inset-0 overflow-hidden opacity-30 bg-[linear-gradient(rgba(0,240,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(0,240,255,0.08)_1px,transparent_1px)] bg-[length:20px_20px]">
                     {[...Array(10)].map((_, i) => (
                         <div key={i} className="absolute h-[1px] bg-cyan-400 w-full opacity-60" style={{ top: `${i * 10}%`, left: '-100%', animation: `scan ${0.5 + Math.random() * 0.5}s linear infinite` }} />
                     ))}
                 </div>
                 {stall && (
                     <div className="absolute top-2 right-2 flex items-center gap-1 text-red-500 animate-pulse z-30 bg-black/90 px-2 py-0.5 rounded border border-red-500/50">
                         <AlertTriangle size={12} />
                         <span className="text-[9px] font-mono font-bold uppercase">STALL</span>
                     </div>
                 )}
                 <div className="absolute bottom-2 left-2 flex flex-col gap-1 z-30 text-[8px] font-mono text-nation-secondary bg-black/80 p-1.5 rounded border border-white/10">
                     <div>CL: <span className="text-white font-bold">{cl.toFixed(2)}</span></div>
                     <div>CD: <span className="text-white font-bold">{cd.toFixed(3)}</span></div>
                 </div>

                <div className="relative w-full h-full flex items-center justify-center z-10 transition-transform duration-100 ease-out" style={{ transform: `rotateX(${aoa * 0.5}deg) rotateY(${bank}deg)` }}>
                    <div className="relative w-3/4 h-3/4 flex items-center justify-center" style={{ transform: `rotate(${-aoa}deg)`, transition: 'transform 0.1s' }}>
                        <svg viewBox="0 0 200 100" className="w-full h-full overflow-visible drop-shadow-[0_0_15px_rgba(0,240,255,0.4)]">
                            <path d="M 20,50 Q 60,15 180,50 Q 60,65 20,50 Z" fill="rgba(0, 240, 255, 0.15)" stroke={stall ? "#FF3333" : "#00F0FF"} strokeWidth="2.5" />
                        </svg>
                        <div className="absolute inset-0 w-full h-full pointer-events-none -z-10">
                             {[...Array(5)].map((_, i) => (
                                <svg key={i} className="absolute inset-0 w-full h-full overflow-visible opacity-70" viewBox="0 0 200 100" preserveAspectRatio="none">
                                    <path d={`M -50,${20 + i * 15} Q 100,${20 + i * 15 + (stall ? (Math.random()-0.5)*40 : i<2?-20:10)} 300,${20 + i * 15}`} fill="none" stroke={stall ? "#ff4444" : "#00F0FF"} strokeWidth="1.5" strokeDasharray={stall ? "4,4" : "none"} />
                                </svg>
                             ))}
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="mt-2 flex justify-between w-full text-[8px] font-mono text-nation-text uppercase tracking-widest border-t border-white/5 pt-1">
                <div className="flex gap-2"><span>AoA: <span className="text-white">{aoa.toFixed(1)}°</span></span></div>
                <div className="flex items-center gap-1"><div className={`w-1.5 h-1.5 rounded-full ${stall ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></div><span>FLOW</span></div>
            </div>
        </div>
    )
}

export const SubsystemPipeline: React.FC = () => {
  const [step, setStep] = useState(0);
  useEffect(() => { const i = setInterval(() => setStep(s => (s + 1) % 3), 3000); return () => clearInterval(i); }, []);
  const subsystems = [
      { name: "DRONE", icon: <Hexagon size={18} /> },
      { name: "ROCKET", icon: <Rocket size={18} /> },
      { name: "PLANE", icon: <Plane size={18} /> }
  ];
  return (
    <div className="flex flex-col items-center p-6 bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 my-4 w-full relative overflow-hidden h-full shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
      <div className="flex justify-between w-full items-center mb-6">
        <h3 className="font-display text-lg text-white uppercase tracking-[0.2em]">Data <span className="text-nation-secondary">Link</span></h3>
        <div className="text-[8px] font-mono text-nation-secondary animate-pulse uppercase tracking-widest">Active</div>
      </div>
      <div className="relative w-full flex-1 flex items-center justify-between gap-2 max-w-lg mx-auto">
        <div className="flex flex-col items-center gap-2 z-10">
            <div className="w-16 h-16 border border-white/10 flex items-center justify-center bg-black rounded-lg hover:border-white/30 transition-all"><Cpu size={16} className="text-white/50" /></div>
            <div className="text-[8px] font-mono text-nation-text uppercase">CORE</div>
        </div>
        <div className="flex-1 h-[1px] bg-white/10 relative overflow-hidden"><motion.div className="absolute inset-0 bg-nation-secondary" initial={{x: '-100%'}} animate={{x: '100%'}} transition={{duration: 1.5, repeat: Infinity}} /></div>
        <div className="flex flex-col items-center gap-2 z-10">
             <div className="w-24 h-24 border border-nation-secondary bg-black flex flex-col items-center justify-center gap-1 shadow-[0_0_20px_rgba(59,130,246,0.3)] rounded-xl">
                <div className="animate-pulse text-nation-secondary">{subsystems[step].icon}</div>
                <div className="text-[9px] font-mono text-nation-secondary font-bold">{subsystems[step].name}</div>
             </div>
             <span className="text-[8px] uppercase tracking-widest text-white/50">Module</span>
        </div>
        <div className="flex-1 h-[1px] bg-white/10 relative overflow-hidden"><motion.div className="absolute inset-0 bg-nation-secondary" initial={{x: '-100%'}} animate={{x: '100%'}} transition={{duration: 1.5, repeat: Infinity, delay: 0.75}} /></div>
        <div className="flex flex-col items-center gap-2 z-10">
            <div className="w-16 h-16 border border-white/10 flex items-center justify-center bg-black rounded-lg hover:border-white/30 transition-all"><Wind size={16} className="text-white/50" /></div>
            <div className="text-[8px] font-mono text-nation-text uppercase">AERO</div>
        </div>
      </div>
    </div>
  );
};

export const PropulsionMetrics: React.FC = () => {
    const [mode, setMode] = useState<'CRUISE' | 'SPEED' | 'GLIDE'>('SPEED');
    const data = { 'CRUISE': { t: 45, e: 85 }, 'SPEED': { t: 92, e: 40 }, 'GLIDE': { t: 10, e: 95 } };
    return (
        <div className="flex flex-col items-center p-6 bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 my-4 w-full relative overflow-hidden h-full shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
            <div className="flex justify-between w-full items-center mb-6">
                <h3 className="font-display text-lg text-white uppercase tracking-[0.2em]">Effi<span className="text-nation-secondary">ciency</span></h3>
                <div className="flex gap-1">
                    {(['CRUISE', 'SPEED', 'GLIDE'] as const).map((m) => (
                        <button key={m} onClick={() => setMode(m)} className={`px-2 py-1 text-[8px] font-mono font-bold uppercase transition-all border rounded ${mode === m ? 'bg-white text-black border-white' : 'text-nation-text border-white/20 hover:border-white'}`}>{m}</button>
                    ))}
                </div>
            </div>
            <div className="relative w-full flex-1 flex justify-around items-end p-6 border border-white/10 bg-black/50 rounded-lg max-w-lg mx-auto">
                {/* Background grid */}
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '100% 20%' }}></div>
                
                <div className="w-16 flex flex-col justify-end items-center h-full group relative z-10">
                    <div className="absolute -top-6 text-xs font-mono text-nation-accent font-bold">{data[mode].t}%</div>
                    <div className="w-full bg-gradient-to-t from-nation-accent to-nation-accent/70 transition-all duration-500 rounded-t-sm shadow-[0_0_20px_rgba(212,175,55,0.3)]" style={{height: `${data[mode].t}%`}}></div>
                    <div className="mt-3 text-[9px] font-mono font-bold text-nation-text uppercase tracking-wider">PWR</div>
                </div>
                <div className="w-16 flex flex-col justify-end items-center h-full group relative z-10">
                    <div className="absolute -top-6 text-xs font-mono text-nation-secondary font-bold">{data[mode].e}%</div>
                    <div className="w-full bg-gradient-to-t from-nation-secondary to-nation-secondary/70 transition-all duration-500 rounded-t-sm shadow-[0_0_20px_rgba(59,130,246,0.3)]" style={{height: `${data[mode].e}%`}}></div>
                    <div className="mt-3 text-[9px] font-mono font-bold text-nation-text uppercase tracking-wider">EFF</div>
                </div>
            </div>
        </div>
    )
}
