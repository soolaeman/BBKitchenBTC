'use client';

import React from 'react';
import { WAREHOUSE_HUB_DETAILS } from '@/lib/repositories/warehouse-utils';

export function WarehouseIntelligence() {
  const hubMetrics = [
    {
      hub: WAREHOUSE_HUB_DETAILS[0], // Pamulang 2
      totalUnits: 1180,
      availableUnits: 980,
      soldUnits: 200,
      avgDaysToSell: 19,
      occupancyRate: 85,
      sourcePerformance: [
        { code: 'SRC-GK-ALPHA', volume: 420, qualityScore: 96, avgTurnoverDays: 16 },
        { code: 'SRC-BB-BETA', volume: 340, qualityScore: 92, avgTurnoverDays: 21 },
        { code: 'SRC-SM-GAMMA', volume: 260, qualityScore: 89, avgTurnoverDays: 24 },
        { code: 'SRC-BL-DELTA', volume: 160, qualityScore: 94, avgTurnoverDays: 18 },
      ],
    },
    {
      hub: WAREHOUSE_HUB_DETAILS[1], // Pamulang Barat
      totalUnits: 620,
      availableUnits: 510,
      soldUnits: 110,
      avgDaysToSell: 24,
      occupancyRate: 78,
      sourcePerformance: [
        { code: 'SRC-ML-REFRIG', volume: 380, qualityScore: 95, avgTurnoverDays: 22 },
        { code: 'SRC-RB-FREEZE', volume: 240, qualityScore: 91, avgTurnoverDays: 27 },
      ],
    },
    {
      hub: WAREHOUSE_HUB_DETAILS[2], // Setu
      totalUnits: 390,
      availableUnits: 330,
      soldUnits: 60,
      avgDaysToSell: 14,
      occupancyRate: 72,
      sourcePerformance: [
        { code: 'SRC-PY-FABRIKASI', volume: 390, qualityScore: 98, avgTurnoverDays: 14 },
      ],
    },
    {
      hub: WAREHOUSE_HUB_DETAILS[3], // Sawangan
      totalUnits: 340,
      availableUnits: 280,
      soldUnits: 60,
      avgDaysToSell: 26,
      occupancyRate: 68,
      sourcePerformance: [
        { code: 'SRC-PE-BARISTA', volume: 340, qualityScore: 90, avgTurnoverDays: 26 },
      ],
    },
    {
      hub: WAREHOUSE_HUB_DETAILS[4], // Kedaung
      totalUnits: 220,
      availableUnits: 180,
      soldUnits: 40,
      avgDaysToSell: 29,
      occupancyRate: 64,
      sourcePerformance: [
        { code: 'SRC-WT-PREP', volume: 130, qualityScore: 88, avgTurnoverDays: 31 },
        { code: 'SRC-ON-WASH', volume: 90, qualityScore: 93, avgTurnoverDays: 25 },
      ],
    },
  ];

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Title Section */}
      <div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight uppercase">
          SUPPLY INTEL.
        </h2>
        <p className="text-xs sm:text-sm text-white/60 max-w-2xl mt-1.5 leading-relaxed">
          Pemantauan sebaran inventaris fisik, kapasitas gudang Jabodetabek, dan performa anonim saluran pasokan.
        </p>
      </div>

      {/* Warehouse Hub Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {hubMetrics.map((item, idx) => (
          <div
            key={idx}
            className="bg-[#141417] border border-white/[0.08] p-6 sm:p-7 flex flex-col justify-between hover:border-white/20 transition-all rounded-sm"
          >
            <div>
              {/* Card Head */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="font-mono text-[11px] text-blue-500 tracking-wider block mb-1">
                    {item.hub.codes.join(', ')}
                  </span>
                  <h3 className="text-lg sm:text-xl font-semibold text-white tracking-tight">
                    {item.hub.name}
                  </h3>
                </div>
                <span className="font-mono text-xs px-3 py-1 border border-blue-500 text-blue-400 font-medium">
                  {item.occupancyRate}% Terisi
                </span>
              </div>

              {/* Address */}
              <p className="text-xs text-white/60 mb-5 leading-relaxed">
                {item.hub.address}
              </p>

              {/* Specialty Specs */}
              <div className="bg-black/30 p-3.5 rounded-sm text-xs text-white/80 mb-6 border border-white/[0.04]">
                <strong className="text-blue-400 font-semibold mr-1.5">Spesialisasi:</strong>
                <span>{item.hub.specialty}</span>
              </div>
            </div>

            <div>
              {/* Stats Grid */}
              <div className="grid grid-cols-3 border-t border-white/[0.08] pt-4 gap-3">
                <div>
                  <span className="block font-mono text-[10px] text-white/50 uppercase tracking-wider mb-1">
                    Tersedia
                  </span>
                  <strong className="text-base sm:text-lg font-medium text-white font-mono">
                    {item.availableUnits}
                  </strong>
                </div>
                <div>
                  <span className="block font-mono text-[10px] text-white/50 uppercase tracking-wider mb-1">
                    Terjual
                  </span>
                  <strong className="text-base sm:text-lg font-medium text-white font-mono">
                    {item.soldUnits}
                  </strong>
                </div>
                <div>
                  <span className="block font-mono text-[10px] text-white/50 uppercase tracking-wider mb-1">
                    Turnover
                  </span>
                  <strong className="text-base sm:text-lg font-medium text-white font-mono">
                    {item.avgDaysToSell} hr
                  </strong>
                </div>
              </div>

              {/* Source Performance List */}
              <div className="mt-6 border-t border-white/[0.08] pt-3">
                <div className="text-[10px] font-mono uppercase tracking-widest text-white/40 mb-2">
                  Anonymized Source Streams
                </div>
                <div className="space-y-1.5">
                  {item.sourcePerformance.map((src, sIdx) => (
                    <div
                      key={sIdx}
                      className="flex justify-between items-center py-1 border-b border-white/[0.04] font-mono text-xs"
                    >
                      <span className="text-white/60 text-[11px]">{src.code}</span>
                      <span className="text-white font-medium text-[11px] flex items-center gap-2">
                        <span>{src.volume}</span>
                        <span className="text-emerald-400 font-semibold">{src.qualityScore}%</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
