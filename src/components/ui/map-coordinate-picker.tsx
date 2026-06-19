import { useEffect, useRef } from 'react'
import type { LeafletMouseEvent, Map as LeafletMap, Marker as LeafletMarker } from 'leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

type MapCoordinatePickerProps = {
  lat: number
  lng: number
  onChange: (value: { lat: number; lng: number }) => void
  className?: string
  zoom?: number
}

const DEFAULT_CENTER = { lat: 33.5138, lng: 36.2765 }

// Fix default marker icons for bundlers.
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

export function MapCoordinatePicker({
  lat,
  lng,
  onChange,
  className,
  zoom = 12,
}: MapCoordinatePickerProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<LeafletMap | null>(null)
  const markerRef = useRef<LeafletMarker | null>(null)

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) {
      return
    }

    const initialLat = Number.isFinite(lat) ? lat : DEFAULT_CENTER.lat
    const initialLng = Number.isFinite(lng) ? lng : DEFAULT_CENTER.lng

    const map = L.map(mapContainerRef.current).setView([initialLat, initialLng], zoom)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map)

    const marker = L.marker([initialLat, initialLng], { draggable: true }).addTo(map)

    marker.on('dragend', () => {
      const position = marker.getLatLng()
      onChange({
        lat: Number(position.lat.toFixed(6)),
        lng: Number(position.lng.toFixed(6)),
      })
    })

    map.on('click', (event: LeafletMouseEvent) => {
      const nextLat = Number(event.latlng.lat.toFixed(6))
      const nextLng = Number(event.latlng.lng.toFixed(6))
      marker.setLatLng([nextLat, nextLng])
      onChange({ lat: nextLat, lng: nextLng })
    })

    mapRef.current = map
    markerRef.current = marker

    return () => {
      markerRef.current?.remove()
      mapRef.current?.remove()
      markerRef.current = null
      mapRef.current = null
    }
  }, [lat, lng, onChange, zoom])

  useEffect(() => {
    if (!mapRef.current || !markerRef.current || !Number.isFinite(lat) || !Number.isFinite(lng)) {
      return
    }

    markerRef.current.setLatLng([lat, lng])
  }, [lat, lng])

  return (
    <div
      ref={mapContainerRef}
      className={className ?? 'h-72 w-full overflow-hidden rounded-md border border-border'}
    />
  )
}
