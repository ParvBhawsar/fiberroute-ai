import React, { useState } from 'react';
import { Layers3, Plus, Minus, LocateFixed, ArrowUpRight } from 'lucide-react';

const positions = [
  {
    name: 'Devgaon',
    x: 485,
    y: 154,
    status: 'Approved',
    label: '12.1 km · Approved',
    color: '#277664',
  },
  {
    name: 'Molgi',
    x: 272,
    y: 74,
    status: 'Field Verification Required',
    label: '16.8 km · Field verification',
    color: '#dba154',
  },
  {
    name: 'Murumgaon',
    x: 621,
    y: 285,
    status: 'Under Review',
    label: '9.6 km · Under review',
    color: '#8e9aa9',
  },
  { name: 'Zap', x: 170, y: 266, status: 'Draft', label: '7.4 km · Draft', color: '#8e9aa9' },
];

export default function NetworkMap({ onExplore, plans }) {
  const nodes = positions.map((n) => {
    const plan = plans.find((p) => p.village === n.name && p.isDemo);
    const status = plan?.status || n.status;
    const color =
      status === 'Approved'
        ? '#277664'
        : status === 'Field Verification Required'
          ? '#dba154'
          : '#8e9aa9';
    return {
      ...n,
      status,
      color,
      label: `${plan?.fiberLength ?? n.label.split(' ')[0]} km · ${status === 'Field Verification Required' ? 'Needs survey' : status}`,
    };
  });
  const [zoom, setZoom] = useState(1);
  const [selected, setSelected] = useState('Devgaon');
  const [terrain, setTerrain] = useState(true);
  const active = nodes.find((n) => n.name === selected);
  return (
    <div className="network-map">
      <div className="map-top">
        <span className="map-location">
          <span className="live-dot" /> Maharashtra <span className="muted">/ Sample network</span>
        </span>
        <button
          className={'map-button ' + (terrain ? 'pressed' : '')}
          onClick={() => setTerrain(!terrain)}
          aria-pressed={terrain}
        >
          <Layers3 size={14} /> Terrain
        </button>
      </div>
      <svg
        viewBox="0 0 780 370"
        className="network-canvas"
        role="group"
        aria-label="Illustrative network diagram of four sample village routes; not a geographic map"
      >
        <defs>
          <pattern id="map-grid" width="24" height="24" patternUnits="userSpaceOnUse">
            <path
              d="M 24 0 L 0 0 0 24"
              fill="none"
              stroke="#cbd3c4"
              strokeWidth=".5"
              opacity=".34"
            />
          </pattern>
          <pattern id="forest" width="15" height="15" patternUnits="userSpaceOnUse">
            <circle cx="3" cy="3" r="1" fill="#b6c3a9" opacity=".7" />
          </pattern>
          <filter id="node-shadow">
            <feDropShadow dx="0" dy="3" stdDeviation="5" floodOpacity=".10" />
          </filter>
        </defs>
        <rect width="780" height="370" fill="#eef0e7" />
        <rect width="780" height="370" fill="url(#map-grid)" />
        <g transform={`translate(${390 * (1 - zoom)} ${185 * (1 - zoom)}) scale(${zoom})`}>
          {terrain && (
            <g fill="none" stroke="#d7decb" strokeWidth="1.1">
              {Array.from({ length: 9 }, (_, i) => (
                <path
                  key={i}
                  d={`M ${-130 + i * 19} -20 C ${260 + i * 18} 40, ${-180 + i * 19} 195, ${130 + i * 17} 390`}
                />
              ))}
              {Array.from({ length: 7 }, (_, i) => (
                <path
                  key={i}
                  d={`M ${540 + i * 20} -20 C ${460 + i * 21} 90, ${760 + i * 18} 160, ${630 + i * 24} 390`}
                />
              ))}
              <path d="M-10 210 Q100 160 155 245 T230 370 L-10 370Z" fill="#e1e7d5" stroke="none" />
              <path
                d="M-10 210 Q100 160 155 245 T230 370 L-10 370Z"
                fill="url(#forest)"
                stroke="none"
              />
              <path d="M560 -20 Q540 80 635 109 T810 90 L810 -20Z" fill="#e1e7d5" stroke="none" />
            </g>
          )}
          <path
            d="M-30 119 C70 180 138 105 217 177 S364 209 443 249 S609 184 810 312"
            fill="none"
            stroke="#c5dbe0"
            strokeWidth="14"
          />
          <path
            d="M-30 119 C70 180 138 105 217 177 S364 209 443 249 S609 184 810 312"
            fill="none"
            stroke="#d9e7e7"
            strokeWidth="9"
          />
          <g fill="none" strokeLinecap="round">
            <path
              d="M40 360 L188 228 L295 206 L390 120 L522 155 L740 17 M126 26 L270 75 L347 204 L470 280 L710 350 M12 272 L170 266 L350 202 L485 154 L620 285 L795 273"
              stroke="#d4d2bd"
              strokeWidth="7"
            />
            <path
              d="M40 360 L188 228 L295 206 L390 120 L522 155 L740 17 M126 26 L270 75 L347 204 L470 280 L710 350 M12 272 L170 266 L350 202 L485 154 L620 285 L795 273"
              stroke="#fffdf4"
              strokeWidth="4"
            />
            {[
              'M350 204 L388 186 L421 179 L450 153 L485 154',
              'M350 204 L320 159 L298 113 L272 74',
              'M350 204 L420 229 L470 280 L550 293 L621 285',
              'M350 204 L302 220 L239 245 L170 266',
            ].map((path, i) => (
              <path
                key={path}
                d={path}
                stroke={nodes[i].color}
                strokeWidth="3.5"
                strokeDasharray={nodes[i].status === 'Approved' ? undefined : '6 5'}
              />
            ))}
            <path d="M350 204 L355 304 L401 370" stroke="#267663" strokeWidth="4" />
          </g>
          <g fill="#899483" fontSize="9" fontFamily="inherit" letterSpacing="1.5">
            <text x="70" y="82">
              SATPURA FOOTHILLS
            </text>
            <text x="562" y="67">
              FOREST CORRIDOR
            </text>
            <text x="61" y="337">
              WESTERN GHATS
            </text>
          </g>
          <text x="479" y="242" fontSize="9" fill="#80a1ac" transform="rotate(-7 479 242)">
            River corridor
          </text>
          <circle cx="350" cy="204" r="23" fill="#24715f" opacity=".1" />
          <circle cx="350" cy="204" r="14" fill="white" filter="url(#node-shadow)" />
          <rect x="343" y="197" width="14" height="14" rx="4" fill="#205e50" />
          <path d="M347 204h6m-3-3v6" stroke="white" strokeWidth="1.5" />
          <text x="350" y="241" textAnchor="middle" fontSize="11" fill="#3b5148" fontWeight="600">
            Regional fiber hub
          </text>
          {nodes.map((n) => (
            <g
              key={n.name}
              className="map-node"
              role="button"
              tabIndex="0"
              aria-label={`Inspect ${n.name} sample route`}
              onClick={() => setSelected(n.name)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setSelected(n.name);
                }
              }}
            >
              <circle
                cx={n.x}
                cy={n.y}
                r="18"
                fill={n.color}
                opacity={selected === n.name ? '.18' : '.07'}
              />
              <circle cx={n.x} cy={n.y} r="7" fill="white" stroke={n.color} strokeWidth="3" />
              <text x={n.x + 15} y={n.y + 4} fill="#40524b" fontSize="11" fontWeight="600">
                {n.name}
              </text>
            </g>
          ))}
        </g>
      </svg>
      <div className="map-zoom">
        <button aria-label="Zoom in on network" onClick={() => setZoom(Math.min(1.7, zoom + 0.2))}>
          <Plus size={16} />
        </button>
        <button aria-label="Zoom out of network" onClick={() => setZoom(Math.max(0.8, zoom - 0.2))}>
          <Minus size={16} />
        </button>
        <button aria-label="Reset network view" onClick={() => setZoom(1)}>
          <LocateFixed size={16} />
        </button>
      </div>
      <div className="map-selection">
        <span className="route-dot" style={{ background: active.color }} />
        <div>
          <b>{active.name}</b>
          <small>{active.label}</small>
        </div>
        <button
          className="icon-button"
          aria-label={`Open ${active.name} route details`}
          onClick={() => onExplore(active.name)}
        >
          <ArrowUpRight size={17} />
        </button>
      </div>
      <div className="map-bottom">
        <span>
          <i className="legend-line" /> Approved <i className="legend-line amber" /> Needs survey{' '}
          <i className="legend-line gray" /> Planned
        </span>
        <small>Illustrative · not to scale</small>
      </div>
    </div>
  );
}
