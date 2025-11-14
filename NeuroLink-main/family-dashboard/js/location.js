import { supabaseClient } from "./supabase.js";

let map;
let marker;
let locationChannel;

export function loadLocationMap() {
  if (map) {
    map.remove();
    map = null;
    marker = null;
  }
  setTimeout(initMap, 0);
  fetchLatestLocation();
  subscribeRealtime();
}

function initMap() {
  if (map) {
    map.invalidateSize();
    return;
  }
  const mapElement = document.getElementById("map");
  if (!mapElement) return;
  map = L.map("map").setView([0, 0], 2);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors",
  }).addTo(map);
}

async function fetchLatestLocation() {
  const patientId = window.dashboardContext?.patientId;
  if (!patientId) return;

  const { data } = await supabaseClient
    .from("locations")
    .select("*")
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (data) {
    updateMap(data);
  } else {
    document.getElementById("location-time").textContent =
      "Last update: No data";
    document.getElementById("location-accuracy").textContent = "Accuracy: —";
    document.getElementById("location-coords").textContent = "Coords: —";
  }
}

function subscribeRealtime() {
  if (locationChannel) return;
  locationChannel = supabaseClient
    .channel("locations-feed")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "locations" },
      (payload) => {
        if (
          payload.new.patient_id === window.dashboardContext?.patientId &&
          document.getElementById("map")
        ) {
          updateMap(payload.new);
        }
      }
    )
    .subscribe();
}

function updateMap(location) {
  if (!map) {
    initMap();
  }
  const coords = [location.lat, location.lon];
  if (!marker) {
    marker = L.marker(coords).addTo(map);
  } else {
    marker.setLatLng(coords);
  }
  map.setView(coords, 15);

  document.getElementById(
    "location-time"
  ).textContent = `Last update: ${new Date(
    location.created_at
  ).toLocaleString()}`;
  document.getElementById(
    "location-accuracy"
  ).textContent = `Accuracy: ${location.accuracy || "N/A"} m`;
  document.getElementById(
    "location-coords"
  ).textContent = `Coords: ${location.lat.toFixed(4)}, ${location.lon.toFixed(
    4
  )}`;
}

