import { useEffect, useMemo, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../styles/osm-map.css';
import type { Language, Project } from '../types/project';

interface ProjectsOpenStreetMapProps {
  projects: Project[];
  language: Language;
  onSelect: (project: Project) => void;
}

const copy = {
  ar: {
    mapTab: 'خريطة المشاريع',
    mapTitle: 'خريطة مشاريع الطاقة في سوريا',
    mapLead: 'خريطة تفاعلية حقيقية مبنية على OpenStreetMap لعرض مواقع المشاريع المنشورة. اضغط على أي نقطة لفتح البطاقة التفصيلية.',
    mapLegend: 'المشاريع على الخريطة',
    mapHint: 'يمكنك التكبير، التحريك، والضغط على أي نقطة مشروع.',
    capacity: 'الاستطاعة',
    city: 'الموقع'
  },
  en: {
    mapTab: 'Projects map',
    mapTitle: 'Energy projects map of Syria',
    mapLead: 'A real interactive OpenStreetMap-based map showing published project locations. Click any marker to open the detailed project card.',
    mapLegend: 'Projects on the map',
    mapHint: 'You can zoom, pan, and click any project marker.',
    capacity: 'Capacity',
    city: 'Location'
  }
};

function isValidCoordinate(project: Project) {
  const lat = Number(project.latitude);
  const lon = Number(project.longitude);
  return Number.isFinite(lat) && Number.isFinite(lon) && lat >= 32 && lat <= 38 && lon >= 35 && lon <= 43;
}

function markerTone(status: string) {
  if (status === 'operational' || status === 'completed') return 'green';
  if (status === 'planned' || status === 'under-construction') return 'blue';
  if (status === 'repair') return 'orange';
  return 'gray';
}

function makeIcon(index: number, status: string) {
  return L.divIcon({
    className: `osm-project-marker osm-marker-${markerTone(status)}`,
    html: `<span>${index}</span>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17]
  });
}

export default function ProjectsOpenStreetMap({ projects, language, onSelect }: ProjectsOpenStreetMapProps) {
  const t = copy[language];
  const mapNodeRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);

  const mappedProjects = useMemo(() => projects.filter(isValidCoordinate), [projects]);

  useEffect(() => {
    if (!mapNodeRef.current || mapRef.current) return;

    const map = L.map(mapNodeRef.current, {
      center: [35.1, 38.4],
      zoom: 6,
      minZoom: 5,
      maxZoom: 13,
      scrollWheelZoom: true,
      zoomControl: true
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map);

    mapRef.current = map;
    layerRef.current = L.layerGroup().addTo(map);

    return () => {
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();
    const bounds: L.LatLngExpression[] = [];

    mappedProjects.forEach((project, index) => {
      const lat = Number(project.latitude);
      const lon = Number(project.longitude);
      const title = language === 'ar' ? project.title_ar : project.title_en;
      const city = language === 'ar' ? project.city_ar : project.city_en;
      const marker = L.marker([lat, lon], { icon: makeIcon(index + 1, project.status) });

      marker.bindTooltip(title, {
        direction: 'top',
        offset: [0, -12],
        opacity: 0.95,
        className: 'osm-project-tooltip'
      });

      marker.bindPopup(`
        <div class="osm-popup-card">
          <strong>${title}</strong>
          <small>${t.city}: ${city || '-'}</small>
          <small>${t.capacity}: ${project.capacity || '-'}</small>
        </div>
      `);

      marker.on('click', () => onSelect(project));
      marker.addTo(layer);
      bounds.push([lat, lon]);
    });

    if (bounds.length > 1) {
      map.fitBounds(bounds, { padding: [44, 44], maxZoom: 8 });
    } else if (bounds.length === 1) {
      map.setView(bounds[0], 8);
    } else {
      map.setView([35.1, 38.4], 6);
    }

    setTimeout(() => map.invalidateSize(), 80);
  }, [mappedProjects, language, onSelect, t.capacity, t.city]);

  return (
    <section className="projects-map-dashboard osm-dashboard">
      <div className="map-hero-card osm-hero-card">
        <span className="eyebrow">⌖ {t.mapTab}</span>
        <h2>{t.mapTitle}</h2>
        <p>{t.mapLead}</p>
      </div>

      <div className="osm-map-layout">
        <div className="osm-map-card">
          <div ref={mapNodeRef} className="osm-map-canvas" aria-label={t.mapTitle} />
          <p className="map-hint">{t.mapHint}</p>
        </div>

        <aside className="map-project-list osm-side-list">
          <h3>{t.mapLegend} ({mappedProjects.length})</h3>
          <div>
            {mappedProjects.map((project, index) => (
              <button key={project.id} className="map-list-item" onClick={() => onSelect(project)}>
                <span>{index + 1}</span>
                <strong>{language === 'ar' ? project.title_ar : project.title_en}</strong>
                <small>{language === 'ar' ? project.city_ar : project.city_en} · {project.capacity}</small>
              </button>
            ))}
          </div>
        </aside>
      </div>
    </section>
  );
}
